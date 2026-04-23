import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseUrl = 'http://127.0.0.1:4300/';
const screenshotDir = 'ui-screenshots';
const storageKey = 'mocAngularRbacPrototype.v6';
const sessionKey = 'mocAngularRbacSession.v1';
const checklistKey = 'mocAngularChecklistTemplates.v1';

let messageId = 0;

async function main() {
  await rm(screenshotDir, { recursive: true, force: true });
  await mkdir(screenshotDir, { recursive: true });

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,1200',
    '--user-data-dir=C:\\Users\\SairamGontena\\moc-angular-prototype\\.chrome-screenshots',
    'about:blank',
  ]);

  try {
    const wsUrl = await waitForWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });

    const cdp = makeCdp(ws);
    await cdp('Page.enable');
    await cdp('Runtime.enable');

    await navigate(cdp, baseUrl);
    await screenshot(cdp, '01-login.png');

    await setState(cdp, 'owner1', seedRecords());
    await navigate(cdp, baseUrl);
    await screenshot(cdp, '02-owner-dashboard.png');
    await clickByText(cdp, 'button', 'Create New MOC');
    await delay(500);
    await screenshot(cdp, '03-create-moc.png');

    await setState(cdp, 'mech1', seedRecords());
    await navigate(cdp, baseUrl);
    await clickFirstRow(cdp);
    await delay(500);
    await screenshot(cdp, '04-mechanical-evaluator-detail.png');
    await clickByText(cdp, 'label', 'Action item required');
    await delay(300);
    await screenshot(cdp, '05-evaluator-action-required.png');

    await setState(cdp, 'owner1', ownerActionRecords());
    await navigate(cdp, baseUrl);
    await clickFirstRow(cdp);
    await delay(500);
    await screenshot(cdp, '06-owner-action-closure.png');

    await setState(cdp, 'ops1', pssrRecords());
    await navigate(cdp, baseUrl);
    await clickFirstRow(cdp);
    await delay(500);
    await screenshot(cdp, '07-pssr-operations.png');

    await setState(cdp, 'admin1', seedRecords());
    await navigate(cdp, baseUrl);
    await clickByText(cdp, 'button', 'Checklist Admin');
    await delay(500);
    await screenshot(cdp, '08-admin-checklists.png');

    ws.close();
  } finally {
    chrome.kill();
  }
}

function makeCdp(ws) {
  const pending = new Map();
  ws.addEventListener('message', (event) => {
    const payload = JSON.parse(event.data);
    if (payload.id && pending.has(payload.id)) {
      const { resolve, reject } = pending.get(payload.id);
      pending.delete(payload.id);
      if (payload.error) reject(new Error(payload.error.message));
      else resolve(payload.result);
    }
  });

  return (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++messageId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
}

async function waitForWebSocketUrl() {
  for (let index = 0; index < 50; index += 1) {
    try {
      const response = await fetch('http://127.0.0.1:9223/json/list');
      const pages = await response.json();
      const page = pages.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      await delay(200);
    }
  }
  throw new Error('Chrome remote debugging endpoint did not start.');
}

async function navigate(cdp, url) {
  await cdp('Page.navigate', { url });
  await delay(1200);
}

async function screenshot(cdp, filename) {
  const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
  await writeFile(`${screenshotDir}/${filename}`, Buffer.from(result.data, 'base64'));
}

async function evaluate(cdp, expression) {
  return cdp('Runtime.evaluate', { expression, awaitPromise: true });
}

async function setState(cdp, userId, records) {
  await evaluate(
    cdp,
    `
      localStorage.setItem(${JSON.stringify(sessionKey)}, ${JSON.stringify(userId)});
      localStorage.setItem(${JSON.stringify(checklistKey)}, JSON.stringify(${JSON.stringify(defaultTemplates())}));
      localStorage.setItem(${JSON.stringify(storageKey)}, JSON.stringify(${JSON.stringify(records)}));
    `,
  );
}

async function clickByText(cdp, selector, text) {
  await evaluate(
    cdp,
    `
      [...document.querySelectorAll(${JSON.stringify(selector)})]
        .find((node) => node.textContent.includes(${JSON.stringify(text)}))
        ?.click();
    `,
  );
}

async function clickFirstRow(cdp) {
  await evaluate(cdp, "document.querySelector('tbody tr')?.click();");
}

function now() {
  return new Date().toISOString();
}

function checklist(prefix, items, complete = false) {
  return items.map((text, index) => ({ id: `${prefix}-${index + 1}`, text, required: true, complete }));
}

function history(step, byUserId, assignedToUserIds, note) {
  return { id: `H-${step}-${Date.now()}`, at: now(), step, byUserId, assignedToUserIds, note };
}

function evaluation(discipline, evaluatorId, complete = false, actionRequired = false) {
  return {
    id: `EV-${discipline}`,
    discipline,
    evaluatorId,
    complete,
    actionRequired,
    checklist: checklist(discipline, defaultTemplates().evaluation[discipline], complete),
  };
}

function pssrChecklist(complete = false) {
  return checklist('PSSR', defaultTemplates().pssr, complete);
}

function defaultTemplates() {
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

function seedRecords() {
  const timestamp = now();
  return [
    {
      id: 'MOC000123',
      title: 'Replace gasket on Pump P-101',
      description: 'Replace gasket due to minor leak',
      basis: 'Maintenance reliability',
      disciplines: ['Mechanical'],
      supportingDocumentName: 'gasket_spec.pdf',
      implementationDate: '2026-06-30',
      ownerId: 'owner1',
      evaluatorIds: ['mech1'],
      managerId: 'manager1',
      evaluations: [evaluation('Mechanical', 'mech1')],
      pssrChecklist: pssrChecklist(),
      actionItems: [],
      workflowState: 'Evaluation',
      status: 'Open',
      waitingOn: 'Evaluator',
      workflowHistory: [history('Initiated', 'owner1', ['mech1'], 'MOC initiated and routed to Mechanical evaluation.')],
      actionFlag: '',
      createdDate: timestamp,
      lastUpdatedDate: timestamp,
    },
  ];
}

function ownerActionRecords() {
  const records = seedRecords();
  records[0].evaluations[0].complete = true;
  records[0].evaluations[0].actionRequired = true;
  records[0].waitingOn = 'Action Owner';
  records[0].actionFlag = 'Action Owner';
  records[0].actionItems = [
    {
      id: 'AI-DEMO-1',
      phase: 'Evaluation',
      description: 'Confirm gasket replacement evidence is attached',
      assigneeId: 'owner1',
      dueDate: '2026-06-20',
      complete: false,
      reviewedByEvaluator: false,
      createdBy: 'mech1',
    },
  ];
  records[0].workflowHistory.push(history('Evaluation', 'mech1', ['owner1'], 'Evaluation action item assigned to MOC Owner.'));
  return records;
}

function pssrRecords() {
  const records = seedRecords();
  records[0].evaluations[0] = evaluation('Mechanical', 'mech1', true, false);
  records[0].workflowState = 'PSSR';
  records[0].waitingOn = 'Operations';
  records[0].actionFlag = '';
  records[0].workflowHistory.push(history('PSSR', 'owner1', ['ops1'], 'Implementation completed. Routed to Operations for PSSR.'));
  return records;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
