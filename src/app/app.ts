import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type View = 'login' | 'dashboard' | 'create' | 'detail' | 'admin';
type UserRole = 'Owner' | 'Evaluator' | 'Manager' | 'Admin';
type WorkflowState = 'Evaluation' | 'Approval to Implement' | 'Implementation' | 'PSSR' | 'Ready for Closure' | 'Closed';
type ActionPhase = 'Evaluation' | 'Pre-Startup' | 'Post-Startup';

interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  discipline?: string;
}

interface MocRecord {
  id: string;
  description: string;
  title: string;
  basis: string;
  disciplines: string[];
  supportingDocumentName: string;
  implementationDate: string;
  ownerId: string;
  evaluatorIds: string[];
  managerId: string;
  evaluations: EvaluationTask[];
  pssrChecklist: ChecklistItem[];
  actionItems: ActionItem[];
  workflowState: WorkflowState;
  status: 'Open' | 'Closed';
  waitingOn: string;
  workflowHistory: WorkflowEvent[];
  actionFlag: '' | 'Owner' | 'Evaluator' | 'Action Owner' | 'Complete';
  createdDate: string;
  lastUpdatedDate: string;
  closureDate?: string;
  closedByUserId?: string;
}

interface WorkflowEvent {
  id: string;
  at: string;
  step: WorkflowState | 'Initiated';
  byUserId: string;
  assignedToUserIds: string[];
  note: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
  complete: boolean;
}

interface EvaluationTask {
  id: string;
  discipline: string;
  evaluatorId: string;
  complete: boolean;
  actionRequired: boolean | null;
  checklist: ChecklistItem[];
}

interface ActionItem {
  id: string;
  phase: ActionPhase;
  description: string;
  assigneeId: string;
  dueDate: string;
  complete: boolean;
  reviewedByEvaluator: boolean;
  createdBy: string;
  comments?: string;
  evidenceFileName?: string;
}

interface InitiationForm {
  title: string;
  description: string;
  basis: string;
  disciplines: string[];
  supportingDocumentName: string;
  implementationDate: string;
}

interface ChecklistTemplates {
  evaluation: Record<string, string[]>;
  pssr: string[];
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly storageKey = 'mocAngularRbacPrototype.v6';
  readonly checklistKey = 'mocAngularChecklistTemplates.v1';
  readonly sessionKey = 'mocAngularRbacSession.v1';
  readonly disciplineOptions = ['Mechanical', 'Process', 'Electrical', 'Operations', 'HSE', 'Instrumentation'];
  readonly users: DemoUser[] = [
    { id: 'owner1', name: 'Olivia Owner', role: 'Owner' },
    { id: 'owner2', name: 'Owen Owner', role: 'Owner' },
    { id: 'mech1', name: 'Mike Mechanical', role: 'Evaluator', discipline: 'Mechanical' },
    { id: 'process1', name: 'Priya Process', role: 'Evaluator', discipline: 'Process' },
    { id: 'env1', name: 'Evan Environmental', role: 'Evaluator', discipline: 'Environmental' },
    { id: 'hse1', name: 'Harper HSE', role: 'Evaluator', discipline: 'HSE' },
    { id: 'ops1', name: 'Oscar Operations', role: 'Evaluator', discipline: 'Operations' },
    { id: 'manager1', name: 'Morgan Manager', role: 'Manager' },
    { id: 'admin1', name: 'Ada Admin', role: 'Admin' },
  ];
  readonly loginHighlights = [
    'Initiate MOC from any role',
    'Evaluate discipline checklist',
    'Route action items back for evaluator review',
    'Track owner, manager, PSSR, and closure handoffs',
  ];

  view: View = 'login';
  selectedUserId = 'owner1';
  currentUser: DemoUser | null = this.loadSession();
  selectedMoc: MocRecord | null = null;
  submitAttempted = false;
  isSubmitting = false;
  form: InitiationForm = this.blankForm();
  newAction: Pick<ActionItem, 'phase' | 'description' | 'assigneeId' | 'dueDate'> = this.blankAction();
  actionComments: Record<string, string> = {};
  actionEvidence: Record<string, string> = {};
  checklistTemplates: ChecklistTemplates = this.loadChecklistTemplates();
  records: MocRecord[] = this.loadRecords();

  constructor() {
    if (this.currentUser) {
      this.selectedUserId = this.currentUser.id;
      this.view = 'dashboard';
    }
  }

