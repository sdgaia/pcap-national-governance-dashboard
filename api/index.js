import express from 'express';

const app = express();

const KEY = process.env.AIRTABLE_API_KEY || '';
const BASE = process.env.AIRTABLE_BASE_ID || '';
const NAT_TABLE = process.env.AIRTABLE_NATIONAL_STRATEGIES_TABLE || 'National Strategies';
const SEC_TABLE = process.env.AIRTABLE_SECTORAL_STRATEGIES_TABLE || 'Sectoral Strategies';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function pick(fields, names, fallback = '') {
  for (const name of names) {
    const value = fields?.[name];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function asText(fields, names, fallback = 'Not specified') {
  const value = pick(fields, names, fallback);
  if (Array.isArray(value)) {
    return value.map(v => typeof v === 'object' ? (v.name || v.id || '') : v).filter(Boolean).join(', ') || fallback;
  }
  if (typeof value === 'object' && value?.name) return value.name;
  return String(value || fallback);
}

function asNumber(fields, names, fallback = 0) {
  const value = pick(fields, names, fallback);
  const raw = Array.isArray(value) ? value[0] : value;
  const cleaned = String(raw ?? '').replace('%', '').trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return fallback;
  return n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
}

function label(score) {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Fragile';
  return 'Critical';
}

function color(score) {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#2563eb';
  if (score >= 40) return '#f97316';
  return '#dc2626';
}

async function airtableGet(table, id) {
  if (!KEY || !BASE || !id) return null;
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}/${id}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!response.ok) throw new Error(`Airtable ${response.status}: ${await response.text()}`);
  return response.json();
}

async function airtableLinked(table, ids) {
  if (!Array.isArray(ids)) return [];
  const output = [];
  for (const id of ids.slice(0, 12)) {
    try {
      const record = await airtableGet(table, id);
      if (record) output.push(record);
    } catch (_) {}
  }
  return output;
}

function buildData(record, sectorRecords) {
  const f = record?.fields || {};
  const components = [
    asNumber(f, ['C1 Policy Governance', 'C1 Score'], 58),
    asNumber(f, ['C2 Instrument Governance', 'C2 Policy Governance', 'C2 Score'], 26),
    asNumber(f, ['C3 Resource Governance', 'C3 Policy Governance', 'C3 Score'], 54),
    asNumber(f, ['C4 Monitoring Governance', 'C4 Policy Governance', 'C4 Score'], 10),
    asNumber(f, ['C5 Escalation Governance', 'C5 Policy Governance', 'C5 Score'], 49),
    asNumber(f, ['C6 Traceability Governance', 'C6 Policy Governance', 'C6 Score'], 74)
  ];
  const average = Math.round(components.reduce((a, b) => a + b, 0) / components.length);
  const sectors = (sectorRecords || []).map((r, i) => {
    const sf = r.fields || {};
    const vals = [
      asNumber(sf, ['C1 Policy Governance'], 0),
      asNumber(sf, ['C2 Policy Governance'], 0),
      asNumber(sf, ['C3 Policy Governance'], 0),
      asNumber(sf, ['C4 Policy Governance'], 0),
      asNumber(sf, ['C5 Policy Governance'], 0),
      asNumber(sf, ['C6 Policy Governance'], 0)
    ];
    const realVals = vals.filter(v => v > 0);
    const score = asNumber(sf, ['Overall Coherence Score', 'National Strategy Recursive Governance Score'], realVals.length ? Math.round(realVals.reduce((a,b)=>a+b,0)/realVals.length) : 0);
    return { name: asText(sf, ['Strategy Name', 'Sector Strategy ID', 'Name'], `Sectoral Strategy ${i + 1}`), vals, score, status: label(score) };
  }).filter(s => s.score > 0).sort((a, b) => a.score - b.score);

  return {
    id: asText(f, ['ID', 'Strategy ID'], record?.id || 'NS'),
    name: asText(f, ['Strategy Name', 'Name'], 'National Strategy'),
    country: asText(f, ['Country'], 'Ghana'),
    score: asNumber(f, ['National Strategy Recursive Governance Score', 'OVERALL Coherence Score', 'Overall Coherence Score'], average),
    drift: asNumber(f, ['Governance Drift'], 10),
    monitoring: asNumber(f, ['Monitoring Reliability'], components[3]),
    escalation: asNumber(f, ['Escalation Readiness'], components[4]),
    escalated: asNumber(f, ['Escalated Actions'], 9),
    components,
    sectors: sectors.length ? sectors : [
      { name: 'Health', vals: [85,80,65,70,80,75], score: 79, status: 'Moderate' },
      { name: 'Education', vals: [80,75,60,65,75,70], score: 71, status: 'Moderate' },
      { name: 'Agriculture', vals: [75,70,50,55,70,65], score: 64, status: 'Moderate' },
      { name: 'Energy', vals: [70,65,45,50,60,60], score: 58, status: 'Fragile' },
      { name: 'Transport', vals: [65,60,40,45,55,55], score: 53, status: 'Fragile' }
    ],
    diagnosis: [
      asText(f, ['Policy Diagnosis'], 'National strategy design requires stronger implementation discipline.'),
      asText(f, ['Monitoring Diagnosis'], 'Monitoring reliability requires continued strengthening.'),
      asText(f, ['Escalation Diagnosis'], 'Corrective pathways require stronger closure discipline.'),
      asText(f, ['Auditability Diagnosis'], 'Documentation is broadly adequate but requires stronger evidence linkage.')
    ]
  };
}

