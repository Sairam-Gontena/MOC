# Chevron MOC Digital Application

> **Management of Change — HSE Digital Platform**
> Angular + PrimeNG prototype. All data stored in `localStorage`. No backend required.

---

## Quick Start

```bash
npm install
npx ng build
node serve-dist.js
# Open http://127.0.0.1:4300/
```

**Demo password:** `demo123` for all users (or use Persona Login — one click).

---

## Demo Walkthrough

This guide walks through the complete MOC lifecycle from creation to closure, step by step, exactly as you would run a live demo.

---

### Step 1 — Login

The login screen has two modes. Use **Persona Login** to sign in instantly by clicking any user tile, or use **ID & Password** with `demo123`.

**Persona Login tab — click any user to sign in instantly**
![Login Persona](ui-screenshots/01-login-persona-tab.png)

**ID & Password tab — username + `demo123`**
![Login Password](ui-screenshots/02-login-password-tab.png)

#### Demo Users at a Glance

| Name | Role | Notes |
|---|---|---|
| Olivia / Owen | Owner | Create and drive MOCs through the lifecycle |
| Mike | Evaluator — Mechanical | Completes Mechanical discipline evaluation |
| Priya | Evaluator — Process | Completes Process discipline evaluation |
| Evan | Evaluator — Environmental | Completes Environmental evaluation |
| Harper | Evaluator — HSE | Completes HSE evaluation |
| Oscar | Evaluator — Operations | Completes PSSR (Pre-Startup Safety Review) |
| Morgan | Manager | Approves/rejects at two gates |
| Ada | Admin | Sees everything; configures checklists |

---

### Step 2 — Admin: The Big Picture

Sign in as **Ada (Admin)**. Admin sees every MOC in the system across all users, with a Demo Reset button to restore seed data at any time.

**Admin dashboard — all MOCs across the system**
![Admin Dashboard](ui-screenshots/03-admin-all-mocs-dashboard.png)

**MOC table — MOC ID, title, target date, workflow step, disciplines, eval progress**
![Admin MOC Table](ui-screenshots/04-admin-moc-table.png)

#### Admin: Checklist Configuration

Admin can customise the evaluation checklist items for each discipline and the PSSR checklist. Changes apply to all new MOCs going forward.

**Discipline evaluation checklists — add/remove items, mark required/active**
![Admin Checklist Config](ui-screenshots/05-admin-checklist-config-top.png)

**PSSR checklist — configured separately from evaluation checklists**
![Admin PSSR Checklist](ui-screenshots/06-admin-checklist-config-pssr.png)

---

### Step 3 — Owner: Create a New MOC

Sign in as **Olivia (Owner)**. The dashboard shows only her MOCs with KPI tiles.

**Owner dashboard — My MOCs with KPI summary cards**
![Owner Dashboard](ui-screenshots/07-owner-dashboard.png)

Click **+ New MOC** to open the initiation form.

**Create MOC modal — blank form**
![Create MOC Empty](ui-screenshots/08-owner-create-moc-modal-empty.png)

Fill in all required fields:
- **Title** — short, descriptive name for the change
- **Description** — what the change is
- **Basis / Justification** — why the change is needed (HAZOP finding, regulatory requirement, etc.)
- **Disciplines Involved** — select all disciplines that must evaluate this change
- **Supporting Document** — upload the engineering basis or HAZOP report
- **Target Implementation Date** — when the change must be in place

**Create MOC modal — filled out and ready to submit**
![Create MOC Filled](ui-screenshots/09-owner-create-moc-modal-filled.png)

Clicking **Submit MOC** creates the record and immediately routes it to the **Evaluation** step.

---

### Step 4 — MOC Detail View

Click any MOC row to open the detail view. This is the single source of truth for the entire MOC lifecycle.

**Workflow Map — 8-step visual progress indicator at the top**
![MOC Detail Workflow Map](ui-screenshots/10-moc-detail-workflow-map.png)

> The workflow map shows: Initiated → Evaluation → Approval to Implement → Implementation → PSSR → Approval for Start Up → Ready for Closure → Closed. The current step is highlighted. Completed steps are checked.

**MOC Details — all initiation fields, current assigned-to, supporting document link**
![MOC Detail Info](ui-screenshots/11-moc-detail-moc-info.png)

**Evaluation Progress — per-discipline checklist status and action item count**
![MOC Evaluation Progress](ui-screenshots/12-moc-detail-evaluation-progress.png)

> The Owner can see who is evaluating, how many checklist items are complete, whether action items were raised, and the current status for each discipline.

**Action Items + Approval History**
![Action Items and Approvals](ui-screenshots/13-moc-detail-action-items-approval.png)

