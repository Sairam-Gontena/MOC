import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AvatarModule } from 'primeng/avatar';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { AccordionModule } from 'primeng/accordion';
import { BadgeModule } from 'primeng/badge';
import { TimelineModule } from 'primeng/timeline';
import { MenubarModule } from 'primeng/menubar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { StepsModule } from 'primeng/steps';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';

type View = 'login' | 'dashboard' | 'detail' | 'admin' | 'actions' | 'help';
type UserRole = 'Owner' | 'Evaluator' | 'Manager' | 'Admin';
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
  title?: string;
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
  priority?: 'Critical' | 'High' | 'Normal';
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
  pssrSubmitted?: boolean;
  reworkSnapshot?: {
    title: string;
    description: string;
    basis: string;
    implementationDate: string;
    disciplines: string[];
  };
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
  imports: [
    CommonModule,
    FormsModule,
    AvatarModule,
    ToastModule,
    TableModule,
    ConfirmDialogModule,
    TooltipModule,
    AccordionModule,
    BadgeModule,
    TimelineModule,
    MenubarModule,
    PanelMenuModule,
    ButtonModule,
    CardModule,
    TagModule,
    StepsModule,
    DialogModule,
    MenuModule,
    InputTextModule,
    CheckboxModule,
    DividerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly storageKey = 'mocAngularRbacPrototype.v7';
  readonly checklistKey = 'mocAngularChecklistTemplates.v2';
  readonly sessionKey = 'mocAngularRbacSession.v1';
  readonly profileKey = 'mocAngularUserProfiles.v1';
  readonly passwordKey = 'mocAngularUserPasswords.v1';
  readonly notifReadKey = 'mocAngularReadNotifs.v1';
  readonly disciplineOptions = ['Mechanical', 'Process', 'Electrical', 'Operations', 'HSE', 'Instrumentation', 'Environmental'];
  readonly workflowSteps: Array<{ key: WorkflowState | 'Initiated'; label: string }> = [
    { key: 'Initiated', label: 'Initiated' },
    { key: 'Evaluation', label: 'Evaluation' },
    { key: 'Approval to Implement', label: 'Approval to Implement' },
    { key: 'Implementation', label: 'Implementation' },
    { key: 'PSSR', label: 'PSSR' },
    { key: 'Approval for Start Up', label: 'Approval for Start Up' },
    { key: 'Ready for Closure', label: 'Ready for Closure / Post-Startup Review' },
    { key: 'Closed', label: 'Closed' },
  ];
  readonly users: DemoUser[] = [
    { id: 'owner1', name: 'Olivia', role: 'Owner', title: 'Process Engineer' },
    { id: 'owner2', name: 'Owen', role: 'Owner', title: 'Mechanical Engineer' },
    { id: 'mech1', name: 'Mike', role: 'Evaluator', discipline: 'Mechanical', title: 'Sr. Mechanical Inspector' },
    { id: 'process1', name: 'Priya', role: 'Evaluator', discipline: 'Process', title: 'Process Safety Engineer' },
    { id: 'env1', name: 'Evan', role: 'Evaluator', discipline: 'Environmental', title: 'Environmental Specialist' },
    { id: 'hse1', name: 'Harper', role: 'Evaluator', discipline: 'HSE', title: 'HSE Advisor' },
    { id: 'ops1', name: 'Oscar', role: 'Evaluator', discipline: 'Operations', title: 'Operations Supervisor' },
    { id: 'manager1', name: 'Morgan', role: 'Manager', title: 'Area Manager' },
    { id: 'admin1', name: 'Ada', role: 'Admin', title: 'System Administrator' },
  ];

  navMenuItems: MenuItem[] = [];
  userMenuItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', command: () => this.openProfileModal() },
    { separator: true },
    { label: 'Logout', icon: 'pi pi-sign-out', command: () => this.logout() },
  ];
  workflowStepItems: MenuItem[] = this.workflowSteps.map((step) => ({ label: step.label }));

  private rebuildNavMenu(): void {
    const items: MenuItem[] = [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        command: () => this.openDashboard(),
      },
    ];

    // My Action Items — not shown for Admin (they see All MOCs on dashboard)
    if (this.currentUser?.role !== 'Admin') {
      const openActionItems = this.myActionItems.filter(r => !r.item.complete).length;
      const pendingAssigned = this.assignedRecords.filter(r => r.status === 'Open').length;
      const totalPending = openActionItems + pendingAssigned;
      items.push({
        label: 'Assigned Tasks',
        icon: 'pi pi-list-check',
        command: () => this.openActionBoard(),
        badge: totalPending ? String(totalPending) : undefined,
        badgeStyleClass: totalPending ? 'p-badge-danger' : undefined,
      });
    }

    if (this.currentUser?.role !== 'Admin') {
      items.push({
        label: 'Create New MOC',
        icon: 'pi pi-plus',
        disabled: !this.canInitiate(),
        command: () => this.openCreate(),
      });
    }

    if (this.currentUser?.role === 'Admin') {
      items.push({
        label: 'Create New MOC',
        icon: 'pi pi-plus',
        disabled: !this.canInitiate(),
        command: () => this.openCreate(),
      });
      items.push({
        label: 'Checklist Admin',
        icon: 'pi pi-cog',
        command: () => this.openAdmin(),
      });
    }

    items.push({
      label: 'Help & Process Guide',
      icon: 'pi pi-question-circle',
      command: () => this.openHelp(),
    });

    this.navMenuItems = items;
  }

  readonly demoPassword = 'demo123';

  avatarInitials(name: string): string {
    const trimmed = (name ?? '').trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const initials = (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts.at(-1)?.[0] ?? '' : '');
    return initials.toUpperCase().slice(0, 2) || trimmed[0].toUpperCase();
  }

  view: View = 'login';
  loginUsername = '';
  loginPassword = '';
  loginError = '';
  loginTab: 'credentials' | 'quick' = 'quick';
  showCreateModal = false;
  showProfileModal = false;
  showPreviewModal = false;
  showRoutingTracker = false;
  showNotifPanel = false;
  showDemoScript = false;
  sidebarCollapsed = false;
  kpiFilter: 'all' | 'open' | 'waiting' | 'closed' = 'all';
  filterStatus = '';
  filterPhase = '';
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
  actionLoading = false;
  pageLoading = false;
  form: InitiationForm = this.blankForm();
  newAction: Pick<ActionItem, 'phase' | 'description' | 'assigneeId' | 'dueDate' | 'priority'> = this.blankAction();
  actionComments: Record<string, string> = {};
  actionEvidence: Record<string, FileAttachment | undefined> = {};
  checklistTemplates: ChecklistTemplates = this.loadChecklistTemplates();
  records: MocRecord[] = this.loadRecords();
  implementRejectionComment = '';
  startupRejectionComment = '';
  cancelComment = '';
  reworkNotice = '';
  readNotifKeys = new Set<string>(this.loadReadNotifKeys());
  sortColumn = '';
  sortDir: 1 | -1 = 1;
  formOwner = 'owner1';
  reworkSummaryCollapsed = true;
  workflowPanelCollapsed = false;
  mocPage = 1;
  mocPageSize = 20;
  dismissedNotifKeys = new Set<string>();
  userProfiles: Record<string, UserProfile> = this.loadUserProfiles();
  userPasswords: Record<string, string> = this.loadUserPasswords();
  private lastFocusedElement: HTMLElement | null = null;
  @ViewChild('createModalCard') createModalCard?: ElementRef<HTMLElement>;

  constructor(private readonly sanitizer: DomSanitizer, private readonly messageService: MessageService, private readonly confirmationService: ConfirmationService) {
    // Debug hook for local/demo troubleshooting (harmless for internal prototype).
    (globalThis as unknown as { __mocApp?: unknown }).__mocApp = this;
    const debugGlobal = globalThis as unknown as { __mocLastError?: unknown; __mocLastRejection?: unknown };
    if (typeof debugGlobal.__mocLastError === 'undefined') {
      debugGlobal.__mocLastError = null;
      globalThis.addEventListener('error', (event) => {
        debugGlobal.__mocLastError = (event as ErrorEvent).message || String((event as ErrorEvent).error ?? 'Unknown error');
      });
      globalThis.addEventListener('unhandledrejection', (event) => {
        debugGlobal.__mocLastRejection = String((event as PromiseRejectionEvent).reason ?? 'Unhandled rejection');
      });
    }
    if (this.currentUser) {
      this.view = 'dashboard';
      this.rebuildNavMenu();
    }
  }

  get loginNames(): string[] {
    return this.users.map((user) => user.name);
  }

  /** My MOCs = only MOCs this user created as Owner. Admin sees all. */
  get visibleRecords(): MocRecord[] {
    if (!this.currentUser) return [];
    if (this.currentUser.role === 'Admin') return this.records;
    return this.records.filter(r => r.ownerId === this.currentUser!.id);
  }

  /** Assigned Tasks = MOCs where this user has a role assignment but is NOT the owner.
   *  Used in the Assigned Tasks view alongside myActionItems. */
  get assignedRecords(): MocRecord[] {
    if (!this.currentUser) return [];
    if (this.currentUser.role === 'Admin') return this.records;
    const uid = this.currentUser.id;
    const managerActionStates: WorkflowState[] = ['Approval to Implement', 'Approval for Start Up'];
    return this.records.filter(record =>
      record.ownerId !== uid && (
        (record.managerId === uid && managerActionStates.includes(record.workflowState)) ||
        record.evaluatorIds.includes(uid) ||
        record.actionItems.some(item => item.assigneeId === uid) ||
        (this.currentUser!.discipline === 'Operations' && record.workflowState === 'PSSR')
      )
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
    let records = this.visibleRecords;
    // KPI tile filter
    if (this.kpiFilter === 'open')    records = records.filter(r => r.status === 'Open');
    if (this.kpiFilter === 'waiting') records = records.filter(r => r.status === 'Open' && r.waitingOn !== '-');
    if (this.kpiFilter === 'closed')  records = records.filter(r => r.status === 'Closed');
    // Status dropdown
    if (this.filterStatus) records = records.filter(r => r.status === this.filterStatus);
    // Phase dropdown
    if (this.filterPhase) records = records.filter(r => r.workflowState === this.filterPhase);
    // Text search
    const query = this.mocFilterText.trim().toLowerCase();
    if (query) {
      records = records.filter(record => {
        const owner = this.userName(record.ownerId).toLowerCase();
        return (
          record.id.toLowerCase().includes(query) ||
          record.title.toLowerCase().includes(query) ||
          record.workflowState.toLowerCase().includes(query) ||
          record.status.toLowerCase().includes(query) ||
          owner.includes(query)
        );
      });
    }
    // Sort
    if (this.sortColumn) {
      const col = this.sortColumn;
      const dir = this.sortDir;
      records = [...records].sort((a, b) => {
        let av = '', bv = '';
        if (col === 'id')      { av = a.id;               bv = b.id; }
        else if (col === 'title')   { av = a.title;            bv = b.title; }
        else if (col === 'date')    { av = a.implementationDate; bv = b.implementationDate; }
        else if (col === 'state')   { av = a.workflowState;     bv = b.workflowState; }
        else if (col === 'waiting') { av = a.waitingOn;         bv = b.waitingOn; }
        return av.localeCompare(bv) * dir;
      });
    }
    return records;
  }

  clearFilters(): void {
    this.kpiFilter = 'all';
    this.filterStatus = '';
    this.filterPhase = '';
    this.mocFilterText = '';
    this.mocPage = 1;
  }

  sortBy(col: string): void {
    if (this.sortColumn === col) {
      this.sortDir = this.sortDir === 1 ? -1 : 1;
    } else {
      this.sortColumn = col;
      this.sortDir = 1;
    }
    this.mocPage = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredVisibleRecords.length / this.mocPageSize));
  }

  get pagedRecords(): MocRecord[] {
    const start = (this.mocPage - 1) * this.mocPageSize;
    return this.filteredVisibleRecords.slice(start, start + this.mocPageSize);
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  get welcomeSummary(): string {
    if (!this.currentUser) return '';
    const role = this.currentUser.role;
    const open = this.pendingReview;
    const myPending = this.visibleRecords.filter(r => r.status === 'Open' && r.waitingOn !== '-').length;
    if (role === 'Manager')  return `You have ${myPending} MOC${myPending !== 1 ? 's' : ''} awaiting your approval decision.`;
    if (role === 'Evaluator') return `You have ${open} evaluation${open !== 1 ? 's' : ''} assigned to you.`;
    if (role === 'Owner')     return `You own ${open} active MOC${open !== 1 ? 's' : ''}.`;
    return `${this.records.length} total MOCs are in the system across all users.`;
  }

  get notifications(): Array<{ key: string; text: string; icon: string; severity: 'warn' | 'info' | 'error'; record?: MocRecord; read: boolean }> {
    if (!this.currentUser) return [];
    const notifs: Array<{ key: string; text: string; icon: string; severity: 'warn' | 'info' | 'error'; record?: MocRecord; read: boolean }> = [];
    const role = this.currentUser.role;
    const uid = this.currentUser.id;

    const push = (key: string, text: string, icon: string, severity: 'warn' | 'info' | 'error', record?: MocRecord) => {
      notifs.push({ key, text, icon, severity, record, read: this.readNotifKeys.has(key) });
    };

    if (role === 'Manager') {
      for (const r of this.records.filter(r => r.managerId === uid && r.waitingOn === 'Manager' && r.status === 'Open')) {
        push(`mgr-${r.id}-${r.workflowState}`, `${r.id}: Awaiting approval — ${r.workflowState}`, 'pi-check-circle', 'error', r);
      }
    }
    if (role === 'Evaluator') {
      for (const r of this.records.filter(r =>
        r.workflowState === 'Evaluation' &&
        r.evaluatorIds.includes(uid) &&
        r.evaluations.some(e => e.evaluatorId === uid && !e.complete)
      )) {
        push(`eval-${r.id}`, `${r.id}: Evaluation pending`, 'pi-clipboard', 'warn', r);
      }
      if (this.currentUser.discipline === 'Operations') {
        for (const r of this.records.filter(r => r.workflowState === 'PSSR')) {
          push(`pssr-${r.id}`, `${r.id}: PSSR requires your review`, 'pi-clipboard', 'warn', r);
        }
      }
    }
    if (role === 'Owner') {
      for (const r of this.records.filter(r => r.ownerId === uid && r.waitingOn === 'Owner' && r.status === 'Open')) {
        const msg =
          r.workflowState === 'Approval to Implement' ? 'Approved to implement — begin implementation' :
          r.workflowState === 'Implementation'        ? 'Implementation in progress — mark complete when done' :
          r.workflowState === 'PSSR'                  ? 'PSSR complete — submit for startup approval' :
          r.workflowState === 'Approval for Start Up' ? 'Startup approved — proceed to Ready for Closure' :
          r.workflowState === 'Ready for Closure'     ? 'Ready for closure — close MOC when post-startup items done' :
          r.workflowState === 'Evaluation'            ? 'Rework required — update and resubmit' :
          `Action needed — ${r.workflowState}`;
        push(`own-${r.id}-${r.workflowState}`, `${r.id}: ${msg}`, 'pi-exclamation-circle', 'info', r);
      }
    }
    // Open action items assigned to current user (all roles)
    for (const row of this.myActionItems.filter(row => !row.item.complete)) {
      const desc = row.item.description.length > 45 ? row.item.description.substring(0, 45) + '…' : row.item.description;
      push(`ai-${row.item.id}`, `${row.record.id}: ${desc}`, 'pi-list', 'warn', row.record);
    }
    return notifs;
  }

  get panelNotifications() {
    return this.notifications.filter(n => !this.dismissedNotifKeys.has(n.key));
  }

  /** Count only unread notifications for the bell badge */
  get notificationCount(): number { return this.panelNotifications.filter(n => !n.read).length; }

  handleNotifClick(n: { key: string; record?: MocRecord }): void {
    this.readNotifKeys.add(n.key);
    this.saveReadNotifKeys();
    this.showNotifPanel = false;
    if (n.record) {
      this.openDetail(n.record);
    } else {
      this.openActionBoard();
    }
  }

  markAllNotifsRead(): void {
    for (const n of this.notifications) this.readNotifKeys.add(n.key);
    this.saveReadNotifKeys();
  }

  clearReadNotifs(): void {
    for (const n of this.notifications) this.dismissedNotifKeys.add(n.key);
    this.readNotifKeys.clear();
    this.saveReadNotifKeys();
  }

  isOverdue(dateStr: string): boolean {
    if (!dateStr) return false;
    return dateStr < new Date().toISOString().slice(0, 10);
  }

  get openActionItemCount(): number {
    return this.myActionItems.filter(r => !r.item.complete).length;
  }

  printMoc(): void { window.print(); }

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
    return '';
  }

  usersByRole(role: UserRole): DemoUser[] {
    return this.users.filter((u) => u.role === role);
  }

  userTitle(userId: string): string {
    return this.users.find(u => u.id === userId)?.title ?? '';
  }

  userLabel(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    if (!user) return userId;
    return user.title ? `${user.name} — ${user.title}` : user.name;
  }

  openHelp(): void {
    this.view = 'help';
    window.scrollTo({ top: 0 });
  }

  quickLogin(user: DemoUser): void {
    this.currentUser = user;
    this.readNotifKeys.clear();
    localStorage.setItem(this.sessionKey, user.id);
    this.loginError = '';
    this.loginUsername = '';
    this.loginPassword = '';
    this.rebuildNavMenu();
    this.openDashboard();
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
    this.readNotifKeys.clear();
    localStorage.setItem(this.sessionKey, this.currentUser.id);
    this.loginPassword = '';
    this.rebuildNavMenu();
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
    this.readNotifKeys.clear();
    localStorage.setItem(this.sessionKey, user.id);
    this.loginPassword = '';
    this.rebuildNavMenu();
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
    this.navMenuItems = [];
  }

  openDashboard(): void {
    this.view = this.currentUser ? 'dashboard' : 'login';
    this.selectedMoc = null;
    this.submitAttempted = false;
    this.showCreateModal = false;
    window.scrollTo({ top: 0 });
    this.rebuildNavMenu();
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
    return '';
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
    this.formOwner = 'owner1';
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
    if (this.showCreateModal) { this.closeCreateModal(); return; }
    if (this.showPreviewModal) { this.closePreviewModal(); return; }
    if (this.showProfileModal) { this.closeProfileModal(); return; }
    if (this.showRoutingTracker) { this.showRoutingTracker = false; return; }
    if (this.view === 'detail') { this.openDashboard(); return; }
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
    // Auto-mark any notifications for this record as read
    for (const n of this.notifications) {
      if (n.record?.id === record.id) this.readNotifKeys.add(n.key);
    }
    this.view = 'detail';
    this.showCreateModal = false;
    window.scrollTo({ top: 0 });
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
    // Manager: can view any MOC assigned to them
    return record.managerId === this.currentUser.id;
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
    // Remove blank items in-place so ngModel bindings stay valid
    for (const discipline of this.disciplineOptions) {
      const items = this.checklistTemplates.evaluation[discipline];
      if (items) {
        this.checklistTemplates.evaluation[discipline] = items.filter(i => i.text.trim().length > 0);
      }
    }
    this.checklistTemplates.pssr = (this.checklistTemplates.pssr ?? []).filter(i => i.text.trim().length > 0);
    localStorage.setItem(this.checklistKey, JSON.stringify(this.checklistTemplates));
    this.messageService.add({
      severity: 'success', summary: 'Templates Saved',
      detail: 'Checklist templates updated. New MOCs will use these settings.', life: 4000
    });
  }

  workflowStepClass(record: MocRecord, stepKey: WorkflowState | 'Initiated'): string {
    const currentIndex = this.workflowStepIndex(record);
    const stepIndex = this.workflowSteps.findIndex((entry) => entry.key === stepKey);
    if (stepIndex < 0) return 'step';
    if (stepIndex < currentIndex) return 'step complete';
    if (stepIndex === currentIndex) return 'step active';
    return 'step';
  }

  workflowStepState(record: MocRecord, stepKey: WorkflowState | 'Initiated'): 'Complete' | 'Current' | 'Upcoming' {
    // When MOC is fully closed, all steps turn green
    if (record.workflowState === 'Closed') return 'Complete';
    const currentIndex = this.workflowStepIndex(record);
    const stepIndex = this.workflowSteps.findIndex((entry) => entry.key === stepKey);
    if (stepIndex < currentIndex) return 'Complete';
    if (stepIndex === currentIndex) return 'Current';
    return 'Upcoming';
  }

  completedStepCount(record: MocRecord): number {
    return this.workflowStepIndex(record);
  }

  workflowTagSeverity(state: 'Complete' | 'Current' | 'Upcoming'): 'success' | 'info' | 'secondary' {
    if (state === 'Complete') return 'success';
    if (state === 'Current') return 'info';
    return 'secondary';
  }

  workflowStepsModel(record: MocRecord): MenuItem[] {
    return this.workflowSteps.map((step) => {
      const state = this.workflowStepState(record, step.key);
      return {
        label: step.label,
        styleClass: state === 'Complete' ? 'is-done' : state === 'Current' ? 'is-current' : 'is-upcoming',
      };
    });
  }

  workflowNodeClass(record: MocRecord, stepKey: WorkflowState | 'Initiated'): string {
    const state = this.workflowStepState(record, stepKey);
    if (state === 'Complete') return 'is-done';
    if (state === 'Current') return 'is-current';
    return 'is-upcoming';
  }

  connectorState(record: MocRecord, fromIndex: number): 'done' | 'current' | 'upcoming' {
    const currentIndex = this.workflowStepIndex(record);
    // fromIndex is the connector index along the route map path. We color connectors
    // by workflow progression (0->1, 1->2, ...), independent of node placement.
    if (fromIndex < currentIndex - 1) return 'done';
    if (fromIndex === currentIndex - 1) return 'current';
    return 'upcoming';
  }

  connectorStroke(record: MocRecord, fromIndex: number): string {
    const state = this.connectorState(record, fromIndex);
    if (state === 'done') return '#16a34a';
    if (state === 'current') return '#2563eb';
    return '#cbd5e1';
  }

  connectorMarkerId(record: MocRecord, fromIndex: number): string {
    const state = this.connectorState(record, fromIndex);
    if (state === 'done') return 'arrow-done';
    if (state === 'current') return 'arrow-current';
    return 'arrow-upcoming';
  }

  mapNodeFill(record: MocRecord, idx: number): string {
    const state = this.workflowStepState(record, this.workflowSteps[idx]?.key ?? 'Evaluation');
    if (state === 'Complete') return '#16a34a';
    if (state === 'Current') return '#2563eb';
    return '#e8edf3';
  }

  mapNodeStroke(record: MocRecord, idx: number): string {
    const state = this.workflowStepState(record, this.workflowSteps[idx]?.key ?? 'Evaluation');
    if (state === 'Complete') return '#15803d';
    if (state === 'Current') return '#1d4ed8';
    return '#c8d1dc';
  }

  // Route map SVG geometry (fixed single-line map).
  readonly routeMapY = 50;

  routeMapX(idx: number): number {
    const count = Math.max(1, this.workflowSteps.length);
    if (count === 1) return 500;
    const left = 70;
    const right = 930;
    return left + ((right - left) * idx) / (count - 1);
  }

  workflowProgressLabel(record: MocRecord): string {
    const index = this.workflowStepIndex(record);
    const step = this.workflowSteps[index] ?? this.workflowSteps[0];
    return `Step ${index + 1} of ${this.workflowSteps.length}: ${step.label}`;
  }

  workflowStateBadgeClass(state: string): string {
    const map: Record<string, string> = {
      'Evaluation': 'badge-blue',
      'Approval to Implement': 'badge-amber',
      'Implementation': 'badge-green',
      'PSSR': 'badge-purple',
      'Approval for Start Up': 'badge-pink',
      'Ready for Closure': 'badge-cyan',
      'Closed': 'badge-gray',
      'Cancelled': 'badge-red',
    };
    return map[state] ?? 'badge-gray';
  }

  disciplineBadgeClass(discipline: string): string {
    const map: Record<string, string> = {
      'Mechanical': 'disc-blue',
      'Process': 'disc-teal',
      'Electrical': 'disc-purple',
      'Instrumentation': 'disc-amber',
      'Environmental': 'disc-green',
      'HSE': 'disc-orange',
      'Operations': 'disc-indigo',
      'Safety': 'disc-red',
      'Civil': 'disc-brown',
    };
    return map[discipline] ?? 'disc-blue';
  }

  evalProgress(record: MocRecord): string {
    if (!record.evaluations.length) return '-';
    const done = record.evaluations.filter((t) => t.complete).length;
    return `${done}/${record.evaluations.length}`;
  }

  evalProgressClass(record: MocRecord): string {
    if (!record.evaluations.length) return '';
    const done = record.evaluations.filter((t) => t.complete).length;
    if (done === record.evaluations.length) return 'progress-done';
    if (done > 0) return 'progress-partial';
    return 'progress-none';
  }

  waitingOnLabel(record: MocRecord): string {
    if (record.status !== 'Open') return 'N/A';
    const w = this.waitingOnFor(record);
    return w || '-';
  }

  userName(userId: string): string {
    return this.users.find((user) => user.id === userId)?.name ?? userId;
  }

  relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
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

  routingRows(record: MocRecord): Array<{ n: number; step: string; summary: string; by: string; assignedTo: string; at: string }> {
    const events = [...record.workflowHistory].sort((a, b) => a.at.localeCompare(b.at));
    return events.map((event, idx) => ({
      n: idx + 1,
      step: event.step,
      summary: event.note,
      by: this.userName(event.byUserId),
      assignedTo: event.assignedToUserIds.length ? this.userList(event.assignedToUserIds) : '-',
      at: event.at,
    }));
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
    // Only Evaluation AIs assigned to this evaluator themselves block their own completion.
    const selfBlockingActions = record.actionItems.filter(
      (item) => item.phase === 'Evaluation' && item.assigneeId === task.evaluatorId && !item.complete,
    );
    if (selfBlockingActions.length > 0) return 'Action Item Pending';
    return 'Ready for Completion';
  }

  private evaluationActionContext(
    record: MocRecord,
  ): { mode: 'evaluator'; task: EvaluationTask } | { mode: 'action-owner' } | null {
    const task = this.evaluatorTask(record);
    // Evaluators with an assigned task can always create action items (any phase).
    if (this.canEvaluate(record) && task) {
      return { mode: 'evaluator', task };
    }
    if (!this.currentUser || this.currentUser.role === 'Manager') return null;
    // Non-evaluator action item assignees who completed an Evaluation AI can create
    // follow-on Pre-Startup or Post-Startup action items (e.g. Environmental Specialist).
    const completedEvalAction = record.actionItems.find(
      (item) => item.phase === 'Evaluation' && item.assigneeId === this.currentUser!.id && item.complete && this.isMutable(record),
    ) ?? null;
    if (completedEvalAction) return { mode: 'action-owner' };
    return null;
  }

  pendingReviewActions(_record: MocRecord): ActionItem[] {
    // Review gate removed: evaluators can complete their evaluation without explicitly
    // reviewing action items assigned to other people. Kept as a no-op to avoid
    // breaking any references; returns empty array so it never blocks anything.
    return [];
  }

  canReviewAction(_item: ActionItem): boolean {
    // Review-action gate removed per business logic clarification.
    return false;
  }

  canCompleteAction(record: MocRecord, item: ActionItem): boolean {
    if (!this.currentUser || item.complete || !this.isMutable(record)) return false;
    // Only the person the action item is assigned to may mark it complete (+ Admin override).
    if (item.assigneeId !== this.currentUser.id && this.currentUser.role !== 'Admin') return false;
    // Pre-Startup action items: only completable during PSSR stage
    if (item.phase === 'Pre-Startup') {
      return record.workflowState === 'PSSR';
    }
    // Post-Startup action items: only completable during Ready for Closure (after startup)
    if (item.phase === 'Post-Startup') {
      return record.workflowState === 'Ready for Closure';
    }
    // Evaluation action items: completable during Evaluation stage
    return record.workflowState === 'Evaluation';
  }

  actionItemStageNote(item: ActionItem): string {
    if (item.complete) return '';
    if (item.phase === 'Pre-Startup') return 'Completable during PSSR step only';
    if (item.phase === 'Post-Startup') return 'Completable after startup approval (Ready for Closure)';
    return 'Completable during Evaluation step only';
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
      this.canStartImplementation(record) ||
      this.canMarkImplemented(record) ||
      this.canCompletePssr(record) ||
      this.canSubmitForStartupApproval(record) ||
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
      record.waitingOn === 'Owner' &&
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
    if (task.complete) return false;
    // All required checklist items must be done.
    if (!task.checklist.every((item) => !item.required || item.complete)) return false;
    // Only Evaluation AIs that are ASSIGNED TO THIS EVALUATOR block their own completion.
    // If the evaluator raised an Evaluation AI for another person, they are NOT blocked.
    const selfAssignedOpenEvalActions = record.actionItems.filter(
      (item) => item.phase === 'Evaluation' && item.assigneeId === task.evaluatorId && !item.complete,
    );
    return selfAssignedOpenEvalActions.length === 0;
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
    // Action-owners (non-evaluators who completed an Evaluation AI) cannot create Evaluation-type AIs.
    if (context?.mode === 'action-owner' && this.newAction.phase === 'Evaluation') {
      this.newAction.phase = 'Post-Startup';
    }
    return Boolean(context && this.isMutable(record) && record.workflowState === 'Evaluation');
  }

  canCreateEvaluationPhaseAction(record: MocRecord): boolean {
    // Only evaluators (not action-owners completing someone else's task) can create Evaluation-type AIs.
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
      priority: this.newAction.priority,
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
      // ALL Evaluation AIs (regardless of who raised them or who they are assigned to)
      // must be complete before the Owner can advance the MOC. This is the MOC-level gate.
      !record.actionItems.some((item) => item.phase === 'Evaluation' && !item.complete)
    );
  }

  submitForApproval(record: MocRecord): void {
    if (!this.canSubmitForApproval(record)) return;
    this.confirmAction('Submit for Approval', `Submit ${record.id} for manager approval to implement?`, () => {
      record.workflowState = 'Approval to Implement';
      record.waitingOn = 'Manager';
      record.actionFlag = 'Manager';
      this.addApproval(record, 'Implement', 'Submitted');
      this.finishWorkflowUpdate(record, 'Submitted for manager approval to implement.');
    });
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
    this.confirmAction('Approve to Implement', `Approve ${record.id} for implementation? The Owner will be notified to begin.`, () => {
      record.waitingOn = 'Owner';
      record.actionFlag = 'Owner';
      this.addApproval(record, 'Implement', 'Approved');
      this.finishWorkflowUpdate(record, 'Manager approved to implement. Owner can now begin implementation.');
    });
  }

  canStartImplementation(record: MocRecord): boolean {
    return (
      this.isMutable(record) &&
      Boolean(this.currentUser && (this.currentUser.id === record.ownerId || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'Approval to Implement' &&
      record.waitingOn === 'Owner'
    );
  }

  startImplementation(record: MocRecord): void {
    if (!this.canStartImplementation(record)) return;
    this.confirmAction('Begin Implementation', `Confirm that physical implementation work on ${record.id} has commenced?`, () => {
      record.workflowState = 'Implementation';
      record.waitingOn = 'Owner';
      record.actionFlag = 'Owner';
      this.finishWorkflowUpdate(record, 'Owner commenced implementation.');
    });
  }

  canSendBackToEvaluation(record: MocRecord): boolean {
    return this.canApproveToImplement(record);
  }

  sendBackToEvaluation(record: MocRecord): void {
    if (!this.canSendBackToEvaluation(record)) return;
    const comment = this.implementRejectionComment.trim();
    if (!comment) return;
    this.confirmAction('Reject — Send Back to Evaluation', `Reject ${record.id} and return to Evaluation? All evaluations will be reset.`, () => {
      // Snapshot the current field values before owner edits them
      record.reworkSnapshot = {
        title: record.title,
        description: record.description,
        basis: record.basis,
        implementationDate: record.implementationDate,
        disciplines: [...record.disciplines],
      };
      record.workflowState = 'Evaluation';
      record.waitingOn = 'Owner';
      record.actionFlag = 'Owner';
      this.resetEvaluationTasks(record);
      this.addApproval(record, 'Implement', 'Rejected', comment);
      this.implementRejectionComment = '';
      this.finishWorkflowUpdate(record, `Manager sent back to Evaluation. Comment: ${comment}`);
    });
  }

  canCancelMoc(record: MocRecord): boolean {
    if (this.currentUser?.role === 'Manager') return false;
    return this.canApproveToImplement(record);
  }

  cancelMoc(record: MocRecord): void {
    if (!this.canCancelMoc(record)) return;
    const comment = this.cancelComment.trim();
    if (!comment) return;
    this.confirmationService.confirm({
      message: `Are you sure you want to cancel ${record.id}?`,
      header: 'Cancel MOC',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        record.workflowState = 'Cancelled';
        record.status = 'Cancelled';
        record.waitingOn = '-';
        record.actionFlag = 'Complete';
        this.addApproval(record, 'Implement', 'Cancelled', comment);
        this.cancelComment = '';
        this.finishWorkflowUpdate(record, `MOC cancelled by manager. Comment: ${comment}`);
      },
    });
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
    this.confirmAction('Mark Implementation Complete', `Confirm all field implementation work for ${record.id} is done? This will route the MOC to PSSR.`, () => {
      record.workflowState = 'PSSR';
      record.waitingOn = 'Operations';
      record.actionFlag = 'Operations';
      this.finishWorkflowUpdate(record, 'Implementation completed. Routed to PSSR.');
    });
  }

  canCompletePssr(record: MocRecord): boolean {
    // Operations can complete PSSR even with open Pre-Startup action items.
    // Pre-Startup items block startup approval (canSubmitForStartupApproval), not PSSR completion.
    return (
      this.isMutable(record) &&
      Boolean(this.currentUser && (this.currentUser.discipline === 'Operations' || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'PSSR' &&
      record.pssrChecklist.every((item) => !item.required || item.complete)
    );
  }

  pssrComplete(record: MocRecord): boolean {
    return record.pssrChecklist.every((item) => item.complete);
  }

  completePssr(record: MocRecord): void {
    if (!this.canCompletePssr(record)) return;
    this.confirmAction('Submit PSSR for Review', `Submit the PSSR for ${record.id}? The Owner will review and advance to Startup Approval.`, () => {
      record.pssrSubmitted = true;
      record.waitingOn = 'Owner';
      record.actionFlag = 'Owner';
      this.finishWorkflowUpdate(record, 'PSSR completed by Operations. Owner to review and submit for startup approval.');
    });
  }

  canSubmitForStartupApproval(record: MocRecord): boolean {
    return (
      this.isMutable(record) &&
      Boolean(this.currentUser && (this.currentUser.id === record.ownerId || this.currentUser.role === 'Admin')) &&
      record.workflowState === 'PSSR' &&
      record.pssrSubmitted === true &&
      !record.actionItems.some(item => item.phase === 'Pre-Startup' && !item.complete)
    );
  }

  submitForStartupApproval(record: MocRecord): void {
    if (!this.canSubmitForStartupApproval(record)) return;
    this.confirmAction('Submit for Startup Approval', `Submit ${record.id} to the Manager for startup approval?`, () => {
      record.workflowState = 'Approval for Start Up';
      record.waitingOn = 'Manager';
      record.actionFlag = 'Manager';
      this.addApproval(record, 'Start Up', 'Submitted');
      this.finishWorkflowUpdate(record, 'Owner submitted for startup approval.');
    });
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
    this.confirmAction('Approve Start Up', `Approve startup for ${record.id}? The Owner will proceed to Ready for Closure.`, () => {
      this.addApproval(record, 'Start Up', 'Approved');
      record.waitingOn = 'Owner';
      record.actionFlag = 'Owner';
      this.finishWorkflowUpdate(record, 'Manager approved startup. Owner must proceed to Ready for Closure.');
    });
  }

  canSendBackToPssr(record: MocRecord): boolean {
    return this.canApproveStartup(record);
  }

  sendBackToPssr(record: MocRecord): void {
    if (!this.canSendBackToPssr(record)) return;
    const comment = this.startupRejectionComment.trim();
    if (!comment) return;
    this.confirmAction('Reject — Send Back to PSSR', `Reject startup and return ${record.id} to PSSR for further review?`, () => {
      this.addApproval(record, 'Start Up', 'Rejected', comment);
      record.workflowState = 'PSSR';
      record.pssrSubmitted = false;
      for (const item of record.pssrChecklist) {
        item.complete = false;
        item.completedByUserId = undefined;
        item.completedAt = undefined;
      }
      record.waitingOn = 'Operations';
      record.actionFlag = 'Operations';
      this.startupRejectionComment = '';
      this.finishWorkflowUpdate(record, `Manager sent back to PSSR. Comment: ${comment}`);
    });
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
    this.confirmAction('Proceed to Ready for Closure', `Move ${record.id} to Ready for Closure / Post-Startup Review?`, () => {
      record.workflowState = 'Ready for Closure';
      this.recalculateRecordState(record);
      this.finishWorkflowUpdate(record, 'Owner proceeded to Ready for Closure.');
    });
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
    this.confirmationService.confirm({
      message: `Are you sure you want to close ${record.id}? This cannot be undone.`,
      header: 'Close MOC',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        record.workflowState = 'Closed';
        record.status = 'Closed';
        record.waitingOn = '-';
        record.actionFlag = 'Complete';
        record.closureDate = new Date().toISOString();
        record.closedByUserId = this.currentUser?.id;
        this.finishWorkflowUpdate(record, 'MOC closed.');
      },
    });
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
    // Re-route back to evaluators so they can re-evaluate after rework
    record.waitingOn = 'Evaluator';
    record.actionFlag = 'Evaluator';
    this.addHistory(record, 'Evaluation', 'Owner updated fields after manager rejection. Routed back to evaluators.');
    this.touchSelectedMoc();
    this.messageService.add({ severity: 'success', summary: 'Rework Saved', detail: 'MOC re-routed to evaluators for review.', life: 4000 });
  }

  /** Returns rows of field-level diff between rework snapshot and current values. */
  getReworkDiff(record: MocRecord): Array<{ field: string; before: string; after: string; changed: boolean }> {
    const snap = record.reworkSnapshot;
    if (!snap) return [];
    const fmt = (d: string) => {
      if (!d) return '—';
      const parts = d.split('-');
      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return d;
    };
    return [
      { field: 'Title',            before: snap.title,                      after: record.title,                      changed: snap.title !== record.title },
      { field: 'Description',      before: snap.description,                after: record.description,                changed: snap.description !== record.description },
      { field: 'Basis / Justification', before: snap.basis,                after: record.basis,                      changed: snap.basis !== record.basis },
      { field: 'Date Needed By',   before: fmt(snap.implementationDate),    after: fmt(record.implementationDate),    changed: snap.implementationDate !== record.implementationDate },
      { field: 'Disciplines',      before: snap.disciplines.join(', '),     after: record.disciplines.join(', '),     changed: snap.disciplines.join(',') !== record.disciplines.join(',') },
    ];
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
    this.confirmationService.confirm({
      message: 'Once submitted, this MOC will be routed for evaluation and cannot be edited. Are you sure you want to submit?',
      header: 'Confirm MOC Submission',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Yes, Submit MOC',
      rejectLabel: 'Cancel',
      accept: () => this.doSubmitMoc(),
    });
  }

  private doSubmitMoc(): void {
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
      ownerId: this.currentUser.role === 'Admin' ? this.formOwner : this.currentUser.id,
      evaluatorIds: this.form.disciplines.map((discipline) => this.evaluatorForDiscipline(discipline)),
      managerId: this.users.find(u => u.role === 'Manager')?.id ?? 'manager1',
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
    setTimeout(() => {
      this.selectedMoc = record;
      this.showCreateModal = false;
      this.view = 'detail';
      this.isSubmitting = false;
      this.messageService.add({ severity: 'success', summary: 'MOC Created', detail: `${record.id} initiated and routed for evaluation.`, life: 4000 });
    }, 800);
  }

  resetDummyData(): void {
    this.confirmationService.confirm({
      message: 'Reset all MOC data to defaults? This will remove any changes.',
      header: 'Reset Dummy Data',
      icon: 'pi pi-refresh',
      accept: () => {
        this.records = this.seedRecords();
        this.mocFilterText = '';
        this.saveRecords();
        this.openDashboard();
        this.messageService.add({ severity: 'info', summary: 'Reset', detail: 'Dummy data restored.', life: 3000 });
      },
    });
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

  private blankAction(): Pick<ActionItem, 'phase' | 'description' | 'assigneeId' | 'dueDate' | 'priority'> {
    return { phase: 'Evaluation', description: '', assigneeId: 'owner1', dueDate: '', priority: 'Normal' };
  }

  private recalculateRecordState(record: MocRecord): void {
    if (record.status !== 'Open') {
      record.waitingOn = '-';
      record.actionFlag = 'Complete';
      return;
    }

    if (record.workflowState === 'Evaluation') {
      const openEvaluationActions = record.actionItems.some((item) => item.phase === 'Evaluation' && !item.complete);
      const allEvaluationsComplete = record.evaluations.every((task) => task.complete);

      if (allEvaluationsComplete && !openEvaluationActions) {
        // All evaluations done and all Evaluation AIs closed → Owner can advance.
        record.waitingOn = 'Owner';
        record.actionFlag = 'Owner';
      } else if (openEvaluationActions) {
        // Open Evaluation AIs block the MOC regardless of which evaluations are complete.
        record.waitingOn = 'Action Owner';
        record.actionFlag = 'Action Owner';
      } else {
        record.waitingOn = 'Evaluator';
        record.actionFlag = 'Evaluator';
      }
    }

    if (record.workflowState === 'Approval to Implement') {
      if (this.latestDecision(record, 'Implement', 'Approved')) {
        record.waitingOn = 'Owner';
        record.actionFlag = 'Owner';
      } else {
        record.waitingOn = 'Manager';
        record.actionFlag = 'Manager';
      }
    }

    if (record.workflowState === 'Implementation') {
      record.waitingOn = 'Owner';
      record.actionFlag = 'Owner';
    }

    if (record.workflowState === 'PSSR') {
      if (record.pssrSubmitted) {
        record.waitingOn = 'Owner';
        record.actionFlag = 'Owner';
      } else {
        const openPreStartup = record.actionItems.some(item => item.phase === 'Pre-Startup' && !item.complete);
        record.waitingOn = openPreStartup ? 'Action Owner' : 'Operations';
        record.actionFlag = openPreStartup ? 'Action Owner' : 'Operations';
      }
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

  private confirmAction(header: string, message: string, action: () => void): void {
    this.confirmationService.confirm({
      header,
      message,
      icon: 'pi pi-question-circle',
      acceptLabel: 'Confirm',
      rejectLabel: 'Cancel',
      accept: action,
    });
  }

  private finishWorkflowUpdate(record: MocRecord, note: string): void {
    this.actionLoading = true;
    setTimeout(() => {
      record.lastUpdatedDate = new Date().toISOString();
      this.recalculateRecordState(record);
      this.addHistory(record, record.workflowState, note);
      this.selectedMoc = record;
      this.saveRecords();
      this.actionLoading = false;
      this.messageService.add({ severity: 'success', summary: record.workflowState, detail: note, life: 4000 });
    }, 1200);
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
      // If open Evaluation AIs exist, those assignees are who we're waiting on.
      const openActionAssignees = record.actionItems
        .filter((item) => item.phase === 'Evaluation' && !item.complete)
        .map((item) => item.assigneeId);
      if (openActionAssignees.length) return [...new Set(openActionAssignees)];
      // Otherwise we're waiting on evaluators who haven't finished yet.
      const openEvaluators = record.evaluations.filter((task) => !task.complete).map((task) => task.evaluatorId);
      return openEvaluators.length ? [...new Set(openEvaluators)] : [record.ownerId];
    }
    if (record.workflowState === 'Approval to Implement') {
      return this.latestDecision(record, 'Implement', 'Approved') ? [record.ownerId] : [record.managerId];
    }
    if (record.workflowState === 'Implementation') return [record.ownerId];
    if (record.workflowState === 'PSSR') return record.pssrSubmitted ? [record.ownerId] : ['ops1'];
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

  workflowStepIndex(record: MocRecord): number {
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
      if (saved?.length) return saved.map((record) => this.normalizeRecord(record));
    } catch {
      // Use seeded data if localStorage is unavailable or malformed.
    }
    const seeded = this.seedRecords();
    const normalized = seeded.map((record) => this.normalizeRecord(record));
    localStorage.setItem(this.storageKey, JSON.stringify(normalized));
    return normalized;
  }

  private saveRecords(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.records.map((record) => this.normalizeRecord(record))));
  }

  private normalizeRecord(record: MocRecord): MocRecord {
    // Defensive defaults so older localStorage payloads (or partial dummy records)
    // can't break detail rendering.
    const now = new Date().toISOString();
    const next = record as unknown as Record<string, unknown>;

    if (!Array.isArray(next['disciplines'])) next['disciplines'] = [];
    if (!Array.isArray(next['evaluatorIds'])) next['evaluatorIds'] = [];
    if (!Array.isArray(next['evaluations'])) next['evaluations'] = [];
    if (!Array.isArray(next['pssrChecklist'])) next['pssrChecklist'] = this.makePssrChecklist(false);
    if (!Array.isArray(next['actionItems'])) next['actionItems'] = [];
    if (!Array.isArray(next['approvalHistory'])) next['approvalHistory'] = [];
    if (!Array.isArray(next['workflowHistory'])) next['workflowHistory'] = [];

    if (typeof next['status'] !== 'string') next['status'] = 'Open';
    if (typeof next['waitingOn'] !== 'string') next['waitingOn'] = '-';
    if (typeof next['actionFlag'] !== 'string') next['actionFlag'] = '';
    if (typeof next['createdDate'] !== 'string') next['createdDate'] = now;
    if (typeof next['lastUpdatedDate'] !== 'string') next['lastUpdatedDate'] = String(next['createdDate'] ?? now);
    if (typeof next['supportingDocumentName'] !== 'string') next['supportingDocumentName'] = '';
    if (typeof next['title'] !== 'string') next['title'] = '';
    if (typeof next['description'] !== 'string') next['description'] = '';
    if (typeof next['basis'] !== 'string') next['basis'] = '';
    if (typeof next['implementationDate'] !== 'string') next['implementationDate'] = this.minDate;

    return next as unknown as MocRecord;
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
      const raw = JSON.parse(localStorage.getItem(this.profileKey) ?? 'null') as Record<string, Partial<UserProfile>> | null;
      if (raw) {
        const merged: Record<string, UserProfile> = { ...defaults };
        for (const user of this.users) {
          if (raw[user.id]) {
            const next = { ...defaults[user.id], ...raw[user.id] };
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

  private loadReadNotifKeys(): Set<string> {
    try {
      const raw = JSON.parse(localStorage.getItem(this.notifReadKey) ?? 'null') as string[] | null;
      if (Array.isArray(raw)) return new Set<string>(raw);
    } catch { /* ignore */ }
    return new Set<string>();
  }

  private saveReadNotifKeys(): void {
    localStorage.setItem(this.notifReadKey, JSON.stringify([...this.readNotifKeys]));
  }

  private saveUserPasswords(): void {
    localStorage.setItem(this.passwordKey, JSON.stringify(this.userPasswords));
  }

  private openDocumentPreview(title: string, fileName: string, dataUrl: string, mimeType?: string): void {
    this.previewDocument = { title, fileName, dataUrl, mimeType };
    const type = this.previewType();
    if (type === 'pdf') {
      // Convert data URL to blob URL — browsers block data: URLs in iframes for PDFs
      try {
        const byteStr = atob(dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteStr.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
        const blob = new Blob([ab], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        this.previewResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
      } catch {
        this.previewResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
      }
    } else {
      this.previewResourceUrl = null;
    }
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
    const d = (offsetDays: number) => {
      const dt = new Date(); dt.setDate(dt.getDate() + offsetDays);
      return dt.toISOString().slice(0, 10);
    };
    return [
      // 1 — Evaluation stage (Mechanical)
      {
        id: 'MOC-2026-001',
        title: 'Replace Relief Valve RV-1042 — Crude Unit Overhead Accumulator',
        description: 'Relief valve RV-1042 on the crude unit overhead accumulator has failed its last two bench tests. Engineering recommends replacement with a higher-rated valve (150 psig → 175 psig set pressure) to match the revised P&ID.',
        basis: 'Valve failed biennial bench test. Revised hydraulic study requires higher set pressure per Engineering Change Note ECN-4471.',
        disciplines: ['Mechanical'],
        supportingDocumentName: 'RV-1042_Engineering_Basis.pdf',
        implementationDate: d(45),
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
        workflowHistory: [this.seedHistory(now, 'Initiated', 'owner1', ['mech1'], 'MOC initiated. Routed to Mike (Mechanical) for evaluation.')],
        actionFlag: 'Evaluator',
        createdDate: now,
        lastUpdatedDate: now,
      },
      // 2 — Approval to Implement (Mechanical + Process)
      {
        id: 'MOC-2026-002',
        title: 'Update Bolting Spec for High-Temperature Flange Joints — P-201 Process Train',
        description: 'Current bolting specification (B7/2H) is insufficient for sustained operating temperatures above 450°F on the P-201 train. Engineering proposes upgrading to B16/4 studs and heavy hex nuts throughout the high-temperature section.',
        basis: 'API 660 compliance review identified non-conforming bolting on 14 flange connections. Corrective action required before next turnaround.',
        disciplines: ['Mechanical', 'Process'],
        supportingDocumentName: 'Bolting_Spec_MOC_P201.pdf',
        implementationDate: d(60),
        ownerId: 'owner1',
        evaluatorIds: ['mech1', 'process1'],
        managerId: 'manager1',
        evaluations: [this.seedEvaluation('Mechanical', 'mech1', true), this.seedEvaluation('Process', 'process1', true)],
        pssrChecklist: this.makePssrChecklist(false),
        actionItems: [],
        approvalHistory: [{ id: 'AP-002-1', gate: 'Implement', decision: 'Submitted', byUserId: 'owner1', at: now }],
        workflowState: 'Approval to Implement',
        status: 'Open',
        waitingOn: 'Manager',
        workflowHistory: [
          this.seedHistory(now, 'Initiated', 'owner1', ['mech1', 'process1'], 'MOC initiated. Routed to Mike and Priya for evaluation.'),
          this.seedHistory(now, 'Approval to Implement', 'owner1', ['manager1'], 'All evaluations complete. Submitted to Morgan for approval.'),
        ],
        actionFlag: 'Manager',
        createdDate: now,
        lastUpdatedDate: now,
      },
      // 3 — Implementation (Mechanical + Electrical)
      {
        id: 'MOC-2026-003',
        title: 'Relocate Firewater Header FW-3B — Process Area 3 Capacity Expansion',
        description: 'The existing FW-3B firewater main conflicts with the footprint of the new heat exchanger foundation (E-501 A/B). The header must be relocated 12 feet north per updated plot plan drawing 3B-P-0042 Rev 4.',
        basis: 'Structural conflict identified during E-501 A/B foundation layout. Relocation is required to maintain firewater coverage and clear the construction corridor.',
        disciplines: ['Mechanical'],
        supportingDocumentName: 'FW-3B_Relocation_Isometric.pdf',
        implementationDate: d(20),
        ownerId: 'owner2',
        evaluatorIds: ['mech1'],
        managerId: 'manager1',
        evaluations: [this.seedEvaluation('Mechanical', 'mech1', true)],
        pssrChecklist: this.makePssrChecklist(false),
        actionItems: [],
        approvalHistory: [
          { id: 'AP-003-1', gate: 'Implement', decision: 'Submitted', byUserId: 'owner2', at: now },
          { id: 'AP-003-2', gate: 'Implement', decision: 'Approved', byUserId: 'manager1', at: now },
        ],
        workflowState: 'Implementation',
        status: 'Open',
        waitingOn: 'Owner',
        workflowHistory: [
          this.seedHistory(now, 'Initiated', 'owner2', ['mech1'], 'MOC initiated. Routed to Mike for mechanical evaluation.'),
          this.seedHistory(now, 'Approval to Implement', 'owner2', ['manager1'], 'Evaluation complete. Submitted for approval.'),
          this.seedHistory(now, 'Implementation', 'manager1', ['owner2'], 'Approved to implement. Routed to Owen for construction oversight.'),
        ],
        actionFlag: 'Owner',
        createdDate: now,
        lastUpdatedDate: now,
      },
      // 4 — PSSR stage
      {
        id: 'MOC-2026-004',
        title: 'Install Temporary Bypass — Shell-and-Tube Heat Exchanger E-402',
        description: 'A temporary spool bypass is required around E-402 to maintain process flow during planned tube bundle replacement. Bypass will be in service for a maximum of 30 days.',
        basis: 'Tube bundle inspection identified 23% tube failures exceeding the 15% plugging limit. Replacement requires bypassing the exchanger while maintaining unit throughput.',
        disciplines: ['Mechanical', 'Process'],
        supportingDocumentName: 'E402_Bypass_Engineering_Package.pdf',
        implementationDate: d(10),
        ownerId: 'owner1',
        evaluatorIds: ['mech1', 'process1'],
        managerId: 'manager1',
        evaluations: [this.seedEvaluation('Mechanical', 'mech1', true), this.seedEvaluation('Process', 'process1', true)],
        pssrChecklist: this.makePssrChecklist(false),
        actionItems: [
          {
            id: 'AI-004-1',
            phase: 'Pre-Startup',
            description: 'Verify temporary bypass spool hydro-test certificate is on file and signed by inspection.',
            assigneeId: 'mech1',
            createdBy: 'owner1',
            dueDate: d(8),
            complete: true,
            completedAt: now,
            reviewedByEvaluator: true,
          },
        ],
        approvalHistory: [
          { id: 'AP-004-1', gate: 'Implement', decision: 'Submitted', byUserId: 'owner1', at: now },
          { id: 'AP-004-2', gate: 'Implement', decision: 'Approved', byUserId: 'manager1', at: now },
        ],
        workflowState: 'PSSR',
        status: 'Open',
        waitingOn: 'Operations',
        workflowHistory: [
          this.seedHistory(now, 'Initiated', 'owner1', ['mech1', 'process1'], 'MOC initiated. Sent for discipline evaluation.'),
          this.seedHistory(now, 'Implementation', 'manager1', ['owner1'], 'Approved. Implementation in progress.'),
          this.seedHistory(now, 'PSSR', 'owner1', ['ops1'], 'Implementation complete. Routed to Oscar for PSSR.'),
        ],
        actionFlag: 'Operations',
        createdDate: now,
        lastUpdatedDate: now,
      },
      // 5 — Approval for Start Up
      {
        id: 'MOC-2026-005',
        title: 'Modify High-Pressure Shutdown Setpoint — Compressor K-101',
        description: 'The high-pressure shutdown (HIPPS) setpoint on K-101 is to be revised from 285 psig to 310 psig to align with the updated compressor performance curve following impeller trim. SIL-2 functionality must be maintained.',
        basis: 'Rotating Equipment Engineering study (REE-2026-017) confirms impeller trim requires revised HIPPS setpoint. Current setpoint causes spurious trips under normal operating envelope.',
        disciplines: ['Mechanical', 'Process'],
        supportingDocumentName: 'K101_HIPPS_Setpoint_Study_REE-2026-017.pdf',
        implementationDate: d(5),
        ownerId: 'owner2',
        evaluatorIds: ['mech1', 'process1'],
        managerId: 'manager1',
        evaluations: [this.seedEvaluation('Mechanical', 'mech1', true), this.seedEvaluation('Process', 'process1', true)],
        pssrChecklist: this.makePssrChecklist(true),
        actionItems: [],
        approvalHistory: [
          { id: 'AP-005-1', gate: 'Implement', decision: 'Submitted', byUserId: 'owner2', at: now },
          { id: 'AP-005-2', gate: 'Implement', decision: 'Approved', byUserId: 'manager1', at: now },
          { id: 'AP-005-3', gate: 'Start Up', decision: 'Submitted', byUserId: 'owner2', at: now },
        ],
        workflowState: 'Approval for Start Up',
        status: 'Open',
        waitingOn: 'Manager',
        workflowHistory: [
          this.seedHistory(now, 'Initiated', 'owner2', ['mech1', 'process1'], 'MOC initiated and sent for evaluation.'),
          this.seedHistory(now, 'Implementation', 'manager1', ['owner2'], 'Approved. Implementation underway.'),
          this.seedHistory(now, 'PSSR', 'owner2', ['ops1'], 'PSSR checklist complete. Startup approval requested.'),
          this.seedHistory(now, 'Approval for Start Up', 'owner2', ['manager1'], 'Submitted for startup approval.'),
        ],
        actionFlag: 'Manager',
        createdDate: now,
        lastUpdatedDate: now,
      },
      // 6 — Ready for Closure (with open post-startup action item)
      {
        id: 'MOC-2026-006',
        title: 'Commission Coriolis Flowmeter on Crude Feed Line — FT-2201',
        description: 'Install and commission a new Micro Motion Coriolis flowmeter (FT-2201) on the crude feed line to replace the aging orifice plate assembly. Calibration, loop checks, and DCS integration are included in scope.',
        basis: 'Existing orifice plate has a ±3.2% accuracy limitation impacting custody transfer measurement. Coriolis technology achieves ±0.1% accuracy required for fiscal metering per Measurement Standard MS-1104.',
        disciplines: ['Mechanical', 'Instrumentation'],
        supportingDocumentName: 'FT2201_Commissioning_Package.pdf',
        implementationDate: d(-5),
        ownerId: 'owner1',
        evaluatorIds: ['mech1', 'ops1'],
        managerId: 'manager1',
        evaluations: [this.seedEvaluation('Mechanical', 'mech1', true), this.seedEvaluation('Operations', 'ops1', true)],
        pssrChecklist: this.makePssrChecklist(true),
        actionItems: [
          {
            id: 'AI-006-1',
            phase: 'Post-Startup',
            description: 'Submit calibration certificate for FT-2201 to the Measurement & Compliance team (MS-1104 requirement) within 30 days of commissioning.',
            assigneeId: 'env1',
            createdBy: 'owner1',
            dueDate: d(20),
            complete: false,
            completedAt: undefined,
            reviewedByEvaluator: true,
          },
        ],
        approvalHistory: [
          { id: 'AP-006-1', gate: 'Implement', decision: 'Submitted', byUserId: 'owner1', at: now },
          { id: 'AP-006-2', gate: 'Implement', decision: 'Approved', byUserId: 'manager1', at: now },
          { id: 'AP-006-3', gate: 'Start Up', decision: 'Submitted', byUserId: 'owner1', at: now },
          { id: 'AP-006-4', gate: 'Start Up', decision: 'Approved', byUserId: 'manager1', at: now },
        ],
        workflowState: 'Ready for Closure',
        status: 'Open',
        waitingOn: 'Owner',
        workflowHistory: [
          this.seedHistory(now, 'Initiated', 'owner1', ['mech1', 'ops1'], 'MOC initiated. Sent for mechanical and operations evaluation.'),
          this.seedHistory(now, 'Approval for Start Up', 'manager1', ['owner1'], 'Startup approved. Ready for closure when post-startup action complete.'),
        ],
        actionFlag: 'Owner',
        createdDate: now,
        lastUpdatedDate: now,
      },
      // 7 — Closed
      {
        id: 'MOC-2026-007',
        title: 'Revise Emergency Shutdown Procedure SOP-CDU-005 — Crude Distillation Unit',
        description: 'Procedure SOP-CDU-005 revised to reflect new ESD valve sequencing following installation of automated SDV-112. Updated procedure includes revised valve lineup, new pressure hold verification step, and updated LOTO attachment.',
        basis: 'SDV-112 installation (MOC-2025-088) changed the ESD sequence. Operating the unit under the old procedure creates a risk of uncontrolled depressurization during emergency shutdown.',
        disciplines: ['HSE', 'Process'],
        supportingDocumentName: 'SOP-CDU-005_Rev4_Final.pdf',
        implementationDate: d(-30),
        ownerId: 'owner2',
        evaluatorIds: ['hse1', 'process1'],
        managerId: 'manager1',
        evaluations: [this.seedEvaluation('HSE', 'hse1', true), this.seedEvaluation('Process', 'process1', true)],
        pssrChecklist: this.makePssrChecklist(true),
        actionItems: [],
        approvalHistory: [
          { id: 'AP-007-1', gate: 'Implement', decision: 'Submitted', byUserId: 'owner2', at: now },
          { id: 'AP-007-2', gate: 'Implement', decision: 'Approved', byUserId: 'manager1', at: now },
          { id: 'AP-007-3', gate: 'Start Up', decision: 'Submitted', byUserId: 'owner2', at: now },
          { id: 'AP-007-4', gate: 'Start Up', decision: 'Approved', byUserId: 'manager1', at: now },
        ],
        closureDate: now,
        closedByUserId: 'owner2',
        workflowState: 'Closed',
        status: 'Closed',
        waitingOn: '-',
        workflowHistory: [
          this.seedHistory(now, 'Initiated', 'owner2', ['hse1', 'process1'], 'MOC initiated. HSE and Process evaluations requested.'),
          this.seedHistory(now, 'Approval to Implement', 'owner2', ['manager1'], 'All evaluations complete. Submitted for approval.'),
          this.seedHistory(now, 'Closed', 'owner2', [], 'All post-startup actions closed. MOC closed out.'),
        ],
        actionFlag: 'Complete',
        createdDate: now,
        lastUpdatedDate: now,
      },
      // 8 — Evaluation with Environmental action item
      {
        id: 'MOC-2026-008',
        title: 'Reroute Process Vent Line from Vessel V-305 to Flare Header',
        description: 'The existing atmospheric vent on pressure vessel V-305 vents directly to atmosphere within 50 meters of the site fence. Rerouting to the flare header is required to meet updated air quality permit conditions issued by TCEQ.',
        basis: 'TCEQ Air Permit Amendment (Permit No. O-1234) requires elimination of direct atmospheric vents within Tier 2 fence-line monitoring boundary. Compliance deadline is 90 days from permit issue date.',
        disciplines: ['Environmental', 'Process'],
        supportingDocumentName: 'V305_Vent_Reroute_Permit_Basis.pdf',
        implementationDate: d(75),
        ownerId: 'owner2',
        evaluatorIds: ['env1', 'process1'],
        managerId: 'manager1',
        evaluations: [this.seedEvaluation('Environmental', 'env1', false), this.seedEvaluation('Process', 'process1', false)],
        pssrChecklist: this.makePssrChecklist(false),
        actionItems: [
          {
            id: 'AI-008-1',
            phase: 'Evaluation',
            description: 'Obtain written confirmation from TCEQ that the proposed reroute configuration satisfies the permit amendment requirements before evaluation can be closed.',
            assigneeId: 'env1',
            createdBy: 'env1',
            dueDate: d(14),
            complete: false,
            completedAt: undefined,
            reviewedByEvaluator: false,
          },
        ],
        approvalHistory: [],
        workflowState: 'Evaluation',
        status: 'Open',
        waitingOn: 'Evaluator',
        workflowHistory: [this.seedHistory(now, 'Initiated', 'owner2', ['env1', 'process1'], 'MOC initiated. Environmental and Process evaluations requested per permit compliance timeline.')],
        actionFlag: 'Evaluator',
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