function gauge(title, value, display, sub, gaugeColor, scale = '100%') {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return `<div class="card kpi"><h3>${esc(title)} <span class="info">i</span></h3><div class="semi" style="--v:${v};--c:${gaugeColor}"><div class="gnum">${esc(display)}</div><div class="glabel">${esc(sub)}</div></div><div class="scale"><span>0%</span><span>${scale}</span></div></div>`;
}

function bar(name, value) {
  return `<div class="bar"><b>${esc(name)}</b><div class="track"><div class="fill" style="width:${value}%;background:${color(value)}"></div></div><strong>${value}%</strong></div>`;
}

function smallGauge(value) {
  return `<span class="sg" style="--v:${value};--c:${color(value)}"></span><br>${value}%`;
}

function badge(status) {
  const cls = status === 'Strong' ? 'green' : status === 'Moderate' ? 'blue' : status === 'Fragile' ? 'orange' : 'red';
  return `<span class="badge ${cls}">${esc(status)}</span>`;
}

function sectorRow(s, i) {
  return `<tr><td>${i + 1}</td><td>${esc(s.name)}</td>${s.vals.map(v => `<td>${smallGauge(v)}</td>`).join('')}<td class="score" style="color:${color(s.score)}">${s.score}%</td><td>${badge(s.status)}</td></tr>`;
}

function radar(c) {
  const pts = [
    [0, -1.35 * c[0]], [1.17 * c[1], -0.67 * c[1]], [1.17 * c[2], 0.67 * c[2]],
    [0, 1.35 * c[3]], [-1.17 * c[4], 0.67 * c[4]], [-1.17 * c[5], -0.67 * c[5]]
  ].map(p => p.join(',')).join(' ');
  return `<svg viewBox="0 0 420 350" width="100%" height="320"><g transform="translate(210 170)"><polygon points="0,-135 117,-67 117,67 0,135 -117,67 -117,-67" fill="none" stroke="#cbd5e1"/><polygon points="0,-101 88,-50 88,50 0,101 -88,50 -88,-50" fill="none" stroke="#dbe3ef"/><polygon points="0,-68 59,-34 59,34 0,68 -59,34 -59,-34" fill="none" stroke="#dbe3ef"/><polygon points="0,-34 29,-17 29,17 0,34 -29,17 -29,-17" fill="none" stroke="#dbe3ef"/><polygon points="${pts}" fill="rgba(37,99,235,.15)" stroke="#2563eb" stroke-width="4"/><text x="0" y="-154" text-anchor="middle">C1 Policy</text><text x="145" y="-70" text-anchor="middle">C2 Instrument</text><text x="145" y="82" text-anchor="middle">C3 Resource</text><text x="0" y="163" text-anchor="middle">C4 Monitoring</text><text x="-145" y="82" text-anchor="middle">C5 Escalation</text><text x="-145" y="-70" text-anchor="middle">C6 Traceability</text></g></svg>`;
}