> Action Items tracks all evaluation, pre-startup, and post-startup items with priority (Critical / High / Normal), due date, overdue indicators, and completion status. Approval History records every Manager decision with timestamp and comment.

---

### Step 5 — Evaluator: Complete the Evaluation

Sign in as **Mike (Evaluator — Mechanical)**. Go to **Assigned Tasks** in the sidebar.

**Evaluator Assigned Tasks — all MOCs assigned to Mike across all workflow stages**
![Evaluator Assigned Tasks](ui-screenshots/14-evaluator-assigned-tasks.png)

> The Assigned Tasks view shows:
> - **Assigned MOCs** — every MOC where Mike is the evaluator, with his role and current workflow step
> - **Action Items** — all action items personally assigned to Mike across all MOCs, with priority and due date

Click any MOC to open the detail view from the evaluator's perspective.

**Evaluator MOC Detail — same workflow map and MOC info as the Owner sees**
![Evaluator MOC Detail Top](ui-screenshots/15-evaluator-moc-detail-top.png)

Scroll down to the Mechanical Evaluation section.

**Evaluation section — discipline checklist + action item form**
![Evaluator Checklist](ui-screenshots/16-evaluator-moc-detail-eval-section.png)

**Checklist items, action item creation form (with priority), and Mark Evaluation Complete**
![Evaluator Checklist and Action Form](ui-screenshots/17-evaluator-checklist-and-action-form.png)

> **To complete an evaluation:**
> 1. Check all required checklist items
> 2. Raise any action items needed (assign to person, set priority and due date)
> 3. Close any action items assigned to yourself with a closure comment
> 4. Click **Mark Evaluation Complete**
>
> Once all assigned disciplines complete their evaluations, the Owner can submit for Manager approval.

#### Action Item Types

Each action item has a **Phase** that controls when it must be closed:

| Phase | Who Can Raise It | Must Be Closed Before |
|---|---|---|
| **Evaluation** | Any Evaluator during Evaluation stage | Owner submits for Approval to Implement |
| **Pre-Startup** | Evaluators during Evaluation; Operations during PSSR | Owner submits PSSR for Review |
| **Post-Startup** | Evaluators during Evaluation; Operations during PSSR | Owner closes the MOC |

> The phase dropdown in the action item form automatically limits available options based on the current workflow stage.

#### Further Action Items (Delegation)

If an action item is assigned to you and you need to raise a parallel item for another person, you can **Raise a Further AI**:

1. Click **Raise Further AI** on any open action item assigned to you
2. Choose the AI type (Evaluation / Pre-Startup / Post-Startup), assignee, priority, due date, and description
3. Add a comment explaining why you are raising the further item
4. Click **Raise Further AI** — the new linked AI is created and assigned

> **Important:** The original action item is **not** automatically closed. You must close it yourself, the normal way (add a closure comment and click Complete). The further AI indicator ("Further AI Raised — close this item yourself") reminds you to do so. Both the original and the further AI must be closed before the stage can advance.

---

### Step 6 — Owner: Submit for Approval to Implement

Once all evaluations are complete, the Owner sees the **Submit for Approval to Implement** button in the Workflow Actions panel at the bottom of the MOC detail.

**MOC with all evaluations complete — evaluation progress shows 2/2**
![Owner Approval to Implement State](ui-screenshots/18-owner-moc-approval-to-implement-state.png)

**Workflow Actions panel — Submit for Approval to Implement button clearly visible**
![Owner Submit for Approval](ui-screenshots/19-owner-submit-for-approval-btn.png)

> The Workflow Actions panel is sticky at the bottom of the detail page. Click the amber header bar to collapse it while reading the MOC, and click again to expand it when ready to act.

---

### Step 7 — Manager: Approve or Reject

Sign in as **Morgan (Manager)**. The dashboard shows Morgan's own MOCs.

**Manager dashboard — My MOCs (MOCs Morgan created)**
![Manager Dashboard](ui-screenshots/20-manager-dashboard.png)

Click **Assigned Tasks** in the sidebar to see the approval queue.

**Manager Assigned Tasks — MOCs at approval stages with YOUR STATUS column**
![Manager Assigned Tasks](ui-screenshots/21-manager-assigned-tasks-approval-queue.png)

> Managers only see "Action Required" for MOCs awaiting their decision. After approving, the MOC continues to appear in their Assigned Tasks with the approval decision recorded (e.g., "Approved (Implement)"), so they can track the full lifecycle of every MOC they touched.

Click any MOC to review the full detail before making a decision.

**Manager MOC Detail — full view of evaluation outcomes, action items, and approval history**
![Manager MOC Detail](ui-screenshots/22-manager-moc-detail-full.png)

