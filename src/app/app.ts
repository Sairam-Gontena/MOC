import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type View = 'login' | 'dashboard' | 'detail' | 'admin' | 'actions';
type UserRole = 'Owner' | 'Evaluator' | 'Manager' | 'Admin';
type Sex = 'Male' | 'Female';
type WorkflowState =
  | 'Evaluation'
  | 'Approval to Implement'
  | 'Implementation'
  | 'PSSR'
  | 'Approval for Start Up'
  | 'Ready for Closure'
  | 'Closed'
  | 'Cancelled';
type ActionPhase = 'Evaluation' | 'Pre-Startup' | 'Post-Startup';
type GateType = 'Implement' | 'Start Up';
type GateDecision = 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled';

interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
  discipline?: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
  complete: boolean;
  completedByUserId?: string;
  completedAt?: string;
}

interface ChecklistTemplateItem {
  id: string;
  text: string;
  required: boolean;
  active: boolean;
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
  sourceDiscipline?: string;
  comments?: string;
  evidenceFileName?: string;
  evidenceDataUrl?: string;
  evidenceMimeType?: string;
  completedByUserId?: string;
  completedAt?: string;
}

interface WorkflowEvent {
  id: string;
  at: string;
  step: WorkflowState | 'Initiated';
  byUserId: string;
  assignedToUserIds: string[];
  note: string;
}

interface ApprovalEvent {
  id: string;
  gate: GateType;
  decision: GateDecision;
  byUserId: string;
  at: string;
  comments?: string;
}

interface MocRecord {
  id: string;
  title: string;
  description: string;
  basis: string;
  disciplines: string[];
  supportingDocumentName: string;
  supportingDocumentDataUrl?: string;
  supportingDocumentMimeType?: string;
  implementationDate: string;
  ownerId: string;
  evaluatorIds: string[];
  managerId: string;
  evaluations: EvaluationTask[];
  pssrChecklist: ChecklistItem[];
  actionItems: ActionItem[];
  approvalHistory: ApprovalEvent[];
  workflowState: WorkflowState;
  status: 'Open' | 'Closed' | 'Cancelled';
  waitingOn: string;
  workflowHistory: WorkflowEvent[];
  actionFlag: '' | 'Owner' | 'Evaluator' | 'Action Owner' | 'Manager' | 'Operations' | 'Complete';
  createdDate: string;
  lastUpdatedDate: string;
  closureDate?: string;
  closedByUserId?: string;
}

interface InitiationForm {
  title: string;
  description: string;
  basis: string;
  disciplines: string[];
  supportingDocumentName: string;
  supportingDocumentDataUrl?: string;
  supportingDocumentMimeType?: string;
  implementationDate: string;
}

interface ChecklistTemplates {
  evaluation: Record<string, ChecklistTemplateItem[]>;
  pssr: ChecklistTemplateItem[];
}

interface ActionBoardRow {
  record: MocRecord;
  item: ActionItem;
}

interface FileAttachment {
  name: string;
  dataUrl: string;
  mimeType?: string;
}

interface UserProfile {
  displayName: string;
  sex: Sex;
  email: string;
  department: string;
  phone: string;
  location: string;
  timezone: string;
}

interface ProfilePasswordForm {
  current: string;
  next: string;
  confirm: string;
}

interface DocumentPreview {
  title: string;
  fileName: string;
  dataUrl: string;
  mimeType?: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly storageKey = 'mocAngularRbacPrototype.v7';
  readonly checklistKey = 'mocAngularChecklistTemplates.v2';
  readonly sessionKey = 'mocAngularRbacSession.v1';
  readonly profileKey = 'mocAngularUserProfiles.v1';
  readonly passwordKey = 'mocAngularUserPasswords.v1';
  readonly disciplineOptions = ['Mechanical', 'Process', 'Electrical', 'Operations', 'HSE', 'Instrumentation', 'Environmental'];
  readonly workflowSteps: Array<{ key: WorkflowState | 'Initiated'; label: string }> = [
    { key: 'Initiated', label: 'Initiated' },
    { key: 'Evaluation', label: 'Evaluation' },
    { key: 'Approval to Implement', label: 'Approval to Implement' },
    { key: 'Implementation', label: 'Implementation' },
    { key: 'PSSR', label: 'PSSR' },
    { key: 'Approval for Start Up', label: 'Approval for Start Up' },
    { key: 'Ready for Closure', label: 'Ready for Closure' },
    { key: 'Closed', label: 'Closed' },
  ];
  readonly users: DemoUser[] = [
    { id: 'owner1', name: 'Olivia', role: 'Owner' },
    { id: 'owner2', name: 'Owen', role: 'Owner' },
    { id: 'mech1', name: 'Mike', role: 'Evaluator', discipline: 'Mechanical' },
    { id: 'process1', name: 'Priya', role: 'Evaluator', discipline: 'Process' },
    { id: 'env1', name: 'Evan', role: 'Evaluator', discipline: 'Environmental' },
    { id: 'hse1', name: 'Harper', role: 'Evaluator', discipline: 'HSE' },
    { id: 'ops1', name: 'Oscar', role: 'Evaluator', discipline: 'Operations' },
    { id: 'manager1', name: 'Morgan', role: 'Manager' },
    { id: 'admin1', name: 'Ada', role: 'Admin' },
  ];
  readonly sexOptions: Sex[] = ['Male', 'Female'];
  readonly userSexDefaults: Record<string, Sex> = {
    owner1: 'Female',
    owner2: 'Male',
    mech1: 'Male',
    process1: 'Female',
    env1: 'Male',
    hse1: 'Female',
    ops1: 'Male',
    manager1: 'Male',
    admin1: 'Female',
  };
  readonly sexAvatarMap: Record<Sex, string> = {
    Male: 'avatars/avatar-male.svg',
    Female: 'avatars/avatar-female.svg',
  };
  readonly demoPassword = 'demo123';

  view: View = 'login';
  loginUsername = '';
  loginPassword = '';
  loginError = '';
  showCreateModal = false;
  showProfileModal = false;
  showPreviewModal = false;
  mocRowsLimit = 100;
  mocFilterText = '';
  currentUser: DemoUser | null = this.loadSession();
  selectedMoc: MocRecord | null = null;
  profileForm: UserProfile | null = null;
  passwordForm: ProfilePasswordForm = this.blankPasswordForm();
  profileStatus = '';
  profileError = '';
  previewDocument: DocumentPreview | null = null;
  previewResourceUrl: SafeResourceUrl | null = null;
  previewTextContent = '';
  submitAttempted = false;
  isSubmitting = false;
  form: InitiationForm = this.blankForm();
  newAction: Pick<ActionItem, 'phase' | 'description' | 'assigneeId' | 'dueDate'> = this.blankAction();
  actionComments: Record<string, string> = {};
  actionEvidence: Record<string, FileAttachment | undefined> = {};
  checklistTemplates: ChecklistTemplates = this.loadChecklistTemplates();
  records: MocRecord[] = this.loadRecords();
  implementRejectionComment = '';
  startupRejectionComment = '';
  cancelComment = '';
  reworkNotice = '';
  userProfiles: Record<string, UserProfile> = this.loadUserProfiles();
  userPasswords: Record<string, string> = this.loadUserPasswords();
  private lastFocusedElement: HTMLElement | null = null;
  @ViewChild('createModalCard') createModalCard?: ElementRef<HTMLElement>;

  constructor(private readonly sanitizer: DomSanitizer) {
    if (this.currentUser) {
      this.view = 'dashboard';
    }
  }