function mini(title, value) {
  return `<div class="mini"><h4>${esc(title)}</h4><div class="semi smallsemi" style="--v:${value};--c:${color(value)}"><div class="gnum smallnum">${value}%</div><div class="glabel smalllabel">${label(value)}</div></div></div>`;
}

function render(d) {
  const names = ['C1 Policy Governance','C2 Instrument Governance','C3 Resource Governance','C4 Monitoring Governance','C5 Escalation Governance','C6 Traceability Governance'];
  const weakest = Math.min(...d.components);
  const weakestIndex = d.components.indexOf(weakest);
  const driftColor = d.drift > 25 ? '#dc2626' : d.drift > 10 ? '#f97316' : '#16a34a';
  const escalatedColor = d.escalated > 25 ? '#dc2626' : d.escalated > 10 ? '#f97316' : '#16a34a';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>PCAP National Operational Governance Dashboard</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#0b1533;padding:14px}.wrap{max-width:1880px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:20px;box-shadow:0 8px 28px rgba(15,23,42,.05)}.top{display:flex;justify-content:space-between;gap:20px}.title{font-size:36px;font-weight:900;letter-spacing:-.5px}.sub{margin-top:8px;color:#64748b;font-size:15px}.grid5{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:18px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.bottom{display:grid;grid-template-columns:1.35fr 1fr;gap:12px;margin-top:12px}.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;box-shadow:0 3px 16px rgba(15,23,42,.035)}h3{margin:0 0 12px;font-size:16px}.info{display:inline-flex;width:16px;height:16px;border:1px solid #94a3b8;border-radius:50%;font-size:11px;align-items:center;justify-content:center;color:#64748b}.kpi{height:220px}.semi{width:245px;height:122px;position:relative;overflow:hidden;margin:10px auto 0}.semi:before{content:"";position:absolute;width:245px;height:245px;border-radius:50%;background:conic-gradient(from 270deg,var(--c) calc(var(--v)*1.8deg),#e5e7eb 0 180deg,transparent 0)}.semi:after{content:"";position:absolute;left:38px;top:38px;width:169px;height:169px;border-radius:50%;background:#fff}.gnum{position:absolute;top:54px;left:0;right:0;text-align:center;font-size:34px;font-weight:900;color:var(--c);z-index:1}.glabel{position:absolute;top:94px;left:0;right:0;text-align:center;font-size:13px;font-weight:900;color:var(--c);z-index:1}.scale{display:flex;justify-content:space-between;font-size:12px}.radarblock{display:grid;grid-template-columns:54% 46%;gap:12px;align-items:center}.bar{display:grid;grid-template-columns:205px 1fr 45px;gap:12px;align-items:center;margin:14px 0}.track{height:8px;background:#e5e7eb;border-radius:99px;overflow:hidden}.fill{height:8px;border-radius:99px}.weak{margin-top:18px;border:1px solid #fecaca;background:#fff1f2;color:#b91c1c;border-radius:8px;padding:12px;font-size:13px;font-weight:900;display:flex;justify-content:space-between}.pill{background:#dc2626;color:#fff;border-radius:99px;padding:7px 12px}.halfgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.mini h4{text-align:center;margin:0;font-size:14px}.smallsemi{width:185px;height:92px}.smallsemi:before{width:185px;height:185px}.smallsemi:after{left:29px;top:29px;width:127px;height:127px}.smallnum{top:42px;font-size:27px}.smalllabel{top:74px;font-size:12px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #e5e7eb;padding:9px;text-align:center}th{background:#f8fafc}td:nth-child(2){text-align:left;font-weight:800}.sg{width:50px;height:25px;display:inline-block;position:relative;overflow:hidden}.sg:before{content:"";position:absolute;width:50px;height:50px;border-radius:50%;background:conic-gradient(from 270deg,var(--c) calc(var(--v)*1.8deg),#e5e7eb 0 180deg,transparent 0)}.sg:after{content:"";position:absolute;left:10px;top:10px;width:30px;height:30px;border-radius:50%;background:#fff}.score{font-size:16px;font-weight:900}.badge{border-radius:999px;padding:6px 10px;font-weight:800}.green{background:#ecfdf5;color:#166534}.blue{background:#eff6ff;color:#1d4ed8}.orange{background:#fff7ed;color:#ea580c}.red{background:#fff1f2;color:#b91c1c}.synth p{font-size:13px;line-height:1.45}.note{margin-top:14px;color:#64748b;font-size:12px}@media(max-width:1200px){.grid5,.grid2,.bottom,.radarblock,.halfgrid{grid-template-columns:1fr}.top{display:block}}</style></head><body><div class="wrap"><div class="top"><div><div class="title">PCAP National Operational Governance Dashboard</div><div class="sub">${esc(d.id)} — ${esc(d.name)} • ${esc(d.country)} • Operational Governance View</div></div><div>Updated • ${new Date().toLocaleDateString()}</div></div><div class="grid5">${gauge('Operational Governance Score',d.score,d.score + '%',label(d.score),color(d.score))}${gauge('Governance Drift',d.drift,d.drift + '%',d.drift > 25 ? 'High' : d.drift > 10 ? 'Moderate' : 'Low',driftColor)}${gauge('Monitoring Reliability',d.monitoring,d.monitoring + '%',label(d.monitoring),color(d.monitoring))}${gauge('Escalation Readiness',d.escalation,d.escalation + '%',label(d.escalation),color(d.escalation))}${gauge('Escalated Actions',Math.min(100,d.escalated*2),d.escalated,d.escalated > 25 ? 'High Priority' : d.escalated > 10 ? 'Moderate' : 'Low',escalatedColor,'50+')}</div><div class="grid2"><div class="card"><h3>Operational Governance Components (C1–C6)</h3><div class="radarblock"><div>${radar(d.components)}</div><div>${names.map((n,i)=>bar(n,d.components[i])).join('')}<div class="weak"><span>Weakest Operational Layer<br>${esc(names[weakestIndex])}</span><span class="pill">${weakest}%</span></div></div></div></div><div class="card"><h3>Operational Governance Intelligence</h3><div class="halfgrid">${names.map((n,i)=>mini(n,d.components[i])).join('')}</div></div></div><div class="bottom"><div class="card"><h3>Sectoral Operational Governance Benchmarking</h3><table><thead><tr><th>#</th><th>Sectoral Strategy</th><th>C1</th><th>C2</th><th>C3</th><th>C4</th><th>C5</th><th>C6</th><th>Overall</th><th>Status</th></tr></thead><tbody>${d.sectors.map(sectorRow).join('')}</tbody></table></div><div class="card synth"><h3>Operational Governance Synthesis</h3>${d.diagnosis.map(x=>`<p>• ${esc(x)}</p>`).join('')}<p><b>Weakest operational layer:</b> ${esc(names[weakestIndex])} (${weakest}%).</p><p><b>Priority:</b> strengthen monitoring, escalation closure and the weakest operational component before next review cycle.</p></div></div><div class="note">Operational governance only. Strategic / referential intelligence is handled in the separate Governance Intelligence Dashboard.</div></div></body></html>`;
}

async function handle(req, res) {
  try {
    const recordId = String(req.query.recordId || '').trim();
    let record = null;
    let sectorRecords = [];
    if (recordId) {
      record = await airtableGet(NAT_TABLE, recordId);
      const f = record?.fields || {};
      sectorRecords = await airtableLinked(SEC_TABLE, f['Sectoral Strategies'] || f['Linked Sectoral Strategies'] || []);
    }
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(render(buildData(record, sectorRecords)));
  } catch (error) {
    res.status(500).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<pre>Operational Governance Dashboard error: ${esc(error.message)}</pre>`);
  }
}

app.get('/', handle);
app.get('/api', handle);

export default app;
