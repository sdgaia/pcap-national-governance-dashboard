import express from 'express';

const app = express();

const KEY = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE || '';
const BASE = process.env.AIRTABLE_BASE_ID || '';
const NAT_TABLE = process.env.AIRTABLE_NATIONAL_STRATEGIES_TABLE || 'National Strategies';
const PROG_TABLE = process.env.AIRTABLE_PROGRAMS_TABLE || 'Programs';
const POLICY_TABLE = process.env.AIRTABLE_POLICIES_TABLE || 'Policies';

const scoreColor = v => v >= 80 ? '#16a34a' : v >= 60 ? '#2563eb' : v >= 40 ? '#f97316' : '#dc2626';
const exposureColor = v => v <= 20 ? '#16a34a' : v <= 40 ? '#2563eb' : v <= 60 ? '#f97316' : '#dc2626';
const scoreLabel = v => v >= 80 ? 'Strong' : v >= 60 ? 'Moderate' : v >= 40 ? 'Fragile' : 'Critical';
const exposureLabel = v => v <= 20 ? 'Low Exposure' : v <= 40 ? 'Moderate Exposure' : v <= 60 ? 'High Exposure' : 'Severe Exposure';

function safe(v) {
  return String(v ?? '').replace(/[&<>"]/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s]));
}

function recordIdFrom(req) {
  const q = req.query || {};
  return String(q.recordId || q.id || q.rec || Object.keys(q).find(k => k.startsWith('rec')) || req.params.recordId || '').trim();
}

function raw(f, names) {
  for (const k of Array.isArray(names) ? names : [names]) {
    const v = f?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
}

function text(v, fallback = '-') {
  if (Array.isArray(v)) return v.map(x => x?.name || x?.id || x).filter(Boolean).join(', ') || fallback;
  if (v && typeof v === 'object') return v.name || v.id || fallback;
  return v === undefined || v === null || v === '' ? fallback : String(v);
}

function pick(f, names, fallback = '-') {
  return text(raw(f, names), fallback);
}

function asArray(v) {
  if (Array.isArray(v)) return v.map(x => x?.id || x?.name || x).filter(Boolean);
  if (!v) return [];
  return String(v).split(/;|\n|,/).map(x => x.trim()).filter(Boolean);
}

function n(v) {
  if (Array.isArray(v)) return v.length ? n(v[0]) : null;
  if (v === undefined || v === null || v === '') return null;
  const x = Number(String(v).replace('%', '').trim());
  if (!Number.isFinite(x)) return null;
  return x > 0 && x <= 1 ? Math.round(x * 100) : Math.round(x);
}

function pct(v, fallback = 0) {
  const x = n(v);
  return x === null ? fallback : Math.max(0, Math.min(100, x));
}

function avg(values, fallback = 0) {
  const xs = values.map(v => pct(v, null)).filter(v => v !== null && Number.isFinite(v));
  return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : fallback;
}

function wordScore(v, fallback = 50) {
  const s = String(v || '').toLowerCase();
  if (!s) return fallback;
  if (/critical|severe|high risk|not ready|weak/.test(s)) return 25;
  if (/fragile|medium|moderate risk|partial/.test(s)) return 45;
  if (/moderate|developing|stable/.test(s)) return 65;
  if (/strong|ready|mature|low|excellent/.test(s)) return 82;
  return fallback;
}

async function getRecord(table, id) {
  if (!KEY || !BASE || !id) return null;
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}/${id}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function getLinked(table, ids) {
  const out = [];
  for (const id of asArray(ids).filter(x => String(x).startsWith('rec')).slice(0, 16)) {
    try {
      const r = await getRecord(table, id);
      if (r) out.push(r);
    } catch (e) {}
  }
  return out;
}

function gauge(title, value, exposure = false) {
  const v = pct(value);
  const color = exposure ? exposureColor(v) : scoreColor(v);
  const label = exposure ? exposureLabel(v) : scoreLabel(v);
  const rotation = -90 + v * 1.8;
  return `<div class="card gauge-card"><div class="gauge-title">${safe(title)}</div><div class="gauge-shell"><div class="gauge-bg"><div class="gauge-inner"></div><div class="needle" style="transform:rotate(${rotation}deg)"></div><div class="needle-center"></div><div class="gauge-value" style="color:${color}">${v}%</div><div class="gauge-label" style="color:${color}">${label}</div></div></div><div class="scale"><span>0%</span><span>100%</span></div></div>`;
}

function row(label, value) {
  const v = pct(value);
  return `<div class="metric-row"><div><b>${safe(label)}</b></div><div class="track"><div class="fill" style="width:${v}%;background:${scoreColor(v)}"></div></div><div>${v}%</div></div>`;
}

function box(title, body) {
  return `<div class="box"><h4>${safe(title)}</h4><p>${safe(body)}</p></div>`;
}

function statusClass(v) {
  return v >= 80 ? 'strong' : v >= 60 ? 'moderate' : 'fragile';
}

function build(record, programmes, policies) {
  const f = record?.fields || {};

  const c1 = pct(raw(f, ['C1 Score', 'C1 National Operational Governance Score', 'C1 National Strategy Coherence Score', 'C1 Policy Governance']), 0);
  const c2 = pct(raw(f, ['C2 Score', 'C2 National Operational Governance Score', 'C2 National Strategy Coherence Score', 'C2 Policy Governance']), 0);
  const c3 = pct(raw(f, ['C3 Score', 'C3 National Operational Governance Score', 'C3 National Strategy Coherence Score', 'C3 Policy Governance']), 0);
  const c4 = pct(raw(f, ['C4 Score', 'Monitoring Reliability', 'C4 National Operational Governance Score', 'C4 National Strategy Coherence Score']), 0);
  const c5 = pct(raw(f, ['C5 Score', 'Escalation Readiness', 'C5 National Operational Governance Score', 'C5 National Strategy Coherence Score']), 0);
  const c6 = pct(raw(f, ['C6 Score', 'Traceability Score', 'C6 National Operational Governance Score', 'C6 National Strategy Coherence Score']), 0);
  const comps = [c1, c2, c3, c4, c5, c6];

  const operational = pct(raw(f, ['Operational Governance Score', 'National Operational Governance Score', 'Overall Coherence Score', 'Governance Intelligence Score']), avg(comps, 0));
  const delivery = pct(raw(f, ['Operational Delivery Stability', 'Operational Continuity', 'Execution Stability', 'OCI-O']), avg([c4, c5, c6], operational));
  const monitoring = pct(raw(f, ['Monitoring Reliability', 'C4 Score']), c4);
  const escalation = pct(raw(f, ['Escalation Readiness', 'C5 Score']), c5);
  const fragmentation = pct(raw(f, ['Fragmentation Exposure', 'Governance Drift', 'Strategic Fragmentation Index']), Math.max(0, Math.min(100, Math.round((100 - monitoring) * .45 + (100 - escalation) * .35 + (100 - delivery) * .20))));
  const certification = pct(raw(f, ['Certification Readiness', 'Governance Certification Readiness', 'AI Certification Readiness']), wordScore(raw(f, ['AI Certification Readiness']), avg([operational, delivery, monitoring, escalation], 0)));

  const programmeRows = (programmes || []).map((r, i) => {
    const pf = r.fields || {};
    const score = pct(raw(pf, ['Operational Governance Score', 'Programme Operational Governance Score', 'Final Programme Coherence Score', 'Overall Coherence Score']), 0);
    return {
      name: pick(pf, ['Programme Name', 'Program Name', 'Name', 'Programme ID', 'Program ID'], `Programme ${i + 1}`),
      score,
      status: scoreLabel(score)
    };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  const linkedProgramNames = asArray(raw(f, ['Programs', 'Programmes', 'Linked Programmes', 'Linked Programs'])).filter(x => !String(x).startsWith('rec'));
  const finalProgrammes = programmeRows.length ? programmeRows : linkedProgramNames.length ? linkedProgramNames.map(x => ({ name: x, score: operational, status: scoreLabel(operational) })) : [{ name: 'Linked programmes not loaded', score: operational, status: scoreLabel(operational) }];

  const weakest = comps.reduce((m, v, i) => v < m.value ? { index: i, value: v } : m, { index: 0, value: comps[0] });
  const compNames = ['C1 National Alignment', 'C2 Policy Embedding', 'C3 Resource Governance', 'C4 Monitoring System', 'C5 Trigger & Escalation', 'C6 Traceability'];

  return {
    id: pick(f, ['ID', 'Strategy ID', 'Policy ID'], record?.id || '-'),
    name: pick(f, ['Strategy Name', 'Policy Name', 'Name'], 'National Operational Governance Record'),
    country: pick(f, ['Country'], 'Ghana'),
    owner: pick(f, ['Issuing Authority', 'National Strategy Coherence Owner', 'Owner', 'Responsible Institution'], 'National owner'),
    recordId: record?.id || '',
    operational,
    delivery,
    monitoring,
    escalation,
    fragmentation,
    certification,
    comps,
    compNames,
    weakest,
    programmes: finalProgrammes,
    strongest: finalProgrammes[0],
    weakestProgramme: finalProgrammes[finalProgrammes.length - 1],
    summary: pick(f, ['AI Executive Summary', 'Executive Governance Narrative', 'Governance Intelligence Summary'], 'The national operational governance assessment is generated from the selected Airtable record.'),
    brief: pick(f, ['AI Decision-Maker Brief', 'Operational Coherence Diagnosis'], 'Decision-makers should review operational delivery, monitoring reliability, escalation readiness and traceability.'),
    risk: pick(f, ['AI Key Risk', 'Governance Failure Pattern', 'Escalation Outlook'], 'Operational exposure should be reviewed through monitoring and escalation evidence.'),
    recommendation: pick(f, ['AI Main Recommendation', 'Priority Intervention Narrative'], 'Strengthen monitoring reliability, escalation closure and evidence traceability.'),
    maturity: pick(f, ['AI Operational Maturity', 'OCI Label'], scoreLabel(operational)),
    severity: pick(f, ['AI Governance Severity', 'Governance Severity'], exposureLabel(fragmentation)),
    docs: [...new Set([...asArray(raw(f, ['Policy Source Documents', 'National Strategy Source Documents', 'Documents', 'References'])), pick(f, ['Strategy Name', 'Policy Name', 'Name'], 'National record')])].slice(0, 6)
  };
}

function renderDashboard(d) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>National Operational Governance Dashboard</title><style>
*{box-sizing:border-box}body{margin:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#0f172a;padding:18px}.container{max-width:1550px;margin:auto}.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;box-shadow:0 1px 8px rgba(15,23,42,.05)}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}.eyebrow{font-size:13px;font-weight:900;color:#475569}.title{font-size:38px;font-weight:900;margin-top:6px}.subtitle{margin-top:8px;color:#64748b}.meta{display:flex;gap:18px;flex-wrap:wrap;margin-top:12px;font-size:13px;font-weight:800}.grid5,.grid3,.grid2{display:grid;gap:14px;margin-bottom:16px}.grid5{grid-template-columns:repeat(5,1fr)}.grid3{grid-template-columns:repeat(3,1fr)}.grid2{grid-template-columns:1fr 1fr}.gauge-card{min-height:210px}.gauge-title,.section-title{font-size:15px;font-weight:900;margin-bottom:10px}.section-title{font-size:20px}.gauge-shell{height:125px;display:flex;align-items:flex-end;justify-content:center;overflow:hidden}.gauge-bg{position:relative;width:220px;height:110px;border-radius:220px 220px 0 0;background:conic-gradient(from 270deg,#dc2626 0 45deg,#f97316 45deg 72deg,#2563eb 72deg 144deg,#16a34a 144deg 180deg,#e5e7eb 180deg)}.gauge-inner{position:absolute;left:35px;top:35px;width:150px;height:75px;background:#fff;border-radius:150px 150px 0 0}.needle{position:absolute;left:108px;bottom:0;width:4px;height:82px;background:#111827;transform-origin:bottom center;border-radius:6px;z-index:5}.needle-center{position:absolute;left:98px;bottom:-11px;width:24px;height:24px;border-radius:50%;background:#111827;border:5px solid #fff;z-index:6}.gauge-value{position:absolute;left:0;right:0;bottom:28px;text-align:center;font-size:34px;font-weight:900;z-index:7}.gauge-label{position:absolute;left:0;right:0;bottom:9px;text-align:center;font-size:12px;font-weight:900;z-index:7}.scale{display:flex;justify-content:space-between;color:#64748b;font-size:12px;font-weight:800}.assessment{background:linear-gradient(135deg,#f8fafc,#eff6ff)}.mini{background:#fff;border:1px solid #dbeafe;border-radius:10px;padding:12px}.mini span{display:block;color:#64748b;font-size:12px;font-weight:800}.metric{font-size:32px;font-weight:900;margin-top:6px}.interpret{margin-top:14px;background:#fff;border-left:5px solid #2563eb;border-radius:10px;padding:14px}.tag{display:inline-block;background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;padding:6px 10px;margin:4px;font-size:12px;font-weight:800}.metric-row{display:grid;grid-template-columns:240px 1fr 55px;gap:12px;align-items:center;margin:12px 0}.track{height:10px;background:#e5e7eb;border-radius:999px;overflow:hidden}.fill{height:100%;border-radius:999px}.box{border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:10px;background:#fff}.box h4{margin:0 0 6px;font-size:13px}.box p{margin:0;color:#475569;font-size:13px;line-height:1.45}.chain{display:grid;grid-template-columns:1fr 32px 1fr 32px 1fr 32px 1fr;gap:8px;align-items:center}.node{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px}.node.active{background:#dbeafe}.arrow{text-align:center;font-size:24px;color:#2563eb;font-weight:900}.table{width:100%;border-collapse:collapse;font-size:13px}.table th,.table td{border:1px solid #e2e8f0;padding:10px}.table th{background:#f8fafc}.status{padding:5px 9px;border-radius:999px;font-weight:900}.strong{background:#dcfce7;color:#166534}.moderate{background:#dbeafe;color:#1d4ed8}.fragile{background:#ffedd5;color:#9a3412}.exposure{background:#fff7ed;border:1px solid #fed7aa}.exposure-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.exposure-item{background:#fff;border:1px solid #fed7aa;border-radius:10px;padding:12px}.exposure-item b{display:block;color:#64748b;font-size:12px}.exposure-item strong{display:block;font-size:22px;margin-top:6px}@media(max-width:1150px){.grid5,.grid3,.grid2,.chain,.exposure-grid{grid-template-columns:1fr}.arrow{display:none}.header{display:block}}
</style></head><body><div class="container">
<div class="card header"><div><div class="eyebrow">⚙️ National Operational Governance Dashboard</div><div class="title">${safe(d.name)}</div><div class="subtitle">Operational Delivery • Escalation Architecture • Execution Continuity</div><div class="meta"><span>🏛️ ${safe(d.owner)}</span><span>🇬🇭 ${safe(d.country)}</span><span>📄 ${safe(d.id)}</span>${d.recordId ? `<span>🔗 ${safe(d.recordId)}</span>` : ''}</div></div><div class="meta"><span>📅 Updated ${new Date().toLocaleDateString()}</span></div></div>
<div class="grid5">${gauge('National Operational Governance Score',d.operational)}${gauge('Operational Delivery Stability',d.delivery)}${gauge('Monitoring Reliability',d.monitoring)}${gauge('Escalation Readiness',d.escalation)}${gauge('Fragmentation Exposure',d.fragmentation,true)}</div>
<div class="card assessment"><div class="section-title">⚙️ Overall National-Level Operational Governance Assessment</div><div class="grid3"><div class="mini"><span>⚙️ National Operational Governance</span><div class="metric" style="color:${scoreColor(d.operational)}">${d.operational}%</div>${scoreLabel(d.operational)}</div><div class="mini"><span>📡 Operational Continuity</span><div class="metric" style="color:${scoreColor(d.delivery)}">${scoreLabel(d.delivery)}</div>${d.delivery}%</div><div class="mini"><span>⚠️ Operational Exposure</span><div class="metric" style="color:${exposureColor(d.fragmentation)}">${d.fragmentation}%</div>${exposureLabel(d.fragmentation)}</div></div><div class="interpret"><b>${safe(d.maturity)} operational governance profile</b><p>${safe(d.summary)}</p><span class="tag">Monitoring ${d.monitoring}%</span><span class="tag">Escalation ${d.escalation}%</span><span class="tag">Severity ${safe(d.severity)}</span><span class="tag">Certification ${d.certification}%</span></div></div>
<div class="grid2"><div class="card"><div class="section-title">National Operational Governance Components</div>${d.compNames.map((name,i)=>row(name,d.comps[i])).join('')}<div class="box" style="background:#fff1f2;border-color:#fecaca;color:#b91c1c"><b>Weakest Operational Layer — ${safe(d.compNames[d.weakest.index])} — ${d.weakest.value}%</b></div></div><div class="card"><div class="section-title">Operational Governance Stability Layer</div>${box('Execution Stability',`Delivery stability is assessed at ${d.delivery}%.`)}${box('Monitoring Exposure',`Monitoring reliability is assessed at ${d.monitoring}%.`)}${box('Escalation Risk',`Escalation readiness is assessed at ${d.escalation}%.`)}${box('Traceability Integrity',`C6 traceability is assessed at ${d.comps[5]}%.`)}</div></div>
<div class="grid3"><div class="card"><div class="section-title">Operational Mapping Chain</div><div class="chain"><div class="node active"><b>🏛️ National Strategy</b></div><div class="arrow">➜</div><div class="node"><b>📄 Policy Layer</b></div><div class="arrow">➜</div><div class="node"><b>📦 Programme Layer</b></div><div class="arrow">➜</div><div class="node"><b>⚙️ Action Layer</b></div></div></div><div class="card">${gauge('Governance Certification Readiness',d.certification)}</div><div class="card"><div class="section-title">Escalation Signals</div>${box('Strongest Operational Propagation',`${d.strongest.name} — ${d.strongest.score}%`)}${box('Weakest Operational Propagation',`${d.weakestProgramme.name} — ${d.weakestProgramme.score}%`)}<span class="tag">🟠 ${safe(d.risk)}</span></div></div>
<div class="card exposure"><div class="section-title">⚠️ Operational Governance Exposure</div><div class="exposure-grid"><div class="exposure-item"><b>Monitoring Dependency</b><strong style="color:${scoreColor(d.monitoring)}">${scoreLabel(d.monitoring)}</strong></div><div class="exposure-item"><b>Escalation Bottleneck</b><strong style="color:${scoreColor(d.escalation)}">${scoreLabel(d.escalation)}</strong></div><div class="exposure-item"><b>Operational Continuity</b><strong style="color:${scoreColor(d.delivery)}">${scoreLabel(d.delivery)}</strong></div><div class="exposure-item"><b>Reporting Stability</b><strong style="color:${scoreColor(d.comps[5])}">${scoreLabel(d.comps[5])}</strong></div></div><span class="tag">📡 Dynamic record: ${safe(d.recordId || d.id)}</span><span class="tag">📄 ${safe(d.docs[0] || 'No source document listed')}</span></div>
<div class="grid2"><div class="card"><div class="section-title">Linked Programme Operational Benchmarking</div><table class="table"><tr><th>#</th><th>Programme</th><th>Operational Governance</th><th>Status</th></tr>${d.programmes.map((p,i)=>`<tr><td>${i+1}</td><td>${safe(p.name)}</td><td>${p.score}%</td><td><span class="status ${statusClass(p.score)}">${safe(p.status)}</span></td></tr>`).join('')}</table></div><div class="card"><div class="section-title">Operational Governance Synthesis</div>${box('Executive Summary',d.summary)}${box('Decision-Maker Brief',d.brief)}${box('Key Risk',d.risk)}${box('Main Recommendation',d.recommendation)}${box('Reviewer Focus',`Review operational continuity, monitoring reliability, escalation closure and traceability evidence for ${d.name}.`)}</div></div>
</div></body></html>`;
}

async function render(req, res) {
  try {
    const id = recordIdFrom(req);
    let rec = null;
    let programmes = [];
    let policies = [];
    if (id) {
      rec = await getRecord(NAT_TABLE, id);
      const f = rec?.fields || {};
      programmes = await getLinked(PROG_TABLE, raw(f, ['Programs', 'Programmes', 'Linked Programs', 'Linked Programmes']));
      policies = await getLinked(POLICY_TABLE, raw(f, ['Policies', 'Linked Policies']));
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(renderDashboard(build(rec, programmes, policies)));
  } catch (e) {
    res.status(500).send('Dashboard error: ' + safe(e.message));
  }
}

app.get('/', render);
app.get('/api', render);
app.get('/api/:recordId', render);
export default app;