  get loginNames(): string[] {
    return this.users.map((user) => user.name);
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
      (record) =>
        record.managerId === this.currentUser?.id &&
        record.waitingOn === 'Manager' &&
        (record.workflowState === 'Approval to Implement' || record.workflowState === 'Approval for Start Up'),
    );
  }

  get myActionItems(): ActionBoardRow[] {
    if (!this.currentUser) return [];
    const rows: ActionBoardRow[] = [];
    for (const record of this.records) {
      for (const item of record.actionItems) {
        const canSee = this.currentUser.role === 'Admin' || item.assigneeId === this.currentUser.id;
        if (canSee) rows.push({ record, item });
      }
    }
    return rows.sort((a, b) => {
      if (a.item.complete !== b.item.complete) return a.item.complete ? 1 : -1;
      return a.item.dueDate.localeCompare(b.item.dueDate);
    });
  }

  get routedUpdates(): Array<{ record: MocRecord; event: WorkflowEvent }> {
    if (!this.currentUser) return [];
    const updates = this.visibleRecords.flatMap((record) =>
      record.workflowHistory
        .filter((event) => event.assignedToUserIds.includes(this.currentUser!.id) && event.byUserId !== this.currentUser!.id)
        .map((event) => ({ record, event })),
    );
    return updates.sort((a, b) => b.event.at.localeCompare(a.event.at)).slice(0, 6);
  }

  get totalMocs(): number {
    return this.visibleRecords.length;
  }

  get pendingReview(): number {
    return this.visibleRecords.filter((record) => record.status === 'Open').length;
  }

  get waitingOnOthers(): number {
    return this.visibleRecords.filter((record) => record.waitingOn !== '-' && record.status === 'Open').length;
  }

  get closedMocs(): number {
    return this.visibleRecords.filter((record) => record.status === 'Closed').length;
  }

  get filteredVisibleRecords(): MocRecord[] {
    const query = this.mocFilterText.trim().toLowerCase();
    if (!query) return this.visibleRecords;
    return this.visibleRecords.filter((record) => {
      const owner = this.userName(record.ownerId).toLowerCase();
      const assigned = this.currentAssignedTo(record).toLowerCase();
      const waitingOn = this.waitingOnFor(record).toLowerCase();
      const actionFlag = (record.actionFlag || '').toLowerCase();
      return (
        record.id.toLowerCase().includes(query) ||
        record.title.toLowerCase().includes(query) ||
        record.workflowState.toLowerCase().includes(query) ||
        record.status.toLowerCase().includes(query) ||
        owner.includes(query) ||
        assigned.includes(query) ||
        waitingOn.includes(query) ||
        actionFlag.includes(query)
      );
    });
  }

  get dashboardRecords(): MocRecord[] {
    return this.filteredVisibleRecords.slice(0, this.mocRowsLimit);
  }

  get minDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  get currentRoleLabel(): string {
    return this.currentUser ? `${this.currentUser.role}${this.currentUser.discipline ? ` - ${this.currentUser.discipline}` : ''}` : 'Not signed in';
  }

  get currentDisplayName(): string {
    if (!this.currentUser) return '';
    const profile = this.userProfiles[this.currentUser.id];
    return profile?.displayName?.trim() || this.currentUser.name;
  }

  get currentAvatarSrc(): string {
    if (!this.currentUser) return this.sexAvatarMap.Male;
    const sex = this.userProfiles[this.currentUser.id]?.sex ?? this.defaultSex(this.currentUser.id);
    return this.avatarForSex(sex);
  }

  loginWithPassword(): void {
    const username = this.loginUsername.trim().toLowerCase();
    const user = this.users.find((entry) => entry.name.toLowerCase() === username);
    if (!user) {
      this.loginError = 'Invalid username.';
      return;
    }
    const expectedPassword = this.userPasswords[user.id] ?? this.demoPassword;
    if (this.loginPassword !== expectedPassword) {
      this.loginError = 'Invalid password.';
      return;
    }
    this.loginError = '';
    this.currentUser = user;
    localStorage.setItem(this.sessionKey, this.currentUser.id);
    this.loginPassword = '';
    this.openDashboard();
  }

  loginWithSso(): void {
    const username = this.loginUsername.trim().toLowerCase();
    const user = this.users.find((entry) => entry.name.toLowerCase() === username);
    if (!user) {
      this.loginError = 'Enter a valid username for SSO login.';
      return;
    }
    this.loginError = '';
    this.currentUser = user;
    localStorage.setItem(this.sessionKey, user.id);
    this.loginPassword = '';
    this.openDashboard();
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    this.currentUser = null;
    this.selectedMoc = null;
    this.showCreateModal = false;
    this.showProfileModal = false;
    this.showPreviewModal = false;
    this.previewDocument = null;
    this.previewResourceUrl = null;
    this.previewTextContent = '';
    this.loginError = '';
    this.loginPassword = '';
    this.view = 'login';
  }

  openDashboard(): void {
    this.view = this.currentUser ? 'dashboard' : 'login';
    this.selectedMoc = null;
    this.submitAttempted = false;
    this.showCreateModal = false;
  }

  openProfileModal(): void {
    if (!this.currentUser) return;
    this.profileForm = { ...(this.userProfiles[this.currentUser.id] ?? this.defaultProfile(this.currentUser)) };
    this.passwordForm = this.blankPasswordForm();
    this.profileStatus = '';
    this.profileError = '';
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.profileStatus = '';
    this.profileError = '';
    this.passwordForm = this.blankPasswordForm();
  }

  saveProfile(): void {
    if (!this.currentUser || !this.profileForm) return;
    const profile = {
      ...this.profileForm,
      displayName: this.profileForm.displayName.trim() || this.currentUser.name,
      sex: this.normalizeSex(this.profileForm.sex, this.currentUser.id),
      email: this.profileForm.email.trim(),
      department: this.profileForm.department.trim(),
      phone: this.profileForm.phone.trim(),
      location: this.profileForm.location.trim(),
      timezone: this.profileForm.timezone.trim(),
    };
    if (profile.email && !profile.email.includes('@')) {
      this.profileError = 'Enter a valid email address.';
      this.profileStatus = '';
      return;
    }
    this.userProfiles[this.currentUser.id] = profile;
    this.saveUserProfiles();
    this.profileStatus = 'Profile saved.';
    this.profileError = '';
  }

  profileAvatarSrc(profile: UserProfile): string {
    return this.avatarForSex(this.normalizeSex(profile.sex, this.currentUser?.id));
  }

  updatePassword(): void {
    if (!this.currentUser) return;
    const current = this.passwordForm.current.trim();
    const next = this.passwordForm.next.trim();
    const confirm = this.passwordForm.confirm.trim();
    const currentPassword = this.userPasswords[this.currentUser.id] ?? this.demoPassword;

    if (!current || !next || !confirm) {
      this.profileError = 'Enter current, new, and confirm password fields.';
      this.profileStatus = '';
      return;
    }
    if (current !== currentPassword) {
      this.profileError = 'Current password is incorrect.';
      this.profileStatus = '';
      return;
    }
    if (next.length < 6) {
      this.profileError = 'New password must be at least 6 characters.';
      this.profileStatus = '';
      return;
    }
    if (next !== confirm) {
      this.profileError = 'New password and confirm password do not match.';
      this.profileStatus = '';
      return;
    }

    this.userPasswords[this.currentUser.id] = next;
    this.saveUserPasswords();
    this.passwordForm = this.blankPasswordForm();
    this.profileStatus = 'Password updated successfully.';
    this.profileError = '';
  }

  openActionBoard(): void {
    if (!this.currentUser) return;
    this.view = 'actions';
    this.selectedMoc = null;
    this.showCreateModal = false;
  }

  openCreate(): void {
    if (!this.currentUser || !this.canInitiate()) return;
    this.form = this.blankForm();
    this.submitAttempted = false;
    this.isSubmitting = false;
    this.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.showCreateModal = true;
    setTimeout(() => this.focusFirstModalControl(), 0);
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.submitAttempted = false;
    this.isSubmitting = false;
    this.restoreFocusAfterModal();
  }

  onCreateModalBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeCreateModal();
  }

  onCreateModalKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.createModalCard) return;
    const focusable = this.modalFocusableElements();
    if (!focusable.length) return;

    const active = document.activeElement as HTMLElement | null;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (this.showCreateModal) {
      this.closeCreateModal();
      return;
    }
    if (this.showPreviewModal) {
      this.closePreviewModal();
      return;
    }
    if (this.showProfileModal) this.closeProfileModal();
  }

  openAdmin(): void {
    if (this.currentUser?.role !== 'Admin') return;
    this.view = 'admin';
    this.selectedMoc = null;
    this.showCreateModal = false;
  }

  openDetail(record: MocRecord): void {
    if (!this.canView(record)) return;
    this.selectedMoc = record;
    this.newAction = { ...this.blankAction(), assigneeId: record.ownerId };
    this.submitAttempted = false;
    this.implementRejectionComment = '';
    this.startupRejectionComment = '';
    this.cancelComment = '';
    this.reworkNotice = this.latestDecisionComment(record, 'Implement', 'Rejected');
    this.view = 'detail';
    this.showCreateModal = false;
  }

  openFromActionBoard(row: ActionBoardRow): void {
    this.openDetail(row.record);
  }

  cancelCreate(): void {
    this.form = this.blankForm();
    this.closeCreateModal();
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
    return (
      record.managerId === this.currentUser.id &&
      record.waitingOn === 'Manager' &&
      (record.workflowState === 'Approval to Implement' || record.workflowState === 'Approval for Start Up')
    );
  }

  waitingOnFor(record: MocRecord): string {
    if (record.status !== 'Open') return '-';
    if (record.waitingOn) return record.waitingOn;
    if (record.workflowState === 'Evaluation') return 'Evaluator';
    if (record.workflowState === 'Approval to Implement') return 'Manager';
    if (record.workflowState === 'Implementation') return 'Owner';
    if (record.workflowState === 'PSSR') return 'Operations';
    if (record.workflowState === 'Approval for Start Up') return 'Manager';
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
    if (record.status === 'Cancelled') return 'MOC cancelled';
    const assignedTo = this.currentAssignedTo(record);
    if (record.workflowState === 'Evaluation') return `Evaluation assigned to ${assignedTo}`;
    if (record.workflowState === 'Approval to Implement') return `Implementation approval assigned to ${assignedTo}`;
    if (record.workflowState === 'Implementation') return `Implementation completion assigned to ${assignedTo}`;
    if (record.workflowState === 'PSSR') return `PSSR assigned to ${assignedTo}`;
    if (record.workflowState === 'Approval for Start Up') return `Startup approval assigned to ${assignedTo}`;
    if (record.workflowState === 'Ready for Closure') return `Closure work assigned to ${assignedTo}`;
    return assignedTo;
  }

  checklistItems(discipline: string): ChecklistTemplateItem[] {
    if (!this.checklistTemplates.evaluation[discipline]) {
      this.checklistTemplates.evaluation[discipline] = this.templateItems(this.defaultChecklist(discipline), discipline);
    }
    return this.checklistTemplates.evaluation[discipline];
  }

  addChecklistItem(discipline: string): void {
    const items = this.checklistItems(discipline);
    items.push(this.newTemplateItem(discipline));
  }

  removeChecklistItem(discipline: string, itemId: string): void {
    const next = this.checklistItems(discipline).filter((item) => item.id !== itemId);
    this.checklistTemplates.evaluation[discipline] = next.length ? next : [this.newTemplateItem(discipline)];
  }

  pssrChecklistItems(): ChecklistTemplateItem[] {
    if (!this.checklistTemplates.pssr.length) {
      this.checklistTemplates.pssr = this.templateItems(['Work completed per design'], 'PSSR');
    }
    return this.checklistTemplates.pssr;
  }

  addPssrChecklistItem(): void {
    this.pssrChecklistItems().push(this.newTemplateItem('PSSR'));
  }

  removePssrChecklistItem(itemId: string): void {
    const next = this.pssrChecklistItems().filter((item) => item.id !== itemId);
    this.checklistTemplates.pssr = next.length ? next : [this.newTemplateItem('PSSR')];
  }

  saveChecklistTemplates(): void {
    this.checklistTemplates = this.normalizeChecklistTemplates(this.checklistTemplates);
    localStorage.setItem(this.checklistKey, JSON.stringify(this.checklistTemplates));
  }

  workflowStepClass(record: MocRecord, stepKey: WorkflowState | 'Initiated'): string {
    const currentIndex = this.workflowStepIndex(record);
    const stepIndex = this.workflowSteps.findIndex((entry) => entry.key === stepKey);
    if (stepIndex < 0) return 'step';
    if (stepIndex < currentIndex) return 'step complete';
    if (stepIndex === currentIndex) return 'step active';
    return 'step';
  }

  workflowProgressLabel(record: MocRecord): string {
    const index = this.workflowStepIndex(record);
    const step = this.workflowSteps[index] ?? this.workflowSteps[0];
    return `Step ${index + 1} of ${this.workflowSteps.length}: ${step.label}`;
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

  routeEvents(record: MocRecord): WorkflowEvent[] {
    return [...record.workflowHistory].sort((a, b) => b.at.localeCompare(a.at));
  }

  trackByEventId(_index: number, event: WorkflowEvent): string {
    return event.id;
  }

  completedEvaluationCount(record: MocRecord): number {
    return record.evaluations.filter((task) => task.complete).length;
  }

  requiredChecklistCount(task: EvaluationTask): number {
    const required = task.checklist.filter((item) => item.required).length;
    return required > 0 ? required : task.checklist.length;
  }

  completedRequiredChecklistCount(task: EvaluationTask): number {
    const requiredItems = task.checklist.filter((item) => item.required);
    if (requiredItems.length > 0) return requiredItems.filter((item) => item.complete).length;
    return task.checklist.filter((item) => item.complete).length;
  }

  checklistProgress(task: EvaluationTask): string {
    const done = this.completedRequiredChecklistCount(task);
    const total = this.requiredChecklistCount(task);
    return `${done}/${total}`;
  }

  actionRequirementLabel(task: EvaluationTask): string {
    if (task.actionRequired === null) return 'Not selected';
    return task.actionRequired ? 'Required' : 'Not required';
  }

  evaluationStatusLabel(record: MocRecord, task: EvaluationTask): string {
    if (task.complete) return 'Complete';
    const checklistReady = task.checklist.every((item) => !item.required || item.complete);
    if (!checklistReady) return 'Checklist Pending';
    if (task.actionRequired === null) return 'Action Decision Pending';
    if (!task.actionRequired) return 'Ready for Evaluator Completion';

    const evaluatorActions = record.actionItems.filter((item) => item.phase === 'Evaluation' && item.createdBy === task.evaluatorId);
    if (!evaluatorActions.length) return 'Action Creation Pending';
    if (evaluatorActions.some((item) => !item.complete)) return 'Action Closure Pending';
    if (evaluatorActions.some((item) => !item.reviewedByEvaluator)) return 'Evaluator Review Pending';
    return 'Ready for Evaluator Completion';
  }

  private evaluationActionContext(
    record: MocRecord,
  ): { mode: 'evaluator'; task: EvaluationTask } | { mode: 'action-owner'; relatedAction: ActionItem } | null {
    const task = this.evaluatorTask(record);
    if (this.canEvaluate(record) && task?.actionRequired) {
      return { mode: 'evaluator', task };
    }
    if (!this.currentUser || this.currentUser.role === 'Manager') return null;

    const relatedAction =
      record.actionItems.find(
        (item) =>
          item.phase === 'Evaluation' &&
          item.assigneeId === this.currentUser!.id &&
          item.complete &&
          !item.reviewedByEvaluator &&
          this.isMutable(record),
      ) ?? null;

    if (relatedAction) return { mode: 'action-owner', relatedAction };
    return null;
  }

  pendingReviewActions(record: MocRecord): ActionItem[] {
    return record.actionItems.filter((item) => item.phase === 'Evaluation' && item.complete && !item.reviewedByEvaluator);
  }

  canReviewAction(item: ActionItem): boolean {
    return Boolean(
      this.currentUser &&
        item.complete &&
        !item.reviewedByEvaluator &&
        (item.createdBy === this.currentUser.id || this.currentUser.role === 'Admin'),
    );
  }

  canCompleteAction(record: MocRecord, item: ActionItem): boolean {
    if (!this.currentUser || item.complete || !this.isMutable(record)) return false;
    return item.assigneeId === this.currentUser.id || this.currentUser.role === 'Admin' || this.currentUser.id === record.ownerId;
  }

  canSubmitActionCompletion(record: MocRecord, item: ActionItem): boolean {
    return this.canCompleteAction(record, item) && Boolean(this.actionComments[item.id]?.trim());
  }

  canEvaluate(record: MocRecord): boolean {
    const task = this.evaluatorTask(record);
    return Boolean(this.currentUser?.role === 'Evaluator' && task && !task.complete && record.workflowState === 'Evaluation' && this.isMutable(record));
  }

  canShowWorkflowActions(record: MocRecord): boolean {
    return (
      this.canSubmitForApproval(record) ||
      this.canApproveToImplement(record) ||
      this.canSendBackToEvaluation(record) ||
      this.canCancelMoc(record) ||
      this.canMarkImplemented(record) ||
      this.canCompletePssr(record) ||
      this.canApproveStartup(record) ||
      this.canSendBackToPssr(record) ||
      this.canProceedToReadyForClosure(record) ||
      this.canClose(record)
    );
  }

  canEditRework(record: MocRecord): boolean {
    return (
      Boolean(this.currentUser && (this.currentUser.id === record.ownerId || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'Evaluation' &&
      Boolean(this.latestDecision(record, 'Implement', 'Rejected')) &&
      this.isMutable(record)
    );
  }

  setActionRequired(task: EvaluationTask, required: boolean): void {
    task.actionRequired = required;
    this.touchSelectedMoc();
  }

  evaluatorCreatedAction(record: MocRecord, task: EvaluationTask): boolean {
    return record.actionItems.some((item) => item.phase === 'Evaluation' && item.createdBy === task.evaluatorId);
  }

  toggleChecklist(record: MocRecord, item: ChecklistItem, checked: boolean): void {
    if (!this.canEvaluate(record)) return;
    item.complete = checked;
    item.completedByUserId = checked ? this.currentUser?.id : undefined;
    item.completedAt = checked ? new Date().toISOString() : undefined;
    this.touchSelectedMoc();
  }

  canCompleteEvaluation(record: MocRecord, task: EvaluationTask): boolean {
    if (task.complete || !task.checklist.every((item) => !item.required || item.complete)) return false;
    if (task.actionRequired === null) return false;
    if (!task.actionRequired) return true;
    const evaluatorActions = record.actionItems.filter((item) => item.phase === 'Evaluation' && item.createdBy === task.evaluatorId);
    return evaluatorActions.length > 0 && evaluatorActions.every((item) => item.complete && item.reviewedByEvaluator);
  }

  completeEvaluation(record: MocRecord, task: EvaluationTask): void {
    if (!this.canCompleteEvaluation(record, task)) return;
    task.complete = true;
    this.addHistory(record, 'Evaluation', `Evaluation completed for ${task.discipline}.`);
    this.recalculateRecordState(record);
    this.saveRecords();
  }

  canCreatePssrAction(record: MocRecord): boolean {
    return (
      Boolean(this.currentUser && (this.currentUser.discipline === 'Operations' || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'PSSR' &&
      this.isMutable(record)
    );
  }

  canCreateEvaluationAction(record: MocRecord): boolean {
    const context = this.evaluationActionContext(record);
    if (context?.mode === 'action-owner' && this.newAction.phase === 'Evaluation') {
      this.newAction.phase = 'Post-Startup';
    }
    return Boolean(context && this.isMutable(record) && record.workflowState === 'Evaluation' && !record.evaluations.every((task) => task.complete));
  }

  canCreateEvaluationPhaseAction(record: MocRecord): boolean {
    const context = this.evaluationActionContext(record);
    return Boolean(context && context.mode === 'evaluator');
  }

  createActionItem(record: MocRecord, source: 'evaluation' | 'pssr'): void {
    if (!this.currentUser || !this.isMutable(record) || !this.newAction.description.trim() || !this.newAction.assigneeId || !this.newAction.dueDate) return;

    const evaluationContext = source === 'evaluation' ? this.evaluationActionContext(record) : null;
    if (source === 'evaluation' && !evaluationContext) return;
    if (source === 'evaluation' && evaluationContext && evaluationContext.mode === 'action-owner' && this.newAction.phase === 'Evaluation') return;
    if (source === 'pssr' && !this.canCreatePssrAction(record)) return;
    if (source === 'pssr' && this.newAction.phase === 'Evaluation') return;

    const task = this.evaluatorTask(record);
    const sourceDiscipline =
      source === 'evaluation'
        ? evaluationContext && evaluationContext.mode === 'evaluator'
          ? evaluationContext.task.discipline
          : evaluationContext && evaluationContext.mode === 'action-owner'
            ? evaluationContext.relatedAction.sourceDiscipline
            : task?.discipline
        : undefined;

    const action: ActionItem = {
      id: `AI${Date.now()}`,
      phase: this.newAction.phase,
      description: this.newAction.description.trim(),
      assigneeId: this.newAction.assigneeId,
      dueDate: this.newAction.dueDate,
      complete: false,
      reviewedByEvaluator: this.newAction.phase !== 'Evaluation',
      createdBy: this.currentUser.id,
      sourceDiscipline,
    };

    record.actionItems = [...record.actionItems, action];
    this.newAction = { ...this.blankAction(), assigneeId: record.ownerId };
    this.addHistory(
      record,
      record.workflowState,
      `${action.phase} action item created and assigned to ${this.userName(action.assigneeId)}.`,
    );
    this.recalculateRecordState(record);
    this.saveRecords();
  }

  async onActionEvidenceSelected(event: Event, item: ActionItem): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      this.actionEvidence[item.id] = undefined;
      return;
    }
    const dataUrl = await this.readFileAsDataUrl(file);
    this.actionEvidence[item.id] = { name: file.name, dataUrl, mimeType: file.type };
  }

  completeAction(record: MocRecord, item: ActionItem): void {
    if (!this.currentUser || !this.canSubmitActionCompletion(record, item)) return;
    item.complete = true;
    item.completedByUserId = this.currentUser.id;
    item.completedAt = new Date().toISOString();
    item.reviewedByEvaluator = item.phase !== 'Evaluation';
    item.comments = this.actionComments[item.id]?.trim();
    const evidence = this.actionEvidence[item.id];
    if (evidence) {
      item.evidenceFileName = evidence.name;
      item.evidenceDataUrl = evidence.dataUrl;
      item.evidenceMimeType = evidence.mimeType;
    }
    delete this.actionComments[item.id];
    delete this.actionEvidence[item.id];
    this.addHistory(record, record.workflowState, `Action item completed by ${this.currentUser.name}.`);
    this.recalculateRecordState(record);
    this.saveRecords();
  }

  reviewAction(record: MocRecord, item: ActionItem): void {
    if (!this.canReviewAction(item)) return;
    item.reviewedByEvaluator = true;
    item.comments = `${item.comments ?? ''}${item.comments ? ' | ' : ''}Reviewed by ${this.currentUser?.name}`.trim();
    this.addHistory(record, record.workflowState, `Evaluation action item reviewed by ${this.currentUser?.name}.`);
    this.recalculateRecordState(record);
    this.saveRecords();
  }

  canSubmitForApproval(record: MocRecord): boolean {
    return (
      this.isMutable(record) &&
      Boolean(this.currentUser && (this.currentUser.id === record.ownerId || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'Evaluation' &&
      record.evaluations.every((task) => task.complete) &&
      !record.actionItems.some((item) => item.phase === 'Evaluation' && (!item.complete || !item.reviewedByEvaluator))
    );
  }

  submitForApproval(record: MocRecord): void {
    if (!this.canSubmitForApproval(record)) return;
    record.workflowState = 'Approval to Implement';
    record.waitingOn = 'Manager';
    record.actionFlag = 'Manager';
    this.addApproval(record, 'Implement', 'Submitted');
    this.finishWorkflowUpdate(record, 'Submitted for manager approval to implement.');
  }

  canApproveToImplement(record: MocRecord): boolean {
    return Boolean(
      this.isMutable(record) &&
        this.currentUser &&
        (this.currentUser.id === record.managerId || this.currentUser.role === 'Admin') &&
        record.workflowState === 'Approval to Implement' &&
        record.waitingOn === 'Manager',
    );
  }

  approveToImplement(record: MocRecord): void {
    if (!this.canApproveToImplement(record)) return;
    record.workflowState = 'Implementation';
    record.waitingOn = 'Owner';
    record.actionFlag = 'Owner';
    this.addApproval(record, 'Implement', 'Approved');
    this.finishWorkflowUpdate(record, 'Manager approved to implement.');
  }

  canSendBackToEvaluation(record: MocRecord): boolean {
    return this.canApproveToImplement(record);
  }

  sendBackToEvaluation(record: MocRecord): void {
    if (!this.canSendBackToEvaluation(record)) return;
    const comment = this.implementRejectionComment.trim();
    if (!comment) return;
    record.workflowState = 'Evaluation';
    record.waitingOn = 'Owner';
    record.actionFlag = 'Owner';
    this.resetEvaluationTasks(record);
    this.addApproval(record, 'Implement', 'Rejected', comment);
    this.implementRejectionComment = '';
    this.finishWorkflowUpdate(record, `Manager sent back to Evaluation. Comment: ${comment}`);
  }

  canCancelMoc(record: MocRecord): boolean {
    return this.canApproveToImplement(record);
  }

  cancelMoc(record: MocRecord): void {
    if (!this.canCancelMoc(record)) return;
    const comment = this.cancelComment.trim();
    if (!comment) return;
    record.workflowState = 'Cancelled';
    record.status = 'Cancelled';
    record.waitingOn = '-';
    record.actionFlag = 'Complete';
    this.addApproval(record, 'Implement', 'Cancelled', comment);
    this.cancelComment = '';
    this.finishWorkflowUpdate(record, `MOC cancelled by manager. Comment: ${comment}`);
  }

  canMarkImplemented(record: MocRecord): boolean {
    return (
      this.isMutable(record) &&
      Boolean(this.currentUser && (this.currentUser.id === record.ownerId || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'Implementation'
    );
  }

  markImplemented(record: MocRecord): void {
    if (!this.canMarkImplemented(record)) return;
    record.workflowState = 'PSSR';
    record.waitingOn = 'Operations';
    record.actionFlag = 'Operations';
    this.finishWorkflowUpdate(record, 'Implementation completed. Routed to PSSR.');
  }

  canCompletePssr(record: MocRecord): boolean {
    return (
      this.isMutable(record) &&
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
    record.workflowState = 'Approval for Start Up';
    record.waitingOn = 'Manager';
    record.actionFlag = 'Manager';
    this.addApproval(record, 'Start Up', 'Submitted');
    this.finishWorkflowUpdate(record, 'PSSR completed. Routed for startup approval.');
  }

  canApproveStartup(record: MocRecord): boolean {
    return Boolean(
      this.isMutable(record) &&
        this.currentUser &&
        (this.currentUser.id === record.managerId || this.currentUser.role === 'Admin') &&
        record.workflowState === 'Approval for Start Up' &&
        record.waitingOn === 'Manager' &&
        record.pssrChecklist.every((item) => !item.required || item.complete) &&
        !record.actionItems.some((item) => item.phase === 'Pre-Startup' && !item.complete),
    );
  }

  approveStartup(record: MocRecord): void {
    if (!this.canApproveStartup(record)) return;
    this.addApproval(record, 'Start Up', 'Approved');
    record.waitingOn = 'Owner';
    record.actionFlag = 'Owner';
    this.finishWorkflowUpdate(record, 'Manager approved startup. Owner must proceed to Ready for Closure.');
  }

  canSendBackToPssr(record: MocRecord): boolean {
    return this.canApproveStartup(record);
  }

  sendBackToPssr(record: MocRecord): void {
    if (!this.canSendBackToPssr(record)) return;
    const comment = this.startupRejectionComment.trim();
    if (!comment) return;
    this.addApproval(record, 'Start Up', 'Rejected', comment);
    record.workflowState = 'PSSR';
    record.waitingOn = 'Operations';
    record.actionFlag = 'Operations';
    this.startupRejectionComment = '';
    this.finishWorkflowUpdate(record, `Manager sent back to PSSR. Comment: ${comment}`);
  }

  canProceedToReadyForClosure(record: MocRecord): boolean {
    return (
      this.isMutable(record) &&
      Boolean(this.currentUser && (this.currentUser.id === record.ownerId || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'Approval for Start Up' &&
      this.latestDecision(record, 'Start Up', 'Approved') !== undefined
    );
  }

  proceedToReadyForClosure(record: MocRecord): void {
    if (!this.canProceedToReadyForClosure(record)) return;
    record.workflowState = 'Ready for Closure';
    this.recalculateRecordState(record);
    this.finishWorkflowUpdate(record, 'Owner proceeded to Ready for Closure.');
  }

  canClose(record: MocRecord): boolean {
    return (
      this.isMutable(record) &&
      Boolean(this.currentUser && (this.currentUser.id === record.ownerId || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'Ready for Closure' &&
      record.evaluations.every((task) => task.complete) &&
      record.pssrChecklist.every((item) => !item.required || item.complete) &&
      this.latestDecision(record, 'Start Up', 'Approved') !== undefined &&
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

  togglePssrChecklist(record: MocRecord, item: ChecklistItem, checked: boolean): void {
    if (!this.canCreatePssrAction(record)) return;
    item.complete = checked;
    item.completedByUserId = checked ? this.currentUser?.id : undefined;
    item.completedAt = checked ? new Date().toISOString() : undefined;
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

  toggleReworkDiscipline(record: MocRecord, discipline: string, checked: boolean): void {
    if (!this.canEditRework(record)) return;
    if (checked && !record.disciplines.includes(discipline)) {
      record.disciplines = [...record.disciplines, discipline];
    }
    if (!checked) {
      record.disciplines = record.disciplines.filter((item) => item !== discipline);
    }
  }

  isReworkDisciplineSelected(record: MocRecord, discipline: string): boolean {
    return record.disciplines.includes(discipline);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.form.supportingDocumentName = file?.name ?? '';
    this.form.supportingDocumentDataUrl = undefined;
    this.form.supportingDocumentMimeType = undefined;
    if (!file) return;
    this.form.supportingDocumentDataUrl = await this.readFileAsDataUrl(file);
    this.form.supportingDocumentMimeType = file.type;
  }

  async onReworkFileSelected(event: Event, record: MocRecord): Promise<void> {
    if (!this.canEditRework(record)) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    record.supportingDocumentName = file.name;
    record.supportingDocumentDataUrl = await this.readFileAsDataUrl(file);
    record.supportingDocumentMimeType = file.type;
    this.touchSelectedMoc();
  }

  openSupportingDocument(record: MocRecord): void {
    if (!record.supportingDocumentDataUrl || !record.supportingDocumentName) return;
    this.openDocumentPreview('Supporting Document', record.supportingDocumentName, record.supportingDocumentDataUrl, record.supportingDocumentMimeType);
  }

  openActionEvidence(item: ActionItem): void {
    if (!item.evidenceDataUrl || !item.evidenceFileName) return;
    this.openDocumentPreview('Action Evidence', item.evidenceFileName, item.evidenceDataUrl, item.evidenceMimeType);
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.previewDocument = null;
    this.previewResourceUrl = null;
    this.previewTextContent = '';
  }

  previewType(): 'pdf' | 'image' | 'text' | 'unsupported' {
    if (!this.previewDocument) return 'unsupported';
    const normalizedMime = this.documentMimeType(this.previewDocument.dataUrl, this.previewDocument.mimeType);
    const fileName = this.previewDocument.fileName.toLowerCase();
    if (normalizedMime.startsWith('image/') || /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/.test(fileName)) return 'image';
    if (normalizedMime === 'application/pdf' || fileName.endsWith('.pdf')) return 'pdf';
    if (normalizedMime.startsWith('text/') || /\.(txt|md|csv|json|xml|log)$/.test(fileName)) return 'text';
    return 'unsupported';
  }

  downloadPreviewDocument(): void {
    if (!this.previewDocument) return;
    this.downloadDataUrl(this.previewDocument.dataUrl, this.previewDocument.fileName);
  }

  saveReworkEdits(record: MocRecord): void {
    if (!this.canEditRework(record)) return;
    if (!record.title.trim() || !record.description.trim() || !record.basis.trim() || !record.implementationDate || record.disciplines.length === 0) return;
    if (record.implementationDate < this.minDate) return;
    record.evaluatorIds = record.disciplines.map((discipline) => this.evaluatorForDiscipline(discipline));
    this.addHistory(record, 'Evaluation', 'Owner updated initiation fields after manager rework request.');
    this.touchSelectedMoc();
  }

  latestDecisionComment(record: MocRecord, gate: GateType, decision: GateDecision): string {
    return this.latestDecision(record, gate, decision)?.comments ?? '';
  }

  latestApproval(record: MocRecord, gate: GateType): ApprovalEvent | undefined {
    const gateEntries = record.approvalHistory.filter((entry) => entry.gate === gate);
    return gateEntries.at(-1);
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
      supportingDocumentDataUrl: this.form.supportingDocumentDataUrl,
      supportingDocumentMimeType: this.form.supportingDocumentMimeType,
      implementationDate: this.form.implementationDate,
      ownerId: this.currentUser.id,
      evaluatorIds: this.form.disciplines.map((discipline) => this.evaluatorForDiscipline(discipline)),
      managerId: 'manager1',
      evaluations: this.form.disciplines.map((discipline) => this.makeEvaluationTask(discipline)),
      pssrChecklist: this.makePssrChecklist(false),
      actionItems: [],
      approvalHistory: [],
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
    this.showCreateModal = false;
    this.view = 'detail';
    this.isSubmitting = false;
  }

  resetDummyData(): void {
    this.records = this.seedRecords();
    this.mocFilterText = '';
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

  private isMutable(record: MocRecord): boolean {
    return record.status === 'Open' && record.workflowState !== 'Closed' && record.workflowState !== 'Cancelled';
  }

  private evaluatorForDiscipline(discipline: string): string {
    if (discipline === 'Mechanical' || discipline === 'Electrical' || discipline === 'Instrumentation') return 'mech1';
    if (discipline === 'Process') return 'process1';
    if (discipline === 'Environmental') return 'env1';
    if (discipline === 'HSE') return 'hse1';
    return 'ops1';
  }

  private makeEvaluationTask(discipline: string): EvaluationTask {
    const template = this.activeTemplateItems(this.checklistTemplates.evaluation[discipline], discipline);
    return {
      id: `EV-${discipline.replace(/\s+/g, '-')}`,
      discipline,
      evaluatorId: this.evaluatorForDiscipline(discipline),
      complete: false,
      actionRequired: null,
      checklist: template.map((item, index) => ({
        id: `${discipline}-${index + 1}`,
        text: item.text,
        required: item.required,
        complete: false,
      })),
    };
  }

  private makePssrChecklist(complete: boolean): ChecklistItem[] {
    const template = this.activeTemplateItems(this.checklistTemplates.pssr, 'PSSR');
    return template.map((item, index) => ({
      id: `PSSR-${index + 1}`,
      text: item.text,
      required: item.required,
      complete,
    }));
  }

  private defaultChecklist(discipline: string): string[] {
    if (discipline === 'Mechanical') return ['Mechanical integrity reviewed', 'Replacement materials verified'];
    if (discipline === 'Process') return ['Process conditions reviewed', 'Operating limits evaluated', 'Regulatory impacts considered'];
    if (discipline === 'Operations') return ['Operations impact reviewed', 'Procedure update need identified'];
    if (discipline === 'HSE') return ['HSE impact reviewed', 'Environmental or permit impact considered'];
    if (discipline === 'Electrical') return ['Electrical isolation reviewed', 'Electrical design basis checked'];
    if (discipline === 'Environmental') return ['Environmental impact reviewed', 'Permit impact confirmed'];
    return ['Instrumentation impact reviewed', 'Control and alarm impact checked'];
  }

  private blankAction(): Pick<ActionItem, 'phase' | 'description' | 'assigneeId' | 'dueDate'> {
    return { phase: 'Evaluation', description: '', assigneeId: 'owner1', dueDate: '' };
  }

  private recalculateRecordState(record: MocRecord): void {
    if (record.status !== 'Open') {
      record.waitingOn = '-';
      record.actionFlag = 'Complete';
      return;
    }

    if (record.workflowState === 'Evaluation') {
      const openEvaluationActions = record.actionItems.some((item) => item.phase === 'Evaluation' && !item.complete);
      const evaluationActionsAwaitingReview = this.pendingReviewActions(record).length > 0;
      const allEvaluationsComplete = record.evaluations.every((task) => task.complete);

      if (allEvaluationsComplete && !openEvaluationActions && !evaluationActionsAwaitingReview) {
        record.waitingOn = 'Owner';
        record.actionFlag = 'Owner';
      } else if (openEvaluationActions) {
        record.waitingOn = 'Action Owner';
        record.actionFlag = 'Action Owner';
      } else if (evaluationActionsAwaitingReview) {
        record.waitingOn = 'Evaluator';
        record.actionFlag = 'Evaluator';
      } else {
        record.waitingOn = 'Evaluator';
        record.actionFlag = 'Evaluator';
      }
    }

    if (record.workflowState === 'Approval to Implement') {
      record.waitingOn = 'Manager';
      record.actionFlag = 'Manager';
    }

    if (record.workflowState === 'Implementation') {
      record.waitingOn = 'Owner';
      record.actionFlag = 'Owner';
    }

    if (record.workflowState === 'PSSR') {
      record.waitingOn = 'Operations';
      record.actionFlag = 'Operations';
    }

    if (record.workflowState === 'Approval for Start Up') {
      if (this.latestDecision(record, 'Start Up', 'Approved')) {
        record.waitingOn = 'Owner';
        record.actionFlag = 'Owner';
      } else {
        record.waitingOn = 'Manager';
        record.actionFlag = 'Manager';
      }
    }

    if (record.workflowState === 'Ready for Closure') {
      const hasOpenPostStartup = record.actionItems.some((item) => item.phase === 'Post-Startup' && !item.complete);
      record.waitingOn = hasOpenPostStartup ? 'Post-Startup Action' : 'Owner';
      record.actionFlag = hasOpenPostStartup ? 'Action Owner' : 'Owner';
    }

    record.lastUpdatedDate = new Date().toISOString();
  }

  private resetEvaluationTasks(record: MocRecord): void {
    for (const task of record.evaluations) {
      task.complete = false;
      task.actionRequired = null;
      for (const item of task.checklist) {
        item.complete = false;
        item.completedByUserId = undefined;
        item.completedAt = undefined;
      }
    }
    record.evaluatorIds = record.disciplines.map((discipline) => this.evaluatorForDiscipline(discipline));
    this.recalculateRecordState(record);
  }

  private touchSelectedMoc(): void {
    if (!this.selectedMoc) return;
    this.selectedMoc.lastUpdatedDate = new Date().toISOString();
    this.recalculateRecordState(this.selectedMoc);
    this.saveRecords();
  }

  private finishWorkflowUpdate(record: MocRecord, note: string): void {
    record.lastUpdatedDate = new Date().toISOString();
    this.recalculateRecordState(record);
    this.addHistory(record, record.workflowState, note);
    this.selectedMoc = record;
    this.saveRecords();
  }

  private addApproval(record: MocRecord, gate: GateType, decision: GateDecision, comments?: string): void {
    const byUserId = this.currentUser?.id ?? 'system';
    record.approvalHistory = [
      ...record.approvalHistory,
      {
        id: `AP-${Date.now()}-${record.approvalHistory.length}`,
        gate,
        decision,
        byUserId,
        at: new Date().toISOString(),
        comments,
      },
    ];
  }

  private latestDecision(record: MocRecord, gate: GateType, decision: GateDecision): ApprovalEvent | undefined {
    const gateEntries = record.approvalHistory.filter((entry) => entry.gate === gate && entry.decision === decision);
    return gateEntries.at(-1);
  }

  private currentAssignedUserIds(record: MocRecord): string[] {
    if (record.status !== 'Open') return [];

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
    if (record.workflowState === 'Approval for Start Up') {
      return this.latestDecision(record, 'Start Up', 'Approved') ? [record.ownerId] : [record.managerId];
    }
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
    return {
      title: '',
      description: '',
      basis: '',
      disciplines: [],
      supportingDocumentName: '',
      supportingDocumentDataUrl: undefined,
      supportingDocumentMimeType: undefined,
      implementationDate: '',
    };
  }

  private loadChecklistTemplates(): ChecklistTemplates {
    const defaults = this.defaultChecklistTemplates();
    try {
      const raw = JSON.parse(localStorage.getItem(this.checklistKey) ?? 'null') as unknown;
      const migrated = this.migrateChecklistTemplates(raw);
      if (migrated) return this.normalizeChecklistTemplates(migrated);
    } catch {
      // Use default checklist templates.
    }
    localStorage.setItem(this.checklistKey, JSON.stringify(defaults));
    return defaults;
  }

  private defaultChecklistTemplates(): ChecklistTemplates {
    return {
      evaluation: Object.fromEntries(
        this.disciplineOptions.map((discipline) => [discipline, this.templateItems(this.defaultChecklist(discipline), discipline)]),
      ),
      pssr: this.templateItems(['Work completed per design', 'Area inspected and safe for startup'], 'PSSR'),
    };
  }

  private migrateChecklistTemplates(raw: unknown): ChecklistTemplates | null {
    if (!raw || typeof raw !== 'object') return null;
    const candidate = raw as { evaluation?: unknown; pssr?: unknown };
    if (!candidate.evaluation || !candidate.pssr) return null;

    const evaluation: Record<string, ChecklistTemplateItem[]> = {};
    for (const discipline of this.disciplineOptions) {
      const source = (candidate.evaluation as Record<string, unknown>)[discipline];
      evaluation[discipline] = this.migrateTemplateList(source, discipline, this.defaultChecklist(discipline));
    }
    const pssr = this.migrateTemplateList(candidate.pssr, 'PSSR', ['Work completed per design', 'Area inspected and safe for startup']);
    return { evaluation, pssr };
  }

  private migrateTemplateList(source: unknown, scope: string, fallback: string[]): ChecklistTemplateItem[] {
    if (Array.isArray(source)) {
      if (source.every((entry) => typeof entry === 'string')) {
        return this.templateItems(source as string[], scope);
      }
      return (source as unknown[])
        .map((entry, index) => {
          const item = entry as Partial<ChecklistTemplateItem>;
          const text = String(item?.text ?? '').trim();
          if (!text) return null;
          return {
            id: String(item.id ?? `${scope}-${index + 1}-${Date.now()}`),
            text,
            required: item.required !== false,
            active: item.active !== false,
          } as ChecklistTemplateItem;
        })
        .filter((item): item is ChecklistTemplateItem => Boolean(item));
    }
    return this.templateItems(fallback, scope);
  }

  private templateItems(lines: string[], scope: string): ChecklistTemplateItem[] {
    return lines.map((text, index) => ({
      id: `${scope.replace(/\s+/g, '-')}-${index + 1}`,
      text,
      required: true,
      active: true,
    }));
  }

  private newTemplateItem(scope: string): ChecklistTemplateItem {
    return {
      id: `${scope.replace(/\s+/g, '-')}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: '',
      required: true,
      active: true,
    };
  }

  private normalizeChecklistTemplates(templates: ChecklistTemplates): ChecklistTemplates {
    const normalizedEvaluation: Record<string, ChecklistTemplateItem[]> = {};
    for (const discipline of this.disciplineOptions) {
      const list = templates.evaluation[discipline] ?? [];
      normalizedEvaluation[discipline] = this.normalizeTemplateList(list, discipline, this.defaultChecklist(discipline));
    }
    const normalizedPssr = this.normalizeTemplateList(templates.pssr ?? [], 'PSSR', ['Work completed per design', 'Area inspected and safe for startup']);
    return { evaluation: normalizedEvaluation, pssr: normalizedPssr };
  }

  private normalizeTemplateList(items: ChecklistTemplateItem[], scope: string, fallback: string[]): ChecklistTemplateItem[] {
    const normalized = items
      .map((item) => ({
        id: item.id || `${scope}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        text: (item.text ?? '').trim(),
        required: item.required !== false,
        active: item.active !== false,
      }))
      .filter((item) => item.text.length > 0);

    if (normalized.length > 0) return normalized;
    return this.templateItems(fallback, scope);
  }

  private activeTemplateItems(items: ChecklistTemplateItem[] | undefined, scope: string): ChecklistTemplateItem[] {
    const list = (items ?? []).filter((item) => item.active && item.text.trim());
    if (list.length > 0) return list;
    if (scope === 'PSSR') {
      return this.templateItems(['Work completed per design', 'Area inspected and safe for startup'], 'PSSR');
    }
    return this.templateItems(this.defaultChecklist(scope), scope);
  }

  private workflowStepIndex(record: MocRecord): number {
    if (record.workflowState === 'Cancelled') {
      const fallbackStep = [...record.workflowHistory]
        .reverse()
        .find((event) => this.workflowSteps.some((entry) => entry.key === event.step && event.step !== 'Closed'));
      if (fallbackStep) {
        const idx = this.workflowSteps.findIndex((entry) => entry.key === fallbackStep.step);
        return idx >= 0 ? idx : 1;
      }
      return 1;
    }
    const idx = this.workflowSteps.findIndex((entry) => entry.key === record.workflowState);
    return idx >= 0 ? idx : 1;
  }

  private modalFocusableElements(): HTMLElement[] {
    if (!this.createModalCard) return [];
    return Array.from(
      this.createModalCard.nativeElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute('hidden'));
  }

  private focusFirstModalControl(): void {
    const focusable = this.modalFocusableElements();
    if (focusable.length > 0) focusable[0].focus();
  }

  private restoreFocusAfterModal(): void {
    const target = this.lastFocusedElement;
    this.lastFocusedElement = null;
    if (target && typeof target.focus === 'function') target.focus();
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

  private async readFileAsDataUrl(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private downloadDataUrl(dataUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName || 'document';
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
  }

  private blankPasswordForm(): ProfilePasswordForm {
    return { current: '', next: '', confirm: '' };
  }

  private defaultProfile(user: DemoUser): UserProfile {
    return {
      displayName: user.name,
      sex: this.defaultSex(user.id),
      email: `${user.name.toLowerCase()}@chevron.com`,
      department: user.discipline ? `${user.discipline} Engineering` : `${user.role} Team`,
      phone: '',
      location: 'Houston',
      timezone: 'America/Chicago',
    };
  }

  private loadUserProfiles(): Record<string, UserProfile> {
    const defaults: Record<string, UserProfile> = Object.fromEntries(this.users.map((user) => [user.id, this.defaultProfile(user)]));
    try {
      const raw = JSON.parse(localStorage.getItem(this.profileKey) ?? 'null') as Record<string, Partial<UserProfile> & { avatarKey?: string }> | null;
      if (raw) {
        const merged: Record<string, UserProfile> = { ...defaults };
        for (const user of this.users) {
          if (raw[user.id]) {
            const next = { ...defaults[user.id], ...raw[user.id] };
            next.sex = this.normalizeSex(next.sex, user.id);
            merged[user.id] = next;
          }
        }
        return merged;
      }
    } catch {
      // Fall back to defaults.
    }
    localStorage.setItem(this.profileKey, JSON.stringify(defaults));
    return defaults;
  }

  private saveUserProfiles(): void {
    localStorage.setItem(this.profileKey, JSON.stringify(this.userProfiles));
  }

  private defaultSex(userId: string): Sex {
    return this.userSexDefaults[userId] ?? 'Male';
  }

  private normalizeSex(sex: string | undefined, userId?: string): Sex {
    const normalized = String(sex ?? '').trim().toLowerCase();
    if (normalized === 'male') return 'Male';
    if (normalized === 'female') return 'Female';
    return userId ? this.defaultSex(userId) : 'Male';
  }

  private avatarForSex(sex: Sex): string {
    return this.sexAvatarMap[sex] ?? this.sexAvatarMap.Male;
  }

  private loadUserPasswords(): Record<string, string> {
    const defaults: Record<string, string> = Object.fromEntries(this.users.map((user) => [user.id, this.demoPassword]));
    try {
      const raw = JSON.parse(localStorage.getItem(this.passwordKey) ?? 'null') as Record<string, string> | null;
      if (!raw) return defaults;
      const merged = { ...defaults };
      for (const user of this.users) {
        const value = String(raw[user.id] ?? '').trim();
        if (value) merged[user.id] = value;
      }
      return merged;
    } catch {
      return defaults;
    }
  }

  private saveUserPasswords(): void {
    localStorage.setItem(this.passwordKey, JSON.stringify(this.userPasswords));
  }

  private openDocumentPreview(title: string, fileName: string, dataUrl: string, mimeType?: string): void {
    this.previewDocument = { title, fileName, dataUrl, mimeType };
    const type = this.previewType();
    this.previewResourceUrl = type === 'pdf' ? this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl) : null;
    this.previewTextContent = type === 'text' ? this.decodeDataUrlText(dataUrl) : '';
    this.showPreviewModal = true;
  }

  private documentMimeType(dataUrl: string, fallback?: string): string {
    const match = dataUrl.match(/^data:([^;,]+)[;,]/i);
    return (fallback || match?.[1] || '').toLowerCase();
  }

  private decodeDataUrlText(dataUrl: string): string {
    const parts = dataUrl.split(',', 2);
    if (parts.length < 2) return '';
    try {
      const header = parts[0].toLowerCase();
      const body = parts[1];
      if (header.includes(';base64')) return atob(body);
      return decodeURIComponent(body);
    } catch {
      return 'Preview unavailable for this text file.';
    }
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
        approvalHistory: [],
        workflowState: 'Evaluation',
        status: 'Open',
        waitingOn: 'Evaluator',
        workflowHistory: [this.seedHistory(now, 'Initiated', 'owner1', ['mech1'], 'MOC initiated and routed to Mike for evaluation.')],
        actionFlag: 'Evaluator',
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
        approvalHistory: [
          {
            id: 'AP-seed-1',
            gate: 'Implement',
            decision: 'Submitted',
            byUserId: 'owner1',
            at: now,
          },
        ],
        workflowState: 'Approval to Implement',
        status: 'Open',
        waitingOn: 'Manager',
        workflowHistory: [
          this.seedHistory(now, 'Initiated', 'owner1', ['mech1', 'process1'], 'MOC initiated and routed for discipline evaluation.'),
          this.seedHistory(now, 'Approval to Implement', 'owner1', ['manager1'], 'Evaluation completed and routed to Morgan.'),
        ],
        actionFlag: 'Manager',
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
        approvalHistory: [],
        workflowState: 'Evaluation',
        status: 'Open',
        waitingOn: 'Evaluator',
        workflowHistory: [this.seedHistory(now, 'Initiated', 'owner2', ['ops1'], 'MOC initiated and routed to Oscar for evaluation.')],
        actionFlag: 'Evaluator',
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
        approvalHistory: [
          {
            id: 'AP-seed-2',
            gate: 'Implement',
            decision: 'Approved',
            byUserId: 'manager1',
            at: now,
          },
          {
            id: 'AP-seed-3',
            gate: 'Start Up',
            decision: 'Approved',
            byUserId: 'manager1',
            at: now,
          },
        ],
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
    const template = this.activeTemplateItems(this.checklistTemplates.evaluation[discipline], discipline);
    return {
      id: `EV-${discipline.replace(/\s+/g, '-')}`,
      discipline,
      evaluatorId,
      complete,
      actionRequired: false,
      checklist: template.map((item, index) => ({
        id: `${discipline}-${index + 1}`,
        text: item.text,
        required: item.required,
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
