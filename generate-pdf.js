/**
 * Chevron MOC Digital Application — Official PDF Document Generator
 * Generates a professionally formatted PDF with Chevron branding.
 * Run: node generate-pdf.js
 * Output: Chevron_MOC_Digital_Application.pdf
 */

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

const SCREENSHOTS = path.join(__dirname, 'ui-screenshots');
const OUT_PDF     = path.join(__dirname, 'Chevron_MOC_Digital_Application.pdf');

/** Read a screenshot as a base64 data URL */
function img(filename) {
  const fullPath = path.join(SCREENSHOTS, filename);
  if (!fs.existsSync(fullPath)) return '';
  const data = fs.readFileSync(fullPath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

/** Read the Chevron logo SVG and inline it */
const chevronLogoSvg = fs.readFileSync(path.join(__dirname, 'public', 'chevron-logo.svg'), 'utf8');
const chevronLogoB64 = `data:image/svg+xml;base64,${Buffer.from(chevronLogoSvg).toString('base64')}`;

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const version = '2.0';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Chevron MOC Digital Application</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', Arial, Helvetica, sans-serif;
    font-size: 10pt;
    color: #1a1a2e;
    background: #fff;
    line-height: 1.6;
  }

  /* ── PAGE BREAKS ── */
  .page-break { page-break-after: always; break-after: always; }
  .no-break   { page-break-inside: avoid; break-inside: avoid; }

  /* ── COVER PAGE ── */
  .cover {
    height: 100vh;
    min-height: 260mm;
    display: flex;
    flex-direction: column;
    background: linear-gradient(160deg, #0a2d5e 0%, #1463a5 60%, #0099cc 100%);
    color: #fff;
    padding: 0;
    position: relative;
    overflow: hidden;
  }
  .cover-top-bar {
    background: rgba(255,255,255,0.08);
    padding: 18px 40px;
    display: flex;
    align-items: center;
    gap: 20px;
    border-bottom: 2px solid rgba(255,255,255,0.2);
  }
  .cover-logo {
    width: 64px;
    height: 60px;
    background: #fff;
    border-radius: 8px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cover-logo img { width: 56px; height: 52px; object-fit: contain; }
  .cover-company {
    font-size: 13pt;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #fff;
    opacity: .9;
  }
  .cover-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 56px;
  }
  .cover-classification {
    display: inline-block;
    background: #c70039;
    color: #fff;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 3px;
    margin-bottom: 28px;
    width: fit-content;
  }
  .cover-title {
    font-size: 30pt;
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 10px;
    text-shadow: 0 2px 12px rgba(0,0,0,0.3);
  }
  .cover-subtitle {
    font-size: 14pt;
    font-weight: 400;
    opacity: .85;
    margin-bottom: 40px;
  }
  .cover-divider {
    width: 64px;
    height: 3px;
    background: #c70039;
    margin-bottom: 36px;
    border-radius: 2px;
  }
  .cover-meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    max-width: 520px;
  }
  .cover-meta-item label {
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    opacity: .65;
    display: block;
    margin-bottom: 4px;
  }
  .cover-meta-item span {
    font-size: 10pt;
    font-weight: 600;
  }
  .cover-footer {
    background: rgba(0,0,0,0.25);
    padding: 14px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8pt;
    opacity: .75;
    border-top: 1px solid rgba(255,255,255,0.15);
  }
  .cover-watermark {
    position: absolute;
    right: -60px;
    bottom: 60px;
    width: 360px;
    opacity: .06;
  }

  /* ── DOCUMENT HEADER (all non-cover pages) ── */
  .doc-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 0 10px;
    border-bottom: 2.5px solid #1463a5;
    margin-bottom: 22px;
  }
  .doc-header img { width: 38px; height: 36px; }
  .doc-header-text { flex: 1; }
  .doc-header-title {
    font-size: 8pt;
    font-weight: 700;
    color: #1463a5;
    text-transform: uppercase;
    letter-spacing: .8px;
  }
  .doc-header-sub {
    font-size: 7pt;
    color: #888;
  }
  .doc-header-right {
    text-align: right;
    font-size: 7pt;
    color: #aaa;
  }

  /* ── SECTION TITLE ── */
  .section-title {
    font-size: 15pt;
    font-weight: 800;
    color: #0a2d5e;
    border-left: 5px solid #c70039;
    padding-left: 14px;
    margin: 0 0 18px;
    line-height: 1.2;
  }
  .section-title.blue { border-left-color: #1463a5; }
  .section-title.sm {
    font-size: 12pt;
    margin-bottom: 14px;
  }

  /* ── DOCUMENT CONTROL TABLE ── */
  .doc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    margin-bottom: 24px;
  }
  .doc-table th {
    background: #0a2d5e;
    color: #fff;
    padding: 7px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 8pt;
    letter-spacing: .5px;
    text-transform: uppercase;
  }
  .doc-table td {
    padding: 7px 12px;
    border-bottom: 1px solid #e8e8e8;
    vertical-align: top;
  }
  .doc-table tr:nth-child(even) td { background: #f8f9fb; }
  .doc-table tr:last-child td { border-bottom: 2px solid #1463a5; }

  /* ── OVERVIEW BOX ── */
  .overview-box {
    background: #eef4fb;
    border: 1.5px solid #b3d1ef;
    border-left: 5px solid #1463a5;
    border-radius: 6px;
    padding: 16px 20px;
    margin-bottom: 24px;
    font-size: 9.5pt;
    color: #0a2d5e;
    line-height: 1.65;
  }
  .overview-box strong { color: #1463a5; }

  /* ── WORKFLOW SUMMARY TABLE ── */
  .workflow-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    margin-bottom: 20px;
  }
  .workflow-table th {
    background: #1463a5;
    color: #fff;
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: .4px;
  }
  .workflow-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #e0e8f0;
    vertical-align: top;
  }
  .workflow-table tr:nth-child(even) td { background: #f4f8fc; }
  .step-num {
    display: inline-block;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #1463a5;
    color: #fff;
    font-size: 9pt;
    font-weight: 700;
    text-align: center;
    line-height: 22px;
    margin-right: 6px;
  }
  .badge-state {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 8pt;
    font-weight: 600;
  }
  .bs-eval   { background:#e0f0ff; color:#0a5a9c; }
  .bs-approv { background:#fff3cd; color:#7a5600; }
  .bs-impl   { background:#e8f5e9; color:#1a5c2a; }
  .bs-pssr   { background:#f3e8ff; color:#5b1a8e; }
  .bs-closed { background:#e8e8e8; color:#444; }
  .bs-reject { background:#fde8e8; color:#8b1a1a; }

  /* ── DEMO STEP BLOCK ── */
  .demo-step {
    margin-bottom: 32px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .demo-step-header {
    display: flex;
    align-items: center;
    gap: 14px;
    background: linear-gradient(90deg, #0a2d5e 0%, #1463a5 100%);
    color: #fff;
    padding: 10px 18px;
    border-radius: 8px 8px 0 0;
    margin-bottom: 0;
  }
  .demo-step-num {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #c70039;
    color: #fff;
    font-size: 12pt;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .demo-step-title { font-size: 11pt; font-weight: 700; }
  .demo-step-role  { font-size: 8pt; opacity: .8; margin-top: 1px; }
  .demo-step-body {
    border: 1.5px solid #c5d8ee;
    border-top: none;
    border-radius: 0 0 8px 8px;
    padding: 16px 18px;
    background: #fff;
  }
  .demo-step-body p {
    font-size: 9.5pt;
    color: #333;
    margin-bottom: 10px;
    line-height: 1.6;
  }
  .demo-step-body ul {
    padding-left: 20px;
    margin-bottom: 10px;
  }
  .demo-step-body li {
    font-size: 9pt;
    color: #444;
    margin-bottom: 4px;
    line-height: 1.5;
  }
  .demo-step-body li strong { color: #0a2d5e; }

  /* ── SCREENSHOT GRID ── */
  .screenshot-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-top: 14px;
  }
  .screenshot-grid.single { grid-template-columns: 1fr; }
  .screenshot-item {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .screenshot-item img {
    width: 100%;
    border: 1px solid #d0d8e4;
    border-radius: 5px;
    display: block;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .screenshot-caption {
    font-size: 7.5pt;
    color: #666;
    text-align: center;
    margin-top: 4px;
    font-style: italic;
  }

  /* ── HIGHLIGHT BOX ── */
  .highlight-box {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 11px 14px;
    border-radius: 6px;
    margin: 10px 0;
    font-size: 9pt;
    line-height: 1.55;
  }
  .hb-blue  { background: #eef4fb; border: 1px solid #b3d1ef; color: #0a2d5e; }
  .hb-red   { background: #fef2f2; border: 1px solid #fca5a5; color: #7f1d1d; }
  .hb-amber { background: #fffbeb; border: 1px solid #fde68a; color: #7a5600; }
  .highlight-box-icon { font-size: 12pt; flex-shrink: 0; margin-top: 1px; }

  /* ── RULES SECTION ── */
  .rules-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
  .rule-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 10px 14px;
    background: #f8f9fb;
    border-left: 4px solid #1463a5;
    border-radius: 0 6px 6px 0;
    font-size: 9pt;
    line-height: 1.5;
  }
  .rule-item.rule-red  { border-left-color: #c70039; }
  .rule-item.rule-amber{ border-left-color: #f59e0b; }
  .rule-item.rule-green{ border-left-color: #16a34a; }
  .rule-item.rule-purple{ border-left-color: #7c3aed; }

  /* ── ROLE MATRIX TABLE ── */
  .role-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin-bottom: 20px;
    text-align: center;
  }
  .role-table th {
    background: #0a2d5e;
    color: #fff;
    padding: 8px 10px;
    font-weight: 600;
    font-size: 8pt;
  }
  .role-table th:first-child { text-align: left; }
  .role-table td {
    padding: 7px 10px;
    border-bottom: 1px solid #e0e8f0;
  }
  .role-table td:first-child { text-align: left; font-weight: 500; color: #0a2d5e; }
  .role-table tr:nth-child(even) td { background: #f4f8fc; }
  .check { color: #16a34a; font-size: 12pt; font-weight: 700; }
  .dash  { color: #bbb; }

  /* ── TECH STACK ── */
  .tech-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .tech-item {
    background: #f4f8fc;
    border: 1px solid #c5d8ee;
    border-radius: 6px;
    padding: 12px 16px;
  }
  .tech-item label {
    font-size: 7.5pt;
    font-weight: 700;
    color: #1463a5;
    text-transform: uppercase;
    letter-spacing: .6px;
    display: block;
    margin-bottom: 4px;
  }
  .tech-item span { font-size: 9pt; color: #333; }

  /* ── AI PHASE TABLE ── */
  .phase-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    margin: 10px 0;
  }
  .phase-table th {
    background: #1463a5;
    color: #fff;
    padding: 7px 12px;
    text-align: left;
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
  }
  .phase-table td {
    padding: 7px 12px;
    border-bottom: 1px solid #e8e8e8;
    font-size: 8.5pt;
  }
  .phase-table tr:nth-child(even) td { background: #f8f9fb; }

  /* ── PAGE ── */
  .page { padding: 18mm 18mm 14mm; }
  .page + .page { padding-top: 14mm; }

  /* ── TOC ── */
  .toc-item {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 5px 0;
    border-bottom: 1px dotted #ccc;
    font-size: 9.5pt;
  }
  .toc-num { color: #1463a5; font-weight: 700; min-width: 28px; }
  .toc-title { flex: 1; }
  .toc-sub { font-size: 8.5pt; color: #666; padding-left: 28px; }
  .toc-item.toc-main { font-weight: 600; color: #0a2d5e; }
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════════
     COVER PAGE
══════════════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-top-bar">
    <div class="cover-logo">
      <img src="${chevronLogoB64}" alt="Chevron" />
    </div>
    <div class="cover-company">Chevron Corporation</div>
  </div>

  <div class="cover-body">
    <div class="cover-classification">Internal Use Only</div>
    <div class="cover-title">MOC Digital<br>Application</div>
    <div class="cover-subtitle">Management of Change — HSE Digital Platform</div>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <label>Document Date</label>
        <span>${today}</span>
      </div>
      <div class="cover-meta-item">
        <label>Version</label>
        <span>${version}</span>
      </div>
      <div class="cover-meta-item">
        <label>Status</label>
        <span>Demo / Prototype</span>
      </div>
    </div>
  </div>

  <div class="cover-footer">
    <span>Chevron MOC Digital Application — Management of Change HSE Platform</span>
    <span>CONFIDENTIAL — INTERNAL USE ONLY</span>
  </div>

  <!-- watermark logo -->
  <img class="cover-watermark" src="${chevronLogoB64}" alt="" />
</div>

<!-- ═══════════════════════════════════════════════
     TABLE OF CONTENTS
══════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <div class="section-title">Table of Contents</div>

  <div class="toc-item toc-main"><span class="toc-num">1</span><span class="toc-title">Document Overview &amp; Purpose</span></div>
  <div class="toc-item toc-main"><span class="toc-num">2</span><span class="toc-title">Demo Users &amp; Roles</span></div>
  <div class="toc-item toc-main"><span class="toc-num">3</span><span class="toc-title">8-Step Workflow Summary</span></div>
  <div class="toc-item toc-main"><span class="toc-num">4</span><span class="toc-title">Step-by-Step Demo Walkthrough</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 1 — Login</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 2 — Admin: The Big Picture</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 3 — Owner: Create a New MOC</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 4 — MOC Detail View</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 5 — Evaluator: Complete the Evaluation</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 6 — Owner: Submit for Approval to Implement</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 7 — Manager: Approve or Reject</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 7a — Rejection &amp; Owner Revision Flow</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 8 — Owner: Implementation</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 9 — PSSR (Pre-Startup Safety Review)</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 10 — Manager: Approve Start Up</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 11 — Owner: Ready for Closure</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 12 — Notifications</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 13 — Closed MOC: Full Audit Trail</span></div>
  <div class="toc-item toc-sub"><span class="toc-num"></span><span class="toc-title">Step 14 — Assigned Tasks &amp; Your Status</span></div>
  <div class="toc-item toc-main"><span class="toc-num">5</span><span class="toc-title">Action Item Types &amp; Further Action Items</span></div>
  <div class="toc-item toc-main"><span class="toc-num">6</span><span class="toc-title">Role &amp; Visibility Matrix</span></div>
  <div class="toc-item toc-main"><span class="toc-num">7</span><span class="toc-title">Key Rules &amp; Guardrails</span></div>
  <div class="toc-item toc-main"><span class="toc-num">8</span><span class="toc-title">Technology Stack</span></div>
</div>

<!-- ═══════════════════════════════════════════════
     SECTION 1 — OVERVIEW
══════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <div class="section-title">1. Document Overview &amp; Purpose</div>
  <div class="overview-box">
    The <strong>Chevron MOC Digital Application</strong> is a Management of Change (MOC) platform built for Chevron's HSE Digital initiative. It provides a structured, auditable workflow for proposing, evaluating, approving, implementing, and closing engineering and operational changes in compliance with Chevron's HSE standards.<br><br>
    The application replaces paper-based MOC processes with a fully digital, role-based system that enforces stage-gate controls, tracks all decisions with timestamps, and maintains an immutable audit trail from initiation through closure.<br><br>
    This document serves as the official demo guide and functional reference for the application prototype.
  </div>

  <div class="section-title sm blue">Quick Start</div>
  <div class="doc-table" style="margin-bottom:0">
    <table class="doc-table">
      <thead><tr><th>Step</th><th>Command</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td>1. Install dependencies</td><td><code>npm install</code></td><td>One time only</td></tr>
        <tr><td>2. Build the app</td><td><code>npx ng build</code></td><td>Compiles Angular to <code>dist/</code></td></tr>
        <tr><td>3. Start the server</td><td><code>node serve-dist.js</code></td><td>Serves on port 4300</td></tr>
        <tr><td>4. Open in browser</td><td><code>http://127.0.0.1:4300/</code></td><td>Demo password: <strong>demo123</strong></td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ═══════════════════════════════════════════════
     SECTION 2 — DEMO USERS
══════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <div class="section-title">2. Demo Users &amp; Roles</div>
  <p style="font-size:9.5pt;margin-bottom:16px;color:#444;">Use <strong>Persona Login</strong> (one-click) or <strong>ID &amp; Password</strong> with password <code>demo123</code> for any user.</p>

  <table class="doc-table">
    <thead><tr><th>Login Name</th><th>Role</th><th>Discipline</th><th>Primary Responsibilities</th></tr></thead>
    <tbody>
      <tr><td><strong>Olivia</strong></td><td>Owner</td><td>—</td><td>Creates MOCs, submits for approval, drives implementation, closes MOC</td></tr>
      <tr><td><strong>Owen</strong></td><td>Owner</td><td>—</td><td>Secondary Owner for demonstration variety</td></tr>
      <tr><td><strong>Mike</strong></td><td>Evaluator</td><td>Mechanical</td><td>Completes Mechanical discipline evaluation checklist</td></tr>
      <tr><td><strong>Priya</strong></td><td>Evaluator</td><td>Process</td><td>Completes Process discipline evaluation checklist</td></tr>
      <tr><td><strong>Evan</strong></td><td>Evaluator</td><td>Environmental</td><td>Completes Environmental evaluation checklist</td></tr>
      <tr><td><strong>Harper</strong></td><td>Evaluator</td><td>HSE</td><td>Completes HSE evaluation checklist</td></tr>
      <tr><td><strong>Oscar</strong></td><td>Evaluator</td><td>Operations</td><td>Completes PSSR (Pre-Startup Safety Review) checklist</td></tr>
      <tr><td><strong>Morgan</strong></td><td>Manager</td><td>—</td><td>Approves or rejects at Approval to Implement and Approval for Start Up gates</td></tr>
      <tr><td><strong>Ada</strong></td><td>Admin</td><td>—</td><td>Views all MOCs, configures checklists, can reset demo data</td></tr>
    </tbody>
  </table>

  <div class="screenshot-grid single no-break" style="margin-top:20px">
    <div class="screenshot-item">
      <img src="${img('01-login-persona-tab.png')}" alt="Login Persona Tab" />
      <div class="screenshot-caption">Fig 1 — Persona Login: click any user tile to sign in instantly</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════
     SECTION 3 — WORKFLOW SUMMARY
══════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <div class="section-title">3. 8-Step Workflow Summary</div>

  <table class="workflow-table">
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th style="width:180px">Stage</th>
        <th style="width:120px">Role</th>
        <th>What Happens</th>
        <th style="width:90px">Gate Condition</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="step-num">1</span></td>
        <td><span class="badge-state bs-eval">Evaluation</span></td>
        <td>Owner</td>
        <td>Owner fills in change details, selects disciplines, uploads supporting document, and submits. MOC auto-routes to all assigned Evaluators.</td>
        <td>All fields filled</td>
      </tr>
      <tr>
        <td><span class="step-num">2</span></td>
        <td><span class="badge-state bs-eval">Evaluation</span></td>
        <td>Evaluators</td>
        <td>Each discipline Evaluator independently completes their checklist and raises action items (Evaluation / Pre-Startup / Post-Startup phase). All Evaluation AIs must be closed before Owner can advance.</td>
        <td>All evals + Eval AIs complete</td>
      </tr>
      <tr>
        <td><span class="step-num">3</span></td>
        <td><span class="badge-state bs-approv">Approval to Implement</span></td>
        <td>Owner → Manager</td>
        <td>Owner submits for approval. Manager reviews and approves (→ Implementation) or rejects (→ Rejected state, Owner revises).</td>
        <td>Manager decision</td>
      </tr>
      <tr>
        <td></td>
        <td><span class="badge-state bs-reject">Rejected</span></td>
        <td>Owner</td>
        <td>Manager rejected: Owner sees rejection reason, edits initiation fields, and resubmits. Revision History records all field changes. All evaluations reset.</td>
        <td>Owner resubmits</td>
      </tr>
      <tr>
        <td><span class="step-num">4</span></td>
        <td><span class="badge-state bs-impl">Implementation</span></td>
        <td>Owner</td>
        <td>Owner marks implementation complete after all field work, procedure updates, and drawing revisions are done.</td>
        <td>Owner confirms complete</td>
      </tr>
      <tr>
        <td><span class="step-num">5</span></td>
        <td><span class="badge-state bs-pssr">PSSR</span></td>
        <td>Operations</td>
        <td>Operations completes PSSR checklist and closes all Pre-Startup action items. Operations may also raise new Pre-Startup / Post-Startup AIs during this stage.</td>
        <td>PSSR checklist + Pre-Startup AIs</td>
      </tr>
      <tr>
        <td><span class="step-num">6</span></td>
        <td><span class="badge-state bs-approv">Approval for Start Up</span></td>
        <td>Manager</td>
        <td>Manager reviews PSSR results and approves startup (→ Ready for Closure) or rejects back to PSSR for additional review.</td>
        <td>Manager decision</td>
      </tr>
      <tr>
        <td><span class="step-num">7</span></td>
        <td><span class="badge-state bs-impl">Ready for Closure</span></td>
        <td>Assignees → Owner</td>
        <td>All Post-Startup action items must be closed (each with a comment and optional evidence). Only then can Owner close the MOC.</td>
        <td>All Post-Startup AIs closed</td>
      </tr>
      <tr>
        <td><span class="step-num">8</span></td>
        <td><span class="badge-state bs-closed">Closed</span></td>
        <td>Owner</td>
        <td>MOC permanently closed. Full audit trail (evaluations, checklists, action items, approvals, revision history) locked and read-only.</td>
        <td>Final state</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- ═══════════════════════════════════════════════
     SECTION 4 — DEMO WALKTHROUGH
══════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <div class="section-title">4. Step-by-Step Demo Walkthrough</div>

  <!-- Step 1: Login -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">1</div>
      <div><div class="demo-step-title">Login</div><div class="demo-step-role">All Users</div></div>
    </div>
    <div class="demo-step-body">
      <p>Two login modes are available: <strong>Persona Login</strong> (click a user tile — instant sign-in) and <strong>ID &amp; Password</strong> (username + <code>demo123</code>). Use Persona Login for live demos.</p>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('01-login-persona-tab.png')}" alt="Persona Login" />
          <div class="screenshot-caption">Persona Login — click any tile to sign in instantly</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('02-login-password-tab.png')}" alt="Password Login" />
          <div class="screenshot-caption">ID &amp; Password tab — username + demo123</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Step 2: Admin -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">2</div>
      <div><div class="demo-step-title">Admin: The Big Picture</div><div class="demo-step-role">Role: Ada (Admin)</div></div>
    </div>
    <div class="demo-step-body">
      <p>Admin sees every MOC across all users. The Demo Reset button restores seed data at any time. Admin also configures discipline evaluation checklists and the PSSR checklist.</p>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('03-admin-all-mocs-dashboard.png')}" alt="Admin Dashboard" />
          <div class="screenshot-caption">Admin dashboard — all MOCs in the system</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('05-admin-checklist-config-top.png')}" alt="Admin Checklist Config" />
          <div class="screenshot-caption">Checklist Admin — configure evaluation checklist items per discipline</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <!-- Step 3: Create MOC -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">3</div>
      <div><div class="demo-step-title">Owner: Create a New MOC</div><div class="demo-step-role">Role: Olivia (Owner)</div></div>
    </div>
    <div class="demo-step-body">
      <p>Click <strong>+ New MOC</strong> to open the initiation form. Fill in all required fields and click <strong>Submit MOC</strong> — the record is created and immediately routed to assigned Evaluators.</p>
      <ul>
        <li><strong>Title</strong> — short descriptive name</li>
        <li><strong>Description</strong> — what the change is</li>
        <li><strong>Basis / Justification</strong> — HAZOP finding, regulatory requirement, etc.</li>
        <li><strong>Disciplines Involved</strong> — each selected discipline gets its own evaluator</li>
        <li><strong>Supporting Document</strong> — engineering basis or HAZOP report</li>
        <li><strong>Target Implementation Date</strong> — when the change must be in place</li>
      </ul>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('07-owner-dashboard.png')}" alt="Owner Dashboard" />
          <div class="screenshot-caption">Owner dashboard — My MOCs with KPI summary tiles</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('09-owner-create-moc-modal-filled.png')}" alt="Create MOC Filled" />
          <div class="screenshot-caption">Create MOC modal — filled out and ready to submit</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Step 4: MOC Detail -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">4</div>
      <div><div class="demo-step-title">MOC Detail View</div><div class="demo-step-role">All Users</div></div>
    </div>
    <div class="demo-step-body">
      <p>Click any MOC row to open the detail view — the single source of truth for the entire lifecycle. The 8-step workflow map at the top shows current position with completed steps checked.</p>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('10-moc-detail-workflow-map.png')}" alt="Workflow Map" />
          <div class="screenshot-caption">Workflow map — visual 8-step progress indicator</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('12-moc-detail-evaluation-progress.png')}" alt="Evaluation Progress" />
          <div class="screenshot-caption">Evaluation Progress — per-discipline checklist and action item status</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <!-- Step 5: Evaluator -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">5</div>
      <div><div class="demo-step-title">Evaluator: Complete the Evaluation</div><div class="demo-step-role">Role: Mike (Evaluator — Mechanical)</div></div>
    </div>
    <div class="demo-step-body">
      <p>Sign in as Mike and go to <strong>Assigned Tasks</strong>. Click any MOC to open the evaluation panel for the Mechanical discipline.</p>
      <ul>
        <li>Complete all required checklist items</li>
        <li>Raise action items (choose Evaluation / Pre-Startup / Post-Startup phase)</li>
        <li>Close your own assigned action items with a closure comment</li>
        <li>Click <strong>Mark Evaluation Complete</strong></li>
      </ul>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('14-evaluator-assigned-tasks.png')}" alt="Evaluator Assigned Tasks" />
          <div class="screenshot-caption">Evaluator Assigned Tasks — all assigned MOCs and action items</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('17-evaluator-checklist-and-action-form.png')}" alt="Evaluator Checklist" />
          <div class="screenshot-caption">Evaluation checklist, action item form, and Mark Evaluation Complete</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Step 6: Submit for Approval -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">6</div>
      <div><div class="demo-step-title">Owner: Submit for Approval to Implement</div><div class="demo-step-role">Role: Olivia (Owner)</div></div>
    </div>
    <div class="demo-step-body">
      <p>Once all discipline evaluations and Evaluation-phase action items are complete, the Owner sees the <strong>Submit for Approval to Implement</strong> button in the sticky Workflow Actions panel at the bottom of the MOC detail.</p>
      <div class="screenshot-grid single">
        <div class="screenshot-item">
          <img src="${img('19-owner-submit-for-approval-btn.png')}" alt="Submit for Approval" />
          <div class="screenshot-caption">Workflow Actions panel — Submit for Approval to Implement button</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <!-- Step 7: Manager Approve/Reject -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">7</div>
      <div><div class="demo-step-title">Manager: Approve or Reject</div><div class="demo-step-role">Role: Morgan (Manager)</div></div>
    </div>
    <div class="demo-step-body">
      <p>Sign in as Morgan. <strong>Assigned Tasks</strong> shows all MOCs awaiting Manager action (Action Required) and the full history of past approvals. Click any MOC, review the full detail, scroll to Workflow Actions.</p>
      <ul>
        <li><strong>If Approved</strong> — MOC moves to Implementation; Owner is notified</li>
        <li><strong>If Rejected</strong> — Manager must enter a reason; MOC enters <em>Rejected</em> state and routes to Owner for revision</li>
      </ul>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('38-manager-assigned-tasks-your-status.png')}" alt="Manager Assigned Tasks" />
          <div class="screenshot-caption">Manager Assigned Tasks — full history with Your Status column</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('23-manager-workflow-actions-approve-reject.png')}" alt="Manager Workflow Actions" />
          <div class="screenshot-caption">Manager Workflow Actions — Approve or Reject (Return to Owner)</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Step 7a: Rejection Flow -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num" style="font-size:9pt">7a</div>
      <div><div class="demo-step-title">Rejection &amp; Owner Revision Flow</div><div class="demo-step-role">Role: Owner (after rejection)</div></div>
    </div>
    <div class="demo-step-body">
      <div class="highlight-box hb-red">
        <span class="highlight-box-icon">↩</span>
        <div>
          When a Manager rejects, the MOC enters <strong>Rejected</strong> state (shown at the Initiated position on the workflow map). The Owner sees a red Rejection Reason box with the Manager's name, date, and comment. The Owner clicks <strong>Revise MOC Details</strong>, edits any initiation field, and clicks <strong>Submit Revised MOC</strong>. The MOC re-enters Evaluation with all discipline evaluations reset. A <strong>Revision History</strong> block records every field change as an old → new diff. This cycle can repeat as needed — all history is permanently preserved.
        </div>
      </div>
    </div>
  </div>
</div>

<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <!-- Step 8: Implementation -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">8</div>
      <div><div class="demo-step-title">Owner: Implementation</div><div class="demo-step-role">Role: Owen (Owner)</div></div>
    </div>
    <div class="demo-step-body">
      <p>After Manager approval the Owner drives field implementation. Click <strong>Mark Implementation Complete</strong> to confirm all physical changes, procedure updates, and drawing revisions are done.</p>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('24-owner-moc-in-implementation.png')}" alt="Implementation State" />
          <div class="screenshot-caption">MOC in Implementation — approval history shows Manager approved</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('25-owner-implementation-workflow-actions.png')}" alt="Implementation Actions" />
          <div class="screenshot-caption">Workflow Actions — Mark Implementation Complete button</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Step 9: PSSR -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">9</div>
      <div><div class="demo-step-title">PSSR — Pre-Startup Safety Review</div><div class="demo-step-role">Role: Oscar (Evaluator — Operations)</div></div>
    </div>
    <div class="demo-step-body">
      <p>Operations completes the PSSR checklist and closes all Pre-Startup action items. Operations can also raise new Pre-Startup or Post-Startup action items during this stage.</p>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('27-pssr-moc-detail-top.png')}" alt="PSSR MOC Detail" />
          <div class="screenshot-caption">PSSR MOC Detail — workflow map at PSSR step</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('28-pssr-checklist-section.png')}" alt="PSSR Checklist" />
          <div class="screenshot-caption">PSSR checklist — all items must be checked before submission</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <!-- Step 10: Startup Approval -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">10</div>
      <div><div class="demo-step-title">Manager: Approve Start Up</div><div class="demo-step-role">Role: Morgan (Manager)</div></div>
    </div>
    <div class="demo-step-body">
      <p>Manager reviews PSSR outcome and approves or rejects startup. All decisions recorded in Approval History.</p>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('29-manager-startup-approval-moc-detail.png')}" alt="Startup Approval MOC" />
          <div class="screenshot-caption">Manager reviews PSSR results before approving startup</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('30-manager-startup-approval-actions.png')}" alt="Startup Actions" />
          <div class="screenshot-caption">Workflow Actions — Approve Start Up or Reject (Send Back to PSSR)</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Step 11: Ready for Closure -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">11</div>
      <div><div class="demo-step-title">Owner: Ready for Closure</div><div class="demo-step-role">Role: Olivia (Owner)</div></div>
    </div>
    <div class="demo-step-body">
      <p>All Post-Startup action items must be closed (each with a comment and optional evidence) before the <strong>Close MOC</strong> button activates.</p>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('32-owner-closure-action-items.png')}" alt="Closure Action Items" />
          <div class="screenshot-caption">Post-Startup action items — close each with a comment</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('33-owner-close-moc-button.png')}" alt="Close MOC" />
          <div class="screenshot-caption">Close MOC button — enabled only when all post-startup items are done</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <!-- Step 12: Notifications -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">12</div>
      <div><div class="demo-step-title">Notifications</div><div class="demo-step-role">All Users</div></div>
    </div>
    <div class="demo-step-body">
      <p>The bell icon in the topbar shows unread notifications. Each workflow transition generates a contextual notification for the relevant user. Read-state persists across sessions.</p>
      <div class="screenshot-grid single">
        <div class="screenshot-item">
          <img src="${img('34-notifications-panel.png')}" alt="Notifications" />
          <div class="screenshot-caption">Notification panel — workflow-state-specific messages with mark-read controls</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Step 13: Closed MOC -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">13</div>
      <div><div class="demo-step-title">Closed MOC: Full Audit Trail</div><div class="demo-step-role">Role: Ada (Admin)</div></div>
    </div>
    <div class="demo-step-body">
      <p>As Admin, open any closed MOC to see the complete permanent record — all sections are read-only. Every decision, comment, checklist response, and action item is preserved with timestamps.</p>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('35-closed-moc-detail.png')}" alt="Closed MOC" />
          <div class="screenshot-caption">Closed MOC detail — read-only, full history preserved</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('36-closed-moc-approval-history.png')}" alt="Approval History" />
          <div class="screenshot-caption">Approval History — every Manager decision with timestamp and comment</div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <!-- Step 14: Assigned Tasks -->
  <div class="demo-step no-break">
    <div class="demo-step-header">
      <div class="demo-step-num">14</div>
      <div><div class="demo-step-title">Assigned Tasks &amp; Your Status</div><div class="demo-step-role">All Users</div></div>
    </div>
    <div class="demo-step-body">
      <p><strong>Assigned Tasks</strong> shows every MOC a user has ever been involved in — not just active ones. The <strong>YOUR STATUS</strong> column shows each person's personal involvement status, colour-coded for quick reading.</p>
      <table class="phase-table" style="margin-bottom:12px">
        <thead><tr><th>Status Badge</th><th>Who Sees It</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><strong>Action Required</strong> (amber)</td><td>Manager</td><td>Awaiting your approval decision</td></tr>
          <tr><td><strong>Evaluation Complete</strong> (green)</td><td>Evaluator</td><td>Your discipline evaluation is done</td></tr>
          <tr><td><strong>Evaluation Pending</strong> (blue)</td><td>Evaluator</td><td>Your evaluation is not yet complete</td></tr>
          <tr><td><strong>Approved (Implement / Start Up)</strong> (green)</td><td>Manager</td><td>You approved this gate</td></tr>
          <tr><td><strong>Rejected</strong> (red)</td><td>Manager</td><td>You rejected — MOC is with Owner for revision</td></tr>
          <tr><td><strong>Action Items Open / Complete</strong> (blue/green)</td><td>Any user with AIs</td><td>Your action item status on this MOC</td></tr>
        </tbody>
      </table>
      <div class="screenshot-grid">
        <div class="screenshot-item">
          <img src="${img('37-evaluator-assigned-tasks-your-status.png')}" alt="Evaluator Status" />
          <div class="screenshot-caption">Evaluator full history — past and present MOCs with Your Status</div>
        </div>
        <div class="screenshot-item">
          <img src="${img('38-manager-assigned-tasks-your-status.png')}" alt="Manager Status" />
          <div class="screenshot-caption">Manager full history — approval decisions tracked across all MOCs</div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════
     SECTION 5 — ACTION ITEMS
══════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <div class="section-title">5. Action Item Types &amp; Further Action Items</div>

  <p style="font-size:9.5pt;margin-bottom:14px;color:#333;">Action items have a <strong>Phase</strong> that controls when they can be raised and when they must be closed. Choosing the correct phase is critical for correct stage-gate enforcement.</p>

  <table class="phase-table" style="margin-bottom:20px">
    <thead>
      <tr>
        <th style="width:120px">Phase</th>
        <th>Who Can Raise It</th>
        <th>Completable During</th>
        <th>Must Be Closed Before</th>
        <th>Priority Levels</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Evaluation</strong></td>
        <td>Any Evaluator (during Evaluation stage)</td>
        <td>Evaluation stage</td>
        <td>Owner submits for Approval to Implement</td>
        <td>Critical / High / Normal</td>
      </tr>
      <tr>
        <td><strong>Pre-Startup</strong></td>
        <td>Evaluators (Evaluation) or Operations (PSSR)</td>
        <td>PSSR stage</td>
        <td>Operations submits PSSR for Review</td>
        <td>Critical / High / Normal</td>
      </tr>
      <tr>
        <td><strong>Post-Startup</strong></td>
        <td>Evaluators (Evaluation) or Operations (PSSR)</td>
        <td>Ready for Closure stage</td>
        <td>Owner closes the MOC</td>
        <td>Critical / High / Normal</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title sm blue">Further Action Items</div>

  <div class="highlight-box hb-blue" style="margin-bottom:16px">
    <span class="highlight-box-icon">⇗</span>
    <div>
      <strong>Further Action Items</strong> allow a person to raise a linked action item for another person when they need additional help completing their assigned work. The further AI can be any phase type and assigned to any user.
    </div>
  </div>

  <div class="rules-list">
    <div class="rule-item">
      <strong>Step 1 — Raise</strong>: Click <strong>Raise Further AI</strong> on any open action item assigned to you. Fill in AI type, assignee, priority, due date, description, and a comment. Click Submit.
    </div>
    <div class="rule-item">
      <strong>Step 2 — Close your original</strong>: Your original action item is <em>not</em> automatically closed. A reminder badge reads "Further AI Raised — close this item yourself." You must close it normally (add a closure comment and click Complete).
    </div>
    <div class="rule-item rule-red">
      <strong>Stage Gate Rule</strong>: Both the original action item <em>and</em> the further action item must be closed before the stage can advance. Neither automatically substitutes for the other.
    </div>
    <div class="rule-item rule-green">
      <strong>Linking</strong>: The original item shows the further AI ID; the further AI shows "Further AI from [parent ID]". This creates a visible delegation chain in the audit trail.
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════
     SECTION 6 — ROLE MATRIX
══════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <div class="section-title">6. Role &amp; Visibility Matrix</div>

  <table class="role-table">
    <thead>
      <tr>
        <th style="text-align:left;width:220px">Capability</th>
        <th>Owner</th>
        <th>Evaluator</th>
        <th>Manager</th>
        <th>Admin</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Dashboard — My MOCs</td><td>Own MOCs</td><td>Own MOCs</td><td>Own MOCs</td><td>All MOCs</td></tr>
      <tr><td>Assigned Tasks — MOCs</td><td>—</td><td>All assigned (full history)</td><td>All involved (full history)</td><td>All MOCs</td></tr>
      <tr><td>Create MOC</td><td class="check">✓</td><td class="check">✓</td><td class="check">✓</td><td>✓ (+ owner selector)</td></tr>
      <tr><td>Complete evaluation checklist</td><td class="dash">—</td><td>Own discipline only</td><td class="dash">—</td><td class="check">✓</td></tr>
      <tr><td>Raise action items</td><td class="dash">—</td><td class="check">✓</td><td class="dash">—</td><td class="check">✓</td></tr>
      <tr><td>Close action items</td><td class="dash">—</td><td>Own AIs only</td><td class="dash">—</td><td class="check">✓</td></tr>
      <tr><td>Submit for Approval to Implement</td><td class="check">✓</td><td class="dash">—</td><td class="dash">—</td><td class="check">✓</td></tr>
      <tr><td>Approve / Reject at gates</td><td class="dash">—</td><td class="dash">—</td><td class="check">✓</td><td class="check">✓</td></tr>
      <tr><td>Revise rejected MOC</td><td class="check">✓</td><td class="dash">—</td><td class="dash">—</td><td class="check">✓</td></tr>
      <tr><td>Mark Implementation Complete</td><td class="check">✓</td><td class="dash">—</td><td class="dash">—</td><td class="check">✓</td></tr>
      <tr><td>Complete PSSR checklist</td><td class="dash">—</td><td>Operations only</td><td class="dash">—</td><td class="check">✓</td></tr>
      <tr><td>Close MOC</td><td class="check">✓</td><td class="dash">—</td><td class="dash">—</td><td class="check">✓</td></tr>
      <tr><td>Checklist Admin (configure)</td><td class="dash">—</td><td class="dash">—</td><td class="dash">—</td><td class="check">✓</td></tr>
      <tr><td>Demo Reset</td><td class="dash">—</td><td class="dash">—</td><td class="dash">—</td><td class="check">✓</td></tr>
    </tbody>
  </table>

  <!-- ═══════════════════════════════════════════
       SECTION 7 — KEY RULES
  ══════════════════════════════════════════════ -->
  <div class="section-title" style="margin-top:24px">7. Key Rules &amp; Guardrails</div>

  <div class="rules-list">
    <div class="rule-item">
      <div><strong>Assigned person only</strong> — Action items can only be completed by the person they are assigned to. No exceptions, except Admin override.</div>
    </div>
    <div class="rule-item rule-amber">
      <div><strong>Stage-gate enforcement</strong> — Evaluation items: only completable during Evaluation. Pre-Startup items: PSSR stage only. Post-Startup items: Ready for Closure stage only. The system enforces this — buttons are hidden outside the permitted stage.</div>
    </div>
    <div class="rule-item rule-red">
      <div><strong>Further Action Items — manual closure required</strong> — Raising a Further AI does not auto-close the original. The person who raised the Further AI must close their original item themselves. Both must be closed before stage can advance.</div>
    </div>
    <div class="rule-item">
      <div><strong>Mandatory rejection reason</strong> — Manager rejection at either gate (Approval to Implement or Approval for Start Up) requires a written reason. The Submit button remains disabled until a reason is entered.</div>
    </div>
    <div class="rule-item rule-purple">
      <div><strong>Rejection preserves full history</strong> — Every Manager rejection creates a Revision History entry on the MOC. When the Owner resubmits, all field changes are diffed (old → new) and permanently recorded. All evaluations reset on resubmission.</div>
    </div>
    <div class="rule-item">
      <div><strong>Owner controls advancement</strong> — After Manager approval and after PSSR completion, the Owner must manually advance the MOC. Nothing moves forward automatically at these gates.</div>
    </div>
    <div class="rule-item rule-purple">
      <div><strong>Full audit trail</strong> — All state changes, approvals, rejections, revisions, checklist responses, and action item closures are timestamped with user identity in the Routing Tracker. The closed MOC record is immutable.</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════
     SECTION 8 — TECH STACK
══════════════════════════════════════════════════ -->
<div class="page page-break">
  <div class="doc-header">
    <img src="${chevronLogoB64}" alt="Chevron" />
    <div class="doc-header-text">
      <div class="doc-header-title">Chevron MOC Digital Application</div>
      <div class="doc-header-sub">Management of Change — HSE Digital Platform</div>
    </div>
    <div class="doc-header-right">v${version} · ${today}<br>Internal Use Only</div>
  </div>

  <div class="section-title">8. Technology Stack</div>

  <div class="tech-grid">
    <div class="tech-item"><label>Frontend Framework</label><span>Angular 18 — single standalone component, no routing, no services</span></div>
    <div class="tech-item"><label>UI Component Library</label><span>PrimeNG 17 — tables, modals, tooltips, panel menus</span></div>
    <div class="tech-item"><label>State / Persistence</label><span>localStorage only — no backend, no database required</span></div>
    <div class="tech-item"><label>Build Tool</label><span>Angular CLI — <code>npx ng build</code> → static files in <code>dist/</code></span></div>
    <div class="tech-item"><label>Static File Server</label><span><code>serve-dist.js</code> — Node.js server, port 4300</span></div>
    <div class="tech-item"><label>Screenshot Automation</label><span>Playwright — <code>take-screenshots.js</code> captures 39 screenshots</span></div>
  </div>

  <div class="section-title sm blue" style="margin-top:10px">Project Files</div>
  <table class="doc-table">
    <thead><tr><th>File</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><code>src/app/app.ts</code></td><td>All application logic (~3 000 lines) — components, state, workflow methods</td></tr>
      <tr><td><code>src/app/app.html</code></td><td>All views and templates (~1 800 lines)</td></tr>
      <tr><td><code>src/app/app.css</code></td><td>All styles (~2 400 lines)</td></tr>
      <tr><td><code>serve-dist.js</code></td><td>Static file server for the production build</td></tr>
      <tr><td><code>take-screenshots.js</code></td><td>Playwright script — regenerates all 39 demo screenshots</td></tr>
      <tr><td><code>generate-pdf.js</code></td><td>This script — generates official PDF documentation</td></tr>
      <tr><td><code>ui-screenshots/</code></td><td>39 auto-generated screenshots (referenced in README and this PDF)</td></tr>
    </tbody>
  </table>

  <div class="section-title sm blue" style="margin-top:20px">Regenerating Screenshots &amp; PDF</div>
  <table class="doc-table">
    <thead><tr><th>Command</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td><code>npx ng build</code></td><td>Rebuild app after code changes</td></tr>
      <tr><td><code>node serve-dist.js</code></td><td>Start server on port 4300</td></tr>
      <tr><td><code>node take-screenshots.js</code></td><td>Retake all 39 screenshots</td></tr>
      <tr><td><code>node generate-pdf.js</code></td><td>Regenerate this PDF document</td></tr>
    </tbody>
  </table>

  <!-- Document footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:2px solid #1463a5;display:flex;justify-content:space-between;align-items:center;font-size:8pt;color:#888;">
    <div>
      <img src="${chevronLogoB64}" alt="" style="width:28px;height:26px;vertical-align:middle;margin-right:8px;" />
      <strong style="color:#0a2d5e">Chevron Corporation</strong> — Management of Change HSE Digital Platform
    </div>
    <div style="text-align:right">
      Document Version ${version} · Generated ${today}<br>
      <span style="color:#c70039;font-weight:600">INTERNAL USE ONLY</span>
    </div>
  </div>
</div>

</body>
</html>`;

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const ctx  = await browser.newContext();
  const page = await ctx.newPage();

  console.log('Rendering HTML...');
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Generating PDF...');
  await page.pdf({
    path: OUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    displayHeaderFooter: false,
  });

  await browser.close();
  const size = (fs.statSync(OUT_PDF).size / 1024 / 1024).toFixed(1);
  console.log(`\n✅  PDF generated: ${OUT_PDF}  (${size} MB)\n`);
})();
