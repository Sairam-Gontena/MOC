/**
 * Chevron MOC Digital App — Full Demo Screenshot Script
 * Captures every step of the demo flow in order.
 * Run: node take-screenshots.js
 */
const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const BASE = 'http://127.0.0.1:4300';
const OUT  = path.join(__dirname, 'ui-screenshots');
fs.mkdirSync(OUT, { recursive: true });

let stepNum = 0;
async function ss(page, slug, scrollY = 0) {
  if (scrollY) {
    await page.evaluate(y => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(700);
  stepNum++;
  const num  = String(stepNum).padStart(2, '0');
  const file = `${num}-${slug}.png`;
  await page.screenshot({ path: path.join(OUT, file) });
  console.log(`  ✓ ${file}`);
  return file;
}

async function clearSession(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.evaluate(() => localStorage.removeItem('mocAngularRbacSession.v1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
}

async function loginAs(page, name) {
  await clearSession(page);
  await page.locator('.lp-user-tile').filter({ hasText: name }).first().click();
  await page.waitForTimeout(900);
}

async function clickSideNav(page, label) {
  const span = page.locator('.p-panelmenu-header-label')
    .filter({ hasText: new RegExp('^' + label) }).first();
  if (await span.count() > 0) {
    await span.click();
    await page.waitForTimeout(700);
  }
}

async function openMocById(page, mocId) {
  const link = page.locator(`a, td`).filter({ hasText: mocId }).first();
  if (await link.count() > 0) {
    await link.click();
    await page.waitForTimeout(900);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 1: LOGIN ──────────────────────────────────');

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await ss(page, 'login-persona-tab');

  // Switch to password tab
  await page.locator('.lp-tab').filter({ hasText: 'ID & Password' }).click();
  await page.waitForTimeout(400);
  await ss(page, 'login-password-tab');

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 2: ADMIN VIEW ─────────────────────────────');

  await loginAs(page, 'Ada');
  await ss(page, 'admin-all-mocs-dashboard');

  // Scroll to see more MOCs in table
  await ss(page, 'admin-moc-table', 300);

  // Checklist Admin
  await clickSideNav(page, 'Checklist Admin');
  await ss(page, 'admin-checklist-config-top');
  await ss(page, 'admin-checklist-config-pssr', 600);

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 3: OWNER — CREATE MOC ─────────────────────');

  await loginAs(page, 'Olivia');
  await ss(page, 'owner-dashboard');

  // Open Create modal
  await page.locator('button.btn-primary').filter({ hasText: /New MOC/i }).first().click();
  await page.waitForTimeout(600);
  await ss(page, 'owner-create-moc-modal-empty');

  // Fill the form
  await page.fill('input[name="title"]', 'Install Secondary Pressure Relief — Vessel V-301');
  await page.fill('textarea[name="description"]', 'Install a secondary pressure relief valve on vessel V-301 to comply with updated API 520 relief sizing standards following the recent HAZOP review finding.');
  await page.fill('textarea[name="basis"]', 'HAZOP Action Item HAZ-2026-014. Current single relief valve does not meet revised relief load calculations. Regulatory compliance required before next scheduled inspection.');
  // Set implementation date
  await page.fill('input[type="date"]', '2026-07-15');
  // Select disciplines — checkline labels inside .checkbox-dropdown
  const disciplineLabels = page.locator('.checkbox-dropdown .checkline');
  const count = await disciplineLabels.count();
  for (let i = 0; i < count; i++) {
    const txt = await disciplineLabels.nth(i).innerText();
    if (['Mechanical', 'Process', 'HSE'].some(d => txt.trim().startsWith(d))) {
      await disciplineLabels.nth(i).locator('input[type="checkbox"]').check();
    }
  }
  await page.waitForTimeout(400);
  await ss(page, 'owner-create-moc-modal-filled');

  // Close modal — we'll use an existing seed MOC in evaluation for the next steps
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 4: MOC DETAIL — OWNER VIEW ────────────────');

  // Open an MOC with richer data (use existing seed MOC-2026-001)
  await openMocById(page, 'MOC-2026-001');
  await ss(page, 'moc-detail-workflow-map');
  await ss(page, 'moc-detail-moc-info', 300);
  await ss(page, 'moc-detail-evaluation-progress', 650);
  await ss(page, 'moc-detail-action-items-approval', 1000);

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 5: EVALUATOR — ASSIGNED TASKS ─────────────');

  await loginAs(page, 'Mike');
  await clickSideNav(page, 'Assigned Tasks');
  await ss(page, 'evaluator-assigned-tasks');

  // Open MOC-2026-001 for evaluation
  await openMocById(page, 'MOC-2026-001');
  await ss(page, 'evaluator-moc-detail-top');
  await ss(page, 'evaluator-moc-detail-eval-section', 600);

  // Scroll to evaluation checklist
  await page.evaluate(() => {
    const el = document.querySelector('.eval-panel, .evaluation-panel, [class*="eval-task"]');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo(0, 900);
  });
  await page.waitForTimeout(400);
  await ss(page, 'evaluator-checklist-and-action-form');

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 6: MOC AT APPROVAL TO IMPLEMENT ───────────');

  // MOC-2026-009 is owned by Olivia, in Evaluation with all evals complete — Submit button visible
  await loginAs(page, 'Olivia');
  await openMocById(page, 'MOC-2026-009');
  await ss(page, 'owner-moc-approval-to-implement-state');
  // Scroll to bottom and expand workflow panel to show Submit button
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  const p1 = page.locator('.workflow-actions-panel.wap-collapsed');
  if (await p1.count() > 0) {
    await page.locator('.wap-header').first().click();
    await page.waitForTimeout(400);
  }
  await ss(page, 'owner-submit-for-approval-btn');

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 7: MANAGER — APPROVAL QUEUE ───────────────');

  await loginAs(page, 'Morgan');
  await ss(page, 'manager-dashboard');

  await clickSideNav(page, 'Assigned Tasks');
  await ss(page, 'manager-assigned-tasks-approval-queue');

  // Open MOC-2026-002 (Approval to Implement)
  await openMocById(page, 'MOC-2026-002');
  await ss(page, 'manager-moc-detail-full');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  // Expand workflow panel if collapsed
  const panel = page.locator('.workflow-actions-panel.wap-collapsed');
  if (await panel.count() > 0) {
    await page.locator('.wap-header').click();
    await page.waitForTimeout(400);
  }
  await ss(page, 'manager-workflow-actions-approve-reject');

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 8: IMPLEMENTATION ──────────────────────────');

  // MOC-2026-003 is owned by Owen — login as Owen
  await loginAs(page, 'Owen');
  await openMocById(page, 'MOC-2026-003');
  await ss(page, 'owner-moc-in-implementation');
  // Scroll to bottom and expand workflow panel to show Begin/Complete Implementation buttons
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  const p2 = page.locator('.workflow-actions-panel.wap-collapsed');
  if (await p2.count() > 0) {
    await page.locator('.wap-header').first().click();
    await page.waitForTimeout(400);
  }
  // Screenshot showing the workflow buttons at bottom of page
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await ss(page, 'owner-implementation-workflow-actions');

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 9: PSSR ────────────────────────────────────');

  await loginAs(page, 'Oscar');
  await clickSideNav(page, 'Assigned Tasks');
  await ss(page, 'operations-assigned-tasks');

  // Open a MOC in PSSR state
  await openMocById(page, 'MOC-2026-004');
  await ss(page, 'pssr-moc-detail-top');
  await page.evaluate(() => {
    const el = document.querySelector('[class*="pssr"], .pssr-section');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    else window.scrollTo(0, 700);
  });
  await page.waitForTimeout(400);
  await ss(page, 'pssr-checklist-section');

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 10: APPROVAL FOR START UP ─────────────────');

  await loginAs(page, 'Morgan');
  await clickSideNav(page, 'Assigned Tasks');
  await openMocById(page, 'MOC-2026-005');
  await ss(page, 'manager-startup-approval-moc-detail');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  const p3 = page.locator('.workflow-actions-panel.wap-collapsed');
  if (await p3.count() > 0) {
    await page.locator('.wap-header').click();
    await page.waitForTimeout(400);
  }
  await ss(page, 'manager-startup-approval-actions');

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 11: READY FOR CLOSURE ──────────────────────');

  await loginAs(page, 'Olivia');
  await openMocById(page, 'MOC-2026-006');
  await ss(page, 'owner-ready-for-closure-moc');
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(400);
  await ss(page, 'owner-closure-action-items');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  const p4 = page.locator('.workflow-actions-panel.wap-collapsed');
  if (await p4.count() > 0) {
    await page.locator('.wap-header').click();
    await page.waitForTimeout(400);
  }
  await ss(page, 'owner-close-moc-button');

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 12: NOTIFICATIONS ──────────────────────────');

  await loginAs(page, 'Olivia');
  await page.locator('.topbar-notif-btn, button[aria-label*="otif"], .notif-btn').first().click().catch(async () => {
    await page.locator('button').filter({ hasText: '' }).first().click();
  });
  // Try clicking the bell icon
  try {
    await page.locator('.pi-bell').first().click({ force: true });
    await page.waitForTimeout(500);
    await ss(page, 'notifications-panel');
  } catch(e) {
    console.log('  (notification panel skipped)');
  }

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 13: CLOSED MOC AUDIT TRAIL ─────────────────');

  await loginAs(page, 'Ada');
  // Find a closed MOC if any
  const closedRow = page.locator('table tbody tr').filter({ hasText: 'Closed' }).first();
  if (await closedRow.count() > 0) {
    await closedRow.click();
    await page.waitForTimeout(900);
    await ss(page, 'closed-moc-detail');
    await ss(page, 'closed-moc-approval-history', 800);
  }

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 14: ASSIGNED TASKS — YOUR STATUS COLUMN ────');

  // Evaluator Mike — see full history including completed evaluations
  await loginAs(page, 'Mike');
  await clickSideNav(page, 'Assigned Tasks');
  await ss(page, 'evaluator-assigned-tasks-your-status');

  // Manager Morgan — see full history with status column
  await loginAs(page, 'Morgan');
  await clickSideNav(page, 'Assigned Tasks');
  await ss(page, 'manager-assigned-tasks-your-status');

  // ═══════════════════════════════════════════════════════════
  console.log('\n── SECTION 15: FURTHER ACTION ITEM ────────────────────');

  // Open MOC-2026-001 as Mike (evaluator) — he can raise Further AI on an action item
  // First we need a MOC with an action item assigned to Mike
  // Use MOC-2026-008 which has AI-008-1 assigned to Evan (env1)
  // Instead, let's use Admin Ada to see action items table
  await loginAs(page, 'Ada');
  const mocWithAI = page.locator('table tbody tr').filter({ hasText: 'Evaluation' }).first();
  if (await mocWithAI.count() > 0) {
    await mocWithAI.click();
    await page.waitForTimeout(900);
    // Scroll to action items section
    await page.evaluate(() => {
      const el = document.querySelector('.action-items-section, [class*="action-items"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      else window.scrollTo(0, 800);
    });
    await page.waitForTimeout(400);
    await ss(page, 'action-items-phase-types');
  }

  await browser.close();
  console.log(`\n✅  Done — ${stepNum} screenshots saved to ${OUT}\n`);
})();