Scroll to the bottom and expand the Workflow Actions panel.

**Manager Workflow Actions — Approve to Implement and Reject (Return to Owner)**
![Manager Workflow Actions](ui-screenshots/23-manager-workflow-actions-approve-reject.png)

> **If Approved:** MOC moves to Implementation. Owner is notified.
>
> **If Rejected:** Manager must enter a reason. The MOC goes to **Rejected** state and routes back to the Owner. The Owner must revise the initiation fields and resubmit — all evaluations are reset and must be completed again. The rejection reason and every field change are permanently recorded in Revision History.

---

### Step 7a — Rejection Flow: Owner Revises and Resubmits

When a Manager rejects a MOC, the workflow map shows the MOC back at the **Initiated** step with a **Rejected** status badge. The Owner receives a notification and must take action.

In the MOC detail:
1. A red **Rejection Reason** box appears showing the Manager's name, date, and rejection comment
2. The Owner clicks **Revise MOC Details** to open an edit form
3. The Owner updates any of the initiation fields (title, description, basis, disciplines, target date, document)
4. The Owner clicks **Submit Revised MOC** — the MOC returns to **Evaluation** with all disciplines reset

**Revision History** is permanently visible on the MOC, showing:
- Which revision this is (Revision 1, 2, etc.)
- Who rejected it and why
- A field-by-field diff of every change the Owner made (old value → new value)

> All previous revision history is preserved. If a MOC is rejected and revised multiple times, the complete rework audit trail is visible to all participants.

---

### Step 8 — Owner: Implementation

After Manager approval, the Owner drives the implementation phase.

**MOC in Implementation — Approval History shows Manager approved**
![Owner Implementation](ui-screenshots/24-owner-moc-in-implementation.png)

**Workflow Actions — Mark Implementation Complete button**
![Owner Implementation Actions](ui-screenshots/25-owner-implementation-workflow-actions.png)

> Click **Mark Implementation Complete** to confirm all physical/procedural changes are done and route the MOC to PSSR.

---

### Step 9 — PSSR (Pre-Startup Safety Review)

Sign in as **Oscar (Evaluator — Operations)**. Oscar is responsible for completing the PSSR.

**Operations Assigned Tasks — MOCs in PSSR state assigned to Oscar**
![Operations Assigned Tasks](ui-screenshots/26-operations-assigned-tasks.png)

Click the PSSR MOC to open it.

**PSSR MOC Detail — workflow map at PSSR step**
![PSSR MOC Detail](ui-screenshots/27-pssr-moc-detail-top.png)

**PSSR Checklist — all items must be checked before submitting PSSR for review**
![PSSR Checklist](ui-screenshots/28-pssr-checklist-section.png)

> Oscar must:
> 1. Complete the PSSR checklist (all required items)
> 2. Raise any Pre-Startup or Post-Startup action items as needed
> 3. Close any Pre-Startup action items assigned to him
> 4. Click **Submit PSSR for Review**
>
> The Owner then reviews and submits for Manager startup approval.
>
> **Note:** Operations can raise both Pre-Startup and Post-Startup action items during the PSSR stage. Pre-Startup items must be closed before PSSR submission; Post-Startup items carry forward to Ready for Closure.

---

### Step 10 — Manager: Approve Start Up

The Manager reviews the PSSR outcome and approves or rejects startup.

**Manager MOC Detail at Approval for Start Up — PSSR results visible**
![Manager Startup Approval MOC](ui-screenshots/29-manager-startup-approval-moc-detail.png)

**Workflow Actions — Approve Start Up and Reject (Send Back to PSSR)**
![Manager Startup Actions](ui-screenshots/30-manager-startup-approval-actions.png)

> **If Approved:** MOC moves to Ready for Closure / Post-Startup Review.
>
> **If Rejected:** Manager must enter a reason. PSSR checklist is reset to incomplete and the MOC returns to PSSR.

---

### Step 11 — Owner: Ready for Closure

After startup approval, the Owner manages the Post-Startup Review and closes the MOC.

**MOC at Ready for Closure — Post-Startup action items must all be completed**
![Owner Ready for Closure](ui-screenshots/31-owner-ready-for-closure-moc.png)

**Post-Startup action items — close each with a comment and evidence upload**
![Owner Closure Action Items](ui-screenshots/32-owner-closure-action-items.png)

**Workflow Actions — Close MOC button (enabled only when all post-startup items are done)**
![Owner Close MOC](ui-screenshots/33-owner-close-moc-button.png)

> Clicking **Close MOC** permanently closes the record. Status changes to **Closed**. The full audit trail — every decision, comment, checklist, and action item — is preserved and read-only.

---

### Step 12 — Notifications