  get visibleRecords(): MocRecord[] {
    if (!this.currentUser) return [];
    if (this.currentUser.role === 'Admin') return this.records;
    if (this.currentUser.role === 'Owner') return this.records.filter((record) => record.ownerId === this.currentUser?.id);
    if (this.currentUser.role === 'Evaluator') {
      return this.records.filter(
        (record) =>
          record.evaluatorIds.includes(this.currentUser?.id ?? '') ||
          record.actionItems.some((item) => item.assigneeId === this.currentUser?.id || item.createdBy === this.currentUser?.id) ||
          (this.currentUser?.discipline === 'Operations' && record.workflowState === 'PSSR'),
      );
    }
    return this.records.filter(
      (record) => record.managerId === this.currentUser?.id && record.workflowState === 'Approval to Implement',
    );
  }

  get totalMocs(): number {
    return this.visibleRecords.length;
  }

  get pendingReview(): number {
    return this.visibleRecords.filter((record) => record.workflowState !== 'Closed').length;
  }

  get waitingOnOthers(): number {
    return this.visibleRecords.filter((record) => record.waitingOn !== '-' && record.status !== 'Closed').length;
  }

  get closedMocs(): number {
    return this.visibleRecords.filter((record) => record.status === 'Closed').length;
  }

  get minDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  get currentRoleLabel(): string {
    return this.currentUser ? `${this.currentUser.role}${this.currentUser.discipline ? ` - ${this.currentUser.discipline}` : ''}` : 'Not signed in';
  }

  login(): void {
    this.currentUser = this.users.find((user) => user.id === this.selectedUserId) ?? this.users[0];
    localStorage.setItem(this.sessionKey, this.currentUser.id);
    this.openDashboard();
  }

  quickLogin(user: DemoUser): void {
    this.selectedUserId = user.id;
    this.login();
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    this.currentUser = null;
    this.selectedMoc = null;
    this.view = 'login';
  }

  openDashboard(): void {
    this.view = this.currentUser ? 'dashboard' : 'login';
    this.selectedMoc = null;
    this.submitAttempted = false;
  }

  openCreate(): void {
    if (!this.currentUser || !this.canInitiate()) return;
    this.form = this.blankForm();
    this.submitAttempted = false;
    this.isSubmitting = false;
    this.selectedMoc = null;
    this.view = 'create';
  }

  openAdmin(): void {
    if (this.currentUser?.role !== 'Admin') return;
    this.view = 'admin';
    this.selectedMoc = null;
  }

  openDetail(record: MocRecord): void {
    if (!this.canView(record)) return;
    this.selectedMoc = record;
    this.newAction = { ...this.blankAction(), assigneeId: record.ownerId };
    this.submitAttempted = false;
    this.view = 'detail';
  }

  cancelCreate(): void {
    this.form = this.blankForm();
    this.openDashboard();
  }

  canInitiate(): boolean {
    return Boolean(this.currentUser);
  }

