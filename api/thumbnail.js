import express from 'express';

const app = express();

const KEY = process.env.AIRTABLE_API_KEY || process.env.AIRTABLE || '';
const BASE = process.env.AIRTABLE_BASE_ID || '';
const NAT_TABLE = process.env.AIRTABLE_NATIONAL_STRATEGIES_TABLE || 'National Strategies';

function safe(v) {
  return String(v ?? '').replace(/[&<>\"]/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;'
  }[s]));
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

function color(v) {
  return v >= 80 ? '#16a34a' : v >= 60 ? '#2563eb' : v >= 40 ? '#f97316' : '#dc2626';
}

function label(v) {
  return v >= 80 ? 'Strong' : v >= 60 ? 'Moderate' : v >= 40 ? 'Fragile' : 'Critical';
}

async function getRecord(table, id) {
  if (!KEY || !BASE || !id) return null;
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}/${id}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function metricBlock(x, y, title, value) {
  const v = pct(value);
  const c = color(v);
  return `
    <rect x="${x}" y="${y}" width="250" height="120" rx="18" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="${x + 22}" y="${y + 34}" font-size="16" font-weight="700" fill="#475569">${safe(title)}</text>
    <text x="${x + 22}" y="${y + 82}" font-size="42" font-weight="900" fill="${c}">${v}%</text>
    <text x="${x + 135}" y="${y + 82}" font-size="16" font-weight="800" fill="${c}">${label(v)}</text>
  `;
}

function bar(x, y, title, value) {
  const v = pct(value);
  const c = color(v);
  return `
    <text x="${x}" y="${y}" font-size="16" font-weight="800" fill="#0f172a">${safe(title)}</text>
    <rect x="${x}" y="${y + 12}" width="430" height="12" rx="6" fill="#e5e7eb"/>
    <rect x="${x}" y="${y + 12}" width="${Math.round(430 * v / 100)}" height="12" rx="6" fill="${c}"/>
    <text x="${x + 450}" y="${y + 24}" font-size="16" font-weight="900" fill="${c}">${v}%</text>
  `;
}

function buildSvg(record) {
  const f = record?.fields || {};
  const c1 = pct(raw(f, ['C1 Score', 'C1 National Operational Governance Score', 'C1 National Strategy Coherence Score', 'C1 Policy Governance']), 0);
  const c2 = pct(raw(f, ['C2 Score', 'C2 National Operational Governance Score', 'C2 National Strategy Coherence Score', 'C2 Policy Governance']), 0);
  const c3 = pct(raw(f, ['C3 Score', 'C3 National Operational Governance Score', 'C3 National Strategy Coherence Score', 'C3 Policy Governance']), 0);
  const c4 = pct(raw(f, ['C4 Score', 'Monitoring Reliability', 'C4 National Operational Governance Score', 'C4 National Strategy Coherence Score']), 0);
  const c5 = pct(raw(f, ['C5 Score', 'Escalation Readiness', 'C5 National Operational Governance Score', 'C5 National Strategy Coherence Score']), 0);
  const c6 = pct(raw(f, ['C6 Score', 'Traceability Score', 'C6 National Operational Governance Score', 'C6 National Strategy Coherence Score']), 0);
  const overall = pct(raw(f, ['Operational Governance Score', 'National Operational Governance Score', 'Overall Coherence Score', 'Governance Intelligence Score']), avg([c1, c2, c3, c4, c5, c6], 0));
  const ociD = pct(raw(f, ['OCI-D', 'Design Coherence', 'Strategic Coherence Score']), avg([c1, c2, c3], overall));
  const ociO = pct(raw(f, ['OCI-O', 'Operational Coherence', 'Execution Coherence Score']), avg([c4, c5, c6], overall));
  const weakest = [['C1', c1], ['C2', c2], ['C3', c3], ['C4', c4], ['C5', c5], ['C6', c6]].sort((a, b) => a[1] - b[1])[0];

  const name = pick(f, ['Strategy Name', 'Policy Name', 'Name'], 'National Governance Dashboard');
  const country = pick(f, ['Country'], 'Ghana');
  const owner = pick(f, ['Issuing Authority', 'Owner', 'Responsible Institution'], 'National owner');
  const summary = pick(f, ['AI Executive Summary', 'Executive Governance Narrative', 'Governance Intelligence Summary'], 'Operational governance snapshot generated from the selected Airtable record.');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.12"/></filter>
  </defs>
  <rect width="1280" height="720" fill="#f3f6fb"/>
  <rect x="36" y="34" width="1208" height="652" rx="28" fill="#ffffff" stroke="#e2e8f0" filter="url(#shadow)"/>
  <text x="72" y="78" font-size="18" font-weight="900" fill="#4f46e5">National Strategy Governance Dashboard</text>
  <text x="72" y="128" font-size="40" font-weight="900" fill="#0f172a">${safe(name)}</text>
  <text x="72" y="164" font-size="20" font-weight="700" fill="#64748b">${safe(country)} • ${safe(owner)} • Updated ${new Date().toLocaleDateString()}</text>

  ${metricBlock(72, 208, 'Overall Governance', overall)}
  ${metricBlock(342, 208, 'Design Coherence', ociD)}
  ${metricBlock(612, 208, 'Operational Coherence', ociO)}
  ${metricBlock(882, 208, `Weakest Component ${weakest[0]}`, weakest[1])}

  <rect x="72" y="370" width="610" height="238" rx="20" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="102" y="414" font-size="24" font-weight="900" fill="#0f172a">Component Performance</text>
  ${bar(102, 455, 'C1 Policy Alignment', c1)}
  ${bar(102, 500, 'C2 Instrument Embedding', c2)}
  ${bar(102, 545, 'C3 Resource Alignment', c3)}
  ${bar(102, 590, 'C4 Monitoring System', c4)}
  ${bar(102, 635, 'C5 Trigger & Escalation', c5)}

  <rect x="716" y="370" width="492" height="238" rx="20" fill="#eef2ff" stroke="#c7d2fe"/>
  <text x="746" y="414" font-size="24" font-weight="900" fill="#0f172a">Governance Synthesis</text>
  <foreignObject x="746" y="438" width="420" height="112">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:18px;line-height:1.4;color:#334155;font-weight:600;">
      ${safe(summary).slice(0, 260)}${safe(summary).length > 260 ? '…' : ''}
    </div>
  </foreignObject>
  <text x="746" y="585" font-size="18" font-weight="900" fill="#4f46e5">Use this URL as a direct image thumbnail in Stacker.</text>
</svg>`;
}

async function renderThumbnail(req, res) {
  try {
    const id = recordIdFrom(req);
    const rec = id ? await getRecord(NAT_TABLE, id) : null;
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.send(buildSvg(rec));
  } catch (e) {
    res.status(500).setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#fff1f2"/><text x="60" y="100" font-size="32" font-family="Arial" fill="#991b1b">Thumbnail error</text><text x="60" y="150" font-size="20" font-family="Arial" fill="#7f1d1d">${safe(e.message)}</text></svg>`);
  }
}

app.get('/', renderThumbnail);
app.get('/thumbnail', renderThumbnail);
app.get('/api/thumbnail', renderThumbnail);
app.get('/api/thumbnail/:recordId', renderThumbnail);
app.get('/:recordId', renderThumbnail);

export default app;