The bell icon in the topbar shows unread notifications. Each workflow transition generates a contextual notification for the relevant user (e.g., "Approved to implement — begin implementation").

**Notification panel — workflow-state-specific messages, mark all read / clear read**
![Notifications](ui-screenshots/34-notifications-panel.png)

> Notification read-state persists across sessions (stored in `localStorage`). "Clear read" removes already-read notifications from the panel without deleting them from the record.

---

### Step 13 — Closed MOC: Full Audit Trail

As Admin (Ada), open any closed MOC to see the complete permanent record.

**Closed MOC detail — all sections are read-only, full history preserved**
![Closed MOC Detail](ui-screenshots/35-closed-moc-detail.png)

**Approval History — every Manager decision recorded with timestamp, person, and comment**
![Closed MOC Approval History](ui-screenshots/36-closed-moc-approval-history.png)

> The closed MOC is a complete, immutable audit record: initiation fields, all discipline evaluations and checklists, every action item with closure comments and evidence, every Manager approval/rejection with reasons, PSSR outcomes, and the final closure timestamp.

---

### Step 14 — Assigned Tasks: Your Status & Full History

The **Assigned Tasks** view shows every MOC a user has been involved in — not just active ones. This gives a complete personal history of all involvement.

**Evaluator Assigned Tasks — all past and present MOCs with Your Status column**
![Evaluator Assigned Tasks Your Status](ui-screenshots/37-evaluator-assigned-tasks-your-status.png)

**Manager Assigned Tasks — full lifecycle tracking with approval decision badges**
![Manager Assigned Tasks Your Status](ui-screenshots/38-manager-assigned-tasks-your-status.png)

> The **YOUR STATUS** column shows each person's current involvement status:
>
> | Status | Who Sees It | Meaning |
> |---|---|---|
> | **Action Required** (amber) | Manager | Awaiting your approval decision |
> | **Evaluation Pending** (blue) | Evaluator | You have not yet completed your evaluation |
> | **Evaluation Complete** (green) | Evaluator | Your evaluation is done |
> | **Approved (Implement)** (green) | Manager | You approved this MOC to implement |
> | **Approved (Start Up)** (green) | Manager | You approved startup for this MOC |
> | **Rejected** (red) | Manager | You rejected this MOC (now with Owner for revision) |
> | **Action Items Open** (blue) | Any user with AIs | You have open action items on this MOC |
> | **Action Items Complete** (green) | Any user with AIs | All your action items are closed |

---

## 8-Step Workflow Summary

```
 1. Initiated          Owner creates MOC → auto-routes to Evaluation
 2. Evaluation         Each discipline evaluator completes checklist + action items
 3. Approval to Impl.  Manager approves (→ Impl.) or rejects (→ back to Owner / Rejected state)
 4. Implementation     Owner marks implementation complete
 5. PSSR               Operations evaluator completes checklist + pre-startup items
 6. Approval for S/U   Manager approves (→ Closure) or rejects (→ back to PSSR)
 7. Ready for Closure  Owner completes all post-startup action items
 8. Closed             Owner closes — full audit trail locked
```

### Rejection Flow (additional)

```
 Rejected state:       Manager rejects → MOC status = Rejected, routed to Owner
 Owner Revision:       Owner edits initiation fields, submits revised MOC
 Back to Evaluation:   All evaluations reset, MOC re-enters Evaluation with Revision History logged
```

---

## Role & Visibility Rules

| What they see | Owner | Evaluator | Manager | Admin |
|---|:---:|:---:|:---:|:---:|
| My MOCs dashboard | Own MOCs | Own MOCs | Own MOCs | All MOCs |
| Assigned Tasks | — | MOCs where assigned as evaluator + full history | MOCs at approval gates + full history after first approval | All MOCs |
| Create MOC | ✓ | ✓ | ✓ | ✓ (with owner selector) |
| Checklist Admin | — | — | — | ✓ |
| Demo Reset | — | — | — | ✓ |

---

## Tech Stack

| | |
|---|---|
| Framework | Angular 18 — single standalone component (no routing, no services) |
| UI | PrimeNG 17 |
| State | `localStorage` — no backend, no database |
| Build | `npx ng build` → `node serve-dist.js` |

---

## Project Files

```
src/app/app.ts       All logic (~3000 lines)
src/app/app.html     All views (~1800 lines)
src/app/app.css      All styles (~2400 lines)
serve-dist.js        Static file server for the production build
ui-screenshots/      All demo screenshots (auto-generated)
take-screenshots.js  Playwright script to regenerate screenshots
```

To regenerate screenshots after UI changes:
```bash
npx ng build
node serve-dist.js &
node take-screenshots.js
```