  canView(record: MocRecord): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'Admin') return true;
    if (this.currentUser.role === 'Owner') return record.ownerId === this.currentUser.id;
    if (this.currentUser.role === 'Evaluator') {
      return (
        record.evaluatorIds.includes(this.currentUser.id) ||
        record.actionItems.some((item) => item.assigneeId === this.currentUser?.id || item.createdBy === this.currentUser?.id) ||
        (this.currentUser.discipline === 'Operations' && record.workflowState === 'PSSR')
      );
    }
    return record.managerId === this.currentUser.id && record.workflowState === 'Approval to Implement';
  }

  waitingOnFor(record: MocRecord): string {
    if (record.status === 'Closed') return '-';
    if (record.waitingOn) return record.waitingOn;
    if (record.workflowState === 'Evaluation') return 'Evaluator';
    if (record.workflowState === 'Approval to Implement') return 'Manager';
    if (record.workflowState === 'Implementation') return 'Owner';
    if (record.workflowState === 'PSSR') return 'Operations';
    if (record.workflowState === 'Ready for Closure') return 'Owner';
    return '-';
  }

  currentAssignedTo(record: MocRecord): string {
    return this.currentAssignedUserIds(record)
      .map((id) => this.userName(id))
      .join(', ') || '-';
  }

  nextRouteLabel(record: MocRecord): string {
    if (record.status === 'Closed') return 'Workflow complete';
    const assignedTo = this.currentAssignedTo(record);
    if (record.workflowState === 'Evaluation') return `Evaluation assigned to ${assignedTo}`;
    if (record.workflowState === 'Approval to Implement') return `Approval assigned to ${assignedTo}`;
    if (record.workflowState === 'Implementation') return `Implementation assigned to ${assignedTo}`;
    if (record.workflowState === 'PSSR') return `PSSR assigned to ${assignedTo}`;
    if (record.workflowState === 'Ready for Closure') return `Closure assigned to ${assignedTo}`;
    return assignedTo;
  }

  checklistText(discipline: string): string {
    return (this.checklistTemplates.evaluation[discipline] ?? []).join('\n');
  }

  updateChecklistText(discipline: string, value: string): void {
    this.checklistTemplates.evaluation[discipline] = this.linesFromText(value);
  }

  pssrChecklistText(): string {
    return this.checklistTemplates.pssr.join('\n');
  }

  updatePssrChecklistText(value: string): void {
    this.checklistTemplates.pssr = this.linesFromText(value);
  }

  saveChecklistTemplates(): void {
    localStorage.setItem(this.checklistKey, JSON.stringify(this.checklistTemplates));
  }

  userName(userId: string): string {
    return this.users.find((user) => user.id === userId)?.name ?? userId;
  }

  userList(userIds: string[]): string {
    return userIds.map((id) => this.userName(id)).join(', ');
  }

  evaluatorNames(record: MocRecord): string {
    return record.evaluatorIds.map((id) => this.userName(id)).join(', ');
  }

  evaluatorTask(record: MocRecord): EvaluationTask | null {
    if (!this.currentUser) return null;
    return record.evaluations.find((task) => task.evaluatorId === this.currentUser?.id) ?? null;
  }

  pendingReviewActions(record: MocRecord): ActionItem[] {
    return record.actionItems.filter((item) => item.phase === 'Evaluation' && item.complete && !item.reviewedByEvaluator);
  }

  canReviewAction(item: ActionItem): boolean {
    return Boolean(this.currentUser && item.complete && !item.reviewedByEvaluator && item.createdBy === this.currentUser.id);
  }

  canCompleteAction(record: MocRecord, item: ActionItem): boolean {
    if (!this.currentUser || item.complete) return false;
    return item.assigneeId === this.currentUser.id || this.currentUser.role === 'Admin' || this.currentUser.id === record.ownerId;
  }

  canSubmitActionCompletion(record: MocRecord, item: ActionItem): boolean {
    return this.canCompleteAction(record, item) && Boolean(this.actionComments[item.id]?.trim()) && Boolean(this.actionEvidence[item.id]);
  }

  canEvaluate(record: MocRecord): boolean {
    const task = this.evaluatorTask(record);
    return Boolean(this.currentUser?.role === 'Evaluator' && task && !task.complete && record.workflowState === 'Evaluation');
  }

  canShowWorkflowActions(record: MocRecord): boolean {
    return (
      this.canSubmitForApproval(record) ||
      this.canApproveToImplement(record) ||
      this.canMarkImplemented(record) ||
      this.canCompletePssr(record) ||
      this.canClose(record)
    );
  }

  setActionRequired(task: EvaluationTask, required: boolean): void {
    task.actionRequired = required;
    this.touchSelectedMoc();
  }

  evaluatorCreatedAction(record: MocRecord, task: EvaluationTask): boolean {
    return record.actionItems.some((item) => item.phase === 'Evaluation' && item.createdBy === task.evaluatorId);
  }

  toggleChecklist(item: ChecklistItem, checked: boolean): void {
    item.complete = checked;
    this.touchSelectedMoc();
  }

  canCompleteEvaluation(task: EvaluationTask): boolean {
    if (task.complete || !task.checklist.every((item) => !item.required || item.complete)) return false;
    if (task.actionRequired === null) return false;
    if (task.actionRequired) return Boolean(this.selectedMoc && this.evaluatorCreatedAction(this.selectedMoc, task));
    return true;
  }

  completeEvaluation(record: MocRecord, task: EvaluationTask): void {
    if (!this.canCompleteEvaluation(task)) return;
    task.complete = true;
    this.addHistory(record, 'Evaluation', `Evaluation completed for ${task.discipline}.`);
    this.recalculateRecordState(record);
    this.saveRecords();
  }

  createActionItem(record: MocRecord): void {
    if (!this.currentUser || !this.newAction.description.trim() || !this.newAction.assigneeId || !this.newAction.dueDate) return;

    record.actionItems = [
      ...record.actionItems,
      {
        id: `AI${Date.now()}`,
        phase: this.newAction.phase,
        description: this.newAction.description.trim(),
        assigneeId: this.newAction.assigneeId,
        dueDate: this.newAction.dueDate,
        complete: false,
        reviewedByEvaluator: false,
        createdBy: this.currentUser.id,
      },
    ];

    this.newAction = { ...this.blankAction(), assigneeId: record.ownerId };
    this.addHistory(record, record.workflowState, `Action item assigned to ${this.userName(record.actionItems[record.actionItems.length - 1].assigneeId)}.`);
    this.recalculateRecordState(record);
    this.saveRecords();
  }

  completeAction(record: MocRecord, item: ActionItem): void {
    if (!this.currentUser) return;
    if (!this.canSubmitActionCompletion(record, item)) return;
    item.complete = true;
    item.reviewedByEvaluator = item.phase !== 'Evaluation';
    const comment = this.actionComments[item.id]?.trim();
    item.evidenceFileName = this.actionEvidence[item.id] || undefined;
    item.comments = comment ? `${comment} - ${this.currentUser.name}` : `Completed by ${this.currentUser.name}`;
    delete this.actionComments[item.id];
    delete this.actionEvidence[item.id];
    this.addHistory(record, record.workflowState, `Action item completed by ${this.currentUser.name}.`);
    this.recalculateRecordState(record);
    this.saveRecords();
  }

  reviewAction(record: MocRecord, item: ActionItem): void {
    if (!this.canReviewAction(item)) return;
    item.reviewedByEvaluator = true;
    item.comments = `Reviewed by ${this.currentUser?.name}`;
    this.addHistory(record, record.workflowState, `Evaluator reviewed completed action item.`);
    this.recalculateRecordState(record);
    this.saveRecords();
  }

  canSubmitForApproval(record: MocRecord): boolean {
    return (
      Boolean(this.currentUser && (this.currentUser.id === record.ownerId || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'Evaluation' &&
      record.evaluations.every((task) => task.complete) &&
      !record.actionItems.some((item) => item.phase === 'Evaluation' && (!item.complete || !item.reviewedByEvaluator))
    );
  }

  canCreatePostStartupAction(record: MocRecord): boolean {
    return Boolean(
      this.currentUser &&
        record.workflowState === 'Evaluation' &&
        record.actionItems.some((item) => item.phase === 'Evaluation' && item.assigneeId === this.currentUser?.id && item.complete),
    );
  }

  canCreateActionItem(record: MocRecord): boolean {
    const task = this.evaluatorTask(record);
    return Boolean((this.canEvaluate(record) && task?.actionRequired) || this.canCreatePostStartupAction(record));
  }

  onEvidenceSelected(event: Event, item: ActionItem): void {
    const input = event.target as HTMLInputElement;
    this.actionEvidence[item.id] = input.files?.[0]?.name ?? '';
  }

  submitForApproval(record: MocRecord): void {
    if (!this.canSubmitForApproval(record)) return;
    record.workflowState = 'Approval to Implement';
    record.waitingOn = 'Manager';
    record.actionFlag = '';
    this.finishWorkflowUpdate(record, 'Submitted for manager approval.');
  }

  canApproveToImplement(record: MocRecord): boolean {
    return Boolean(
      this.currentUser &&
        (this.currentUser.id === record.managerId || this.currentUser.role === 'Admin') &&
        record.workflowState === 'Approval to Implement',
    );
  }

  approveToImplement(record: MocRecord): void {
    if (!this.canApproveToImplement(record)) return;
    record.workflowState = 'Implementation';
    record.waitingOn = 'Owner';
    record.actionFlag = 'Owner';
    this.finishWorkflowUpdate(record, 'Approved to implement.');
  }

  canMarkImplemented(record: MocRecord): boolean {
    return (
      Boolean(this.currentUser && (this.currentUser.id === record.ownerId || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'Implementation' &&
      !record.actionItems.some((item) => item.phase === 'Pre-Startup' && !item.complete)
    );
  }

  markImplemented(record: MocRecord): void {
    if (!this.canMarkImplemented(record)) return;
    record.workflowState = 'PSSR';
    record.waitingOn = 'Operations';
    record.actionFlag = '';
    this.finishWorkflowUpdate(record, 'Implementation completed. Routed to PSSR.');
  }

  canCompletePssr(record: MocRecord): boolean {
    return (
      Boolean(this.currentUser && (this.currentUser.discipline === 'Operations' || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'PSSR' &&
      record.pssrChecklist.every((item) => !item.required || item.complete) &&
      !record.actionItems.some((item) => item.phase === 'Pre-Startup' && !item.complete)
    );
  }

  pssrComplete(record: MocRecord): boolean {
    return record.pssrChecklist.every((item) => item.complete);
  }

  completePssr(record: MocRecord): void {
    if (!this.canCompletePssr(record)) return;
    record.workflowState = 'Ready for Closure';
    record.waitingOn = 'Owner';
    record.actionFlag = 'Owner';
    this.finishWorkflowUpdate(record, 'PSSR completed. Routed to owner for closure.');
  }

  canClose(record: MocRecord): boolean {
    return (
      Boolean(this.currentUser && (this.currentUser.id === record.ownerId || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'Ready for Closure' &&
      record.evaluations.every((task) => task.complete) &&
      record.pssrChecklist.every((item) => !item.required || item.complete) &&
      !record.actionItems.some((item) => !item.complete)
    );
  }

  closeMoc(record: MocRecord): void {
    if (!this.canClose(record)) return;
    record.workflowState = 'Closed';
    record.status = 'Closed';
    record.waitingOn = '-';
    record.actionFlag = 'Complete';
    record.closureDate = new Date().toISOString();
    record.closedByUserId = this.currentUser?.id;
    this.finishWorkflowUpdate(record, 'MOC closed.');
  }

  togglePssrChecklist(item: ChecklistItem, checked: boolean): void {
    item.complete = checked;
    this.touchSelectedMoc();
  }

  toggleDiscipline(discipline: string, checked: boolean): void {
    if (checked && !this.form.disciplines.includes(discipline)) {
      this.form.disciplines = [...this.form.disciplines, discipline];
    }
    if (!checked) {
      this.form.disciplines = this.form.disciplines.filter((item) => item !== discipline);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.form.supportingDocumentName = file?.name ?? '';
  }

  submitMoc(): void {
    this.submitAttempted = true;
    if (!this.currentUser || !this.isFormValid() || this.isSubmitting) return;

    this.isSubmitting = true;
    const now = new Date().toISOString();
    const record: MocRecord = {
      id: this.nextMocId(),
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      basis: this.form.basis.trim(),
      disciplines: [...this.form.disciplines],
      supportingDocumentName: this.form.supportingDocumentName,
      implementationDate: this.form.implementationDate,
      ownerId: this.currentUser.id,
      evaluatorIds: this.form.disciplines.map((discipline) => this.evaluatorForDiscipline(discipline)),
      managerId: 'manager1',
      evaluations: this.form.disciplines.map((discipline) => this.makeEvaluationTask(discipline)),
      pssrChecklist: this.makePssrChecklist(false),
      actionItems: [],
      workflowState: 'Evaluation',
      status: 'Open',
      waitingOn: 'Evaluator',
      workflowHistory: [
        {
          id: `H${Date.now()}`,
          at: now,
          step: 'Initiated',
          byUserId: this.currentUser.id,
          assignedToUserIds: this.form.disciplines.map((discipline) => this.evaluatorForDiscipline(discipline)),
          note: 'MOC initiated and routed for evaluation.',
        },
      ],
      actionFlag: '',
      createdDate: now,
      lastUpdatedDate: now,
    };

    this.records = [record, ...this.records];
    this.saveRecords();
    this.form = this.blankForm();
    this.selectedMoc = record;
    this.view = 'detail';
    this.isSubmitting = false;
  }

  resetDummyData(): void {
    this.records = this.seedRecords();
    this.saveRecords();
    this.openDashboard();
  }

  isDisciplineSelected(discipline: string): boolean {
    return this.form.disciplines.includes(discipline);
  }

  showError(field: keyof InitiationForm): boolean {
    if (!this.submitAttempted) return false;
    if (field === 'disciplines') return this.form.disciplines.length === 0;
    return !String(this.form[field] ?? '').trim();
  }

  isPastDate(): boolean {
    return Boolean(this.form.implementationDate && this.form.implementationDate < this.minDate);
  }

  private isFormValid(): boolean {
    return Boolean(
      this.form.title.trim() &&
        this.form.description.trim() &&
        this.form.basis.trim() &&
        this.form.disciplines.length &&
        this.form.supportingDocumentName &&
        this.form.implementationDate &&
        !this.isPastDate(),
    );
  }

  private evaluatorForDiscipline(discipline: string): string {
    if (discipline === 'Mechanical' || discipline === 'Electrical' || discipline === 'Instrumentation') return 'mech1';
    if (discipline === 'Process') return 'process1';
    if (discipline === 'HSE') return 'hse1';
    return 'ops1';
  }

  private makeEvaluationTask(discipline: string): EvaluationTask {
    return {
      id: `EV-${discipline.replace(/\s+/g, '-')}`,
      discipline,
      evaluatorId: this.evaluatorForDiscipline(discipline),
      complete: false,
      actionRequired: null,
      checklist: (this.checklistTemplates.evaluation[discipline] ?? this.defaultChecklist(discipline)).map((text, index) => ({
        id: `${discipline}-${index + 1}`,
        text,
        required: true,
        complete: false,
      })),
    };
  }

  private makePssrChecklist(complete: boolean): ChecklistItem[] {
    return this.checklistTemplates.pssr.map((text, index) => ({
      id: `PSSR-${index + 1}`,
      text,
      required: true,
      complete,
    }));
  }

  private defaultChecklist(discipline: string): string[] {
    if (discipline === 'Mechanical') return ['Mechanical integrity reviewed', 'Replacement materials verified'];
    if (discipline === 'Process') return ['Process conditions reviewed', 'Operating limits evaluated', 'Regulatory impacts considered'];
    if (discipline === 'Operations') return ['Operations impact reviewed', 'Procedure update need identified'];
    if (discipline === 'HSE') return ['HSE impact reviewed', 'Environmental or permit impact considered'];
    if (discipline === 'Electrical') return ['Electrical isolation reviewed', 'Electrical design basis checked'];
    return ['Instrumentation impact reviewed', 'Control and alarm impact checked'];
  }

  private blankAction(): Pick<ActionItem, 'phase' | 'description' | 'assigneeId' | 'dueDate'> {
    return { phase: 'Evaluation', description: '', assigneeId: 'env1', dueDate: '' };
  }

  private recalculateRecordState(record: MocRecord): void {
    const openEvaluationActions = record.actionItems.some((item) => item.phase === 'Evaluation' && !item.complete);
    const evaluationActionsAwaitingReview = this.pendingReviewActions(record).length > 0;
    const allEvaluationsComplete = record.evaluations.every((task) => task.complete);

    if (record.workflowState === 'Evaluation' && allEvaluationsComplete && !openEvaluationActions && !evaluationActionsAwaitingReview) {
      record.waitingOn = 'Owner';
      record.actionFlag = 'Owner';
    } else if (record.workflowState === 'Evaluation') {
      record.waitingOn = openEvaluationActions ? 'Action Owner' : 'Evaluator';
      record.actionFlag = openEvaluationActions ? 'Action Owner' : evaluationActionsAwaitingReview ? 'Evaluator' : '';
    }

    record.lastUpdatedDate = new Date().toISOString();
  }

  private touchSelectedMoc(): void {
    if (!this.selectedMoc) return;
    this.selectedMoc.lastUpdatedDate = new Date().toISOString();
    this.saveRecords();
  }

  private finishWorkflowUpdate(record: MocRecord, note: string): void {
    record.lastUpdatedDate = new Date().toISOString();
    this.addHistory(record, record.workflowState, note);
    this.selectedMoc = record;
    this.saveRecords();
  }

  private currentAssignedUserIds(record: MocRecord): string[] {
    if (record.workflowState === 'Evaluation') {
      const openActionAssignees = record.actionItems
        .filter((item) => item.phase === 'Evaluation' && !item.complete)
        .map((item) => item.assigneeId);
      if (openActionAssignees.length) return [...new Set(openActionAssignees)];
      const reviewEvaluators = this.pendingReviewActions(record).map((item) => item.createdBy);
      if (reviewEvaluators.length) return [...new Set(reviewEvaluators)];
      const openEvaluators = record.evaluations.filter((task) => !task.complete).map((task) => task.evaluatorId);
      return openEvaluators.length ? [...new Set(openEvaluators)] : [record.ownerId];
    }
    if (record.workflowState === 'Approval to Implement') return [record.managerId];
    if (record.workflowState === 'Implementation') return [record.ownerId];
    if (record.workflowState === 'PSSR') return ['ops1'];
    if (record.workflowState === 'Ready for Closure') {
      const openPostStartupAssignees = record.actionItems
        .filter((item) => item.phase === 'Post-Startup' && !item.complete)
        .map((item) => item.assigneeId);
      return openPostStartupAssignees.length ? [...new Set([record.ownerId, ...openPostStartupAssignees])] : [record.ownerId];
    }
    return [];
  }

  private addHistory(record: MocRecord, step: WorkflowEvent['step'], note: string): void {
    const byUserId = this.currentUser?.id ?? 'system';
    record.workflowHistory = [
      ...(record.workflowHistory ?? []),
      {
        id: `H${Date.now()}-${record.workflowHistory?.length ?? 0}`,
        at: new Date().toISOString(),
        step,
        byUserId,
        assignedToUserIds: this.currentAssignedUserIds(record),
        note,
      },
    ];
  }

  private blankForm(): InitiationForm {
    return { title: '', description: '', basis: '', disciplines: [], supportingDocumentName: '', implementationDate: '' };
  }

  private loadChecklistTemplates(): ChecklistTemplates {
    const defaults = this.defaultChecklistTemplates();
    try {
      const saved = JSON.parse(localStorage.getItem(this.checklistKey) ?? 'null') as ChecklistTemplates | null;
      if (saved?.evaluation && saved?.pssr?.length) return saved;
    } catch {
      // Use default checklist templates.
    }
    localStorage.setItem(this.checklistKey, JSON.stringify(defaults));
    return defaults;
  }

  private defaultChecklistTemplates(): ChecklistTemplates {
    return {
      evaluation: {
        Mechanical: ['Mechanical integrity reviewed', 'Replacement materials verified'],
        Process: ['Process conditions reviewed', 'Operating limits evaluated', 'Regulatory impacts considered'],
        Electrical: ['Electrical isolation reviewed', 'Electrical design basis checked'],
        Operations: ['Operations impact reviewed', 'Procedure update need identified'],
        HSE: ['HSE impact reviewed', 'Environmental or permit impact considered'],
        Instrumentation: ['Instrumentation impact reviewed', 'Control and alarm impact checked'],
      },
      pssr: ['Work completed per design', 'Area inspected and safe for startup'],
    };
  }

  private linesFromText(value: string): string[] {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  private deriveTitle(description: string): string {
    const trimmed = description.trim();
    return trimmed.length > 30 ? `${trimmed.slice(0, 30)}...` : trimmed;
  }

  private nextMocId(): string {
    const nextNumber =
      this.records
        .map((record) => Number(record.id.replace('MOC', '')))
        .filter((value) => Number.isFinite(value))
        .reduce((max, value) => Math.max(max, value), 122) + 1;
    return `MOC${String(nextNumber).padStart(6, '0')}`;
  }

  private loadSession(): DemoUser | null {
    const userId = localStorage.getItem(this.sessionKey);
    return this.users.find((user) => user.id === userId) ?? null;
  }

  private loadRecords(): MocRecord[] {
    try {
      const saved = JSON.parse(localStorage.getItem(this.storageKey) ?? 'null') as MocRecord[] | null;
      if (saved?.length) return saved;
    } catch {
      // Use seeded data if localStorage is unavailable or malformed.
    }
    const seeded = this.seedRecords();
    localStorage.setItem(this.storageKey, JSON.stringify(seeded));
    return seeded;
  }

  private saveRecords(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.records));
  }

  private seedRecords(): MocRecord[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'MOC000123',
        title: 'Pump seal replacement',
        description: 'Replace pump seal on P-101 due to recurring leakage.',
        basis: 'Maintenance reliability and safe operation.',
        disciplines: ['Mechanical'],
        supportingDocumentName: 'pump_seal_spec.pdf',
        implementationDate: '2026-06-30',
        ownerId: 'owner1',
        evaluatorIds: ['mech1'],
        managerId: 'manager1',
        evaluations: [this.seedEvaluation('Mechanical', 'mech1', false)],
        pssrChecklist: this.makePssrChecklist(false),
        actionItems: [],
        workflowState: 'Evaluation',
        status: 'Open',
        waitingOn: 'Evaluator',
        workflowHistory: [this.seedHistory(now, 'Initiated', 'owner1', ['mech1'], 'MOC initiated and routed to Mike Mechanical for evaluation.')],
        actionFlag: '',
        createdDate: now,
        lastUpdatedDate: now,
      },
      {
        id: 'MOC000124',
        title: 'Control valve upgrade',
        description: 'Install new control valve on gas line to improve flow control.',
        basis: 'Operational reliability.',
        disciplines: ['Mechanical', 'Process'],
        supportingDocumentName: 'valve_datasheet.pdf',
        implementationDate: '2026-07-15',
        ownerId: 'owner1',
        evaluatorIds: ['mech1', 'process1'],
        managerId: 'manager1',
        evaluations: [this.seedEvaluation('Mechanical', 'mech1', true), this.seedEvaluation('Process', 'process1', true)],
        pssrChecklist: this.makePssrChecklist(false),
        actionItems: [],
        workflowState: 'Approval to Implement',
        status: 'Open',
        waitingOn: 'Manager',
        workflowHistory: [
          this.seedHistory(now, 'Initiated', 'owner1', ['mech1', 'process1'], 'MOC initiated and routed for discipline evaluation.'),
          this.seedHistory(now, 'Approval to Implement', 'owner1', ['manager1'], 'Evaluation completed and routed to Morgan Manager.'),
        ],
        actionFlag: '',
        createdDate: now,
        lastUpdatedDate: now,
      },
      {
        id: 'MOC000125',
        title: 'Operations procedure update',
        description: 'Update area startup procedure to reflect revised operating sequence.',
        basis: 'Procedure accuracy and workforce clarity.',
        disciplines: ['Operations'],
        supportingDocumentName: 'startup_sequence.docx',
        implementationDate: '2026-08-01',
        ownerId: 'owner2',
        evaluatorIds: ['ops1'],
        managerId: 'manager1',
        evaluations: [this.seedEvaluation('Operations', 'ops1', false)],
        pssrChecklist: this.makePssrChecklist(false),
        actionItems: [],
        workflowState: 'Evaluation',
        status: 'Open',
        waitingOn: 'Evaluator',
        workflowHistory: [this.seedHistory(now, 'Initiated', 'owner2', ['ops1'], 'MOC initiated and routed to Oscar Operations for evaluation.')],
        actionFlag: '',
        createdDate: now,
        lastUpdatedDate: now,
      },
      {
        id: 'MOC000126',
        title: 'Closed area signage change',
        description: 'Update process area signage after completed layout adjustment.',
        basis: 'Completed communication update.',
        disciplines: ['HSE'],
        supportingDocumentName: 'signage_layout.png',
        implementationDate: '2026-05-15',
        ownerId: 'owner2',
        evaluatorIds: ['hse1'],
        managerId: 'manager1',
        evaluations: [this.seedEvaluation('HSE', 'hse1', true)],
        pssrChecklist: this.makePssrChecklist(true),
        actionItems: [],
        closureDate: now,
        closedByUserId: 'owner2',
        workflowState: 'Closed',
        status: 'Closed',
        waitingOn: '-',
        workflowHistory: [
          this.seedHistory(now, 'Initiated', 'owner2', ['hse1'], 'MOC initiated and routed for HSE evaluation.'),
          this.seedHistory(now, 'Closed', 'owner2', [], 'MOC closed.'),
        ],
        actionFlag: 'Complete',
        createdDate: now,
        lastUpdatedDate: now,
      },
    ];
  }

  private seedEvaluation(discipline: string, evaluatorId: string, complete: boolean): EvaluationTask {
    return {
      id: `EV-${discipline.replace(/\s+/g, '-')}`,
      discipline,
      evaluatorId,
      complete,
      actionRequired: false,
      checklist: (this.checklistTemplates.evaluation[discipline] ?? this.defaultChecklist(discipline)).map((text, index) => ({
        id: `${discipline}-${index + 1}`,
        text,
        required: true,
        complete,
      })),
    };
  }

  private seedHistory(
    at: string,
    step: WorkflowEvent['step'],
    byUserId: string,
    assignedToUserIds: string[],
    note: string,
  ): WorkflowEvent {
    return {
      id: `H-${step}-${byUserId}-${assignedToUserIds.join('-')}`,
      at,
      step,
      byUserId,
      assignedToUserIds,
      note,
    };
  }
}
