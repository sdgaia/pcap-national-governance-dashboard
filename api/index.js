import express from 'express';
const app = express();

function html(){
return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>PCAP National Governance Dashboard</title>
<style>
body{margin:0;padding:18px;background:#f5f7fb;font-family:Arial,sans-serif;color:#0f172a}
.wrapper{max-width:1880px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px;box-shadow:0 8px 30px rgba(15,23,42,.05)}
.header{display:flex;justify-content:space-between;align-items:center}
.title{font-size:34px;font-weight:900}
.subtitle{margin-top:6px;color:#64748b}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:18px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px}
.card h3{margin:0 0 10px;font-size:15px}
.gauge{height:120px;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:900}
.green{color:#16a34a}.blue{color:#2563eb}.orange{color:#f97316}.purple{color:#7c3aed}.red{color:#dc2626}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.bottom{display:grid;grid-template-columns:1.5fr 1fr;gap:12px;margin-top:12px}
.placeholder{margin-top:12px;padding:12px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;color:#475569;font-size:12px}
table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #e5e7eb;padding:8px;text-align:center}th{background:#f8fafc}
.note{margin-top:12px;font-size:12px;color:#64748b}
</style>
</head>
<body>
<div class="wrapper">
<div class="header">
<div>
<div class="title">PCAP National Governance Dashboard</div>
<div class="subtitle">Deployment-ready recursive governance intelligence renderer</div>
</div>
<div>Updated • ${new Date().toLocaleDateString()}</div>
</div>

<div class="grid">
<div class="card"><h3>Recursive Governance Score</h3><div class="gauge green">78%</div></div>
<div class="card"><h3>Governance Drift</h3><div class="gauge orange">32%</div></div>
<div class="card"><h3>Monitoring Reliability</h3><div class="gauge blue">58%</div></div>
<div class="card"><h3>Escalation Readiness</h3><div class="gauge purple">71%</div></div>
<div class="card"><h3>Escalated Actions</h3><div class="gauge red">17</div></div>
</div>

<div class="grid2">
<div class="card">
<h3>Recursive Governance Components (C1–C6)</h3>
<div class="placeholder">
PLACEHOLDER — LIVE AIRTABLE BINDINGS<br><br>
• C1 Policy Governance<br>
• C2 Instrument Governance<br>
• C3 Resource Governance<br>
• C4 Monitoring Governance<br>
• C5 Escalation Governance<br>
• C6 Traceability Governance
</div>
</div>

<div class="card">
<h3>Governance Intelligence Components</h3>
<div class="placeholder">
PLACEHOLDER — AI governance synthesis, governance diagnostics, reviewer focus, recursive aggregation, governance rationale.
</div>
</div>
</div>

<div class="bottom">
<div class="card">
<h3>Sectoral Strategies Governance Benchmarking</h3>
<table>
<thead>
<tr>
<th>#</th>
<th>Sectoral Strategy</th>
<th>Overall Governance</th>
<th>Status</th>
</tr>
</thead>
<tbody>
<tr><td>1</td><td>Health</td><td>79%</td><td>STRONG</td></tr>
<tr><td>2</td><td>Education</td><td>71%</td><td>STRONG</td></tr>
<tr><td>3</td><td>Agriculture</td><td>64%</td><td>MODERATE</td></tr>
<tr><td>4</td><td>Energy</td><td>58%</td><td>MODERATE</td></tr>
<tr><td>5</td><td>Transport</td><td>53%</td><td>WEAK</td></tr>
</tbody>
</table>
<div class="placeholder">
PLACEHOLDER — recursive governance aggregation from linked sectoral strategies.
</div>
</div>

<div class="card">
<h3>Governance Synthesis</h3>
<div class="placeholder">
PLACEHOLDER — governance strengths, governance gaps, governance drift interpretation, escalation analysis, monitoring analysis, reviewer priorities.
</div>
</div>
</div>

<div class="note">
Deployment-ready governance dashboard with placeholders for Airtable live integration and ScreenshotOne rendering.
</div>
</div>
</body>
</html>`;
}

app.get('/',(req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.send(html());});
app.get('/api',(req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.send(html());});

export default app;
