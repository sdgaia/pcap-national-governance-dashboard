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

function exposureColor(v) {
  return v <= 20 ? '#16a34a' : v <= 40 ? '#2563eb' : v <= 60 ? '#f97316' : '#dc2626';
}

function label(v) {
  return v >= 80 ? 'Strong' : v >= 60 ? 'Moderate' : v >= 40 ? 'Fragile' : 'Critical';
}

function exposureLabel(v) {
  return v <= 20 ? 'Low' : v <= 40 ? 'Moderate' : v <= 60 ? 'High' : 'Severe';
}

async function getRecord(table, id) {
  if (!KEY || !BASE || !id) return null;
  const url = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}/${id}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function metricBlock(x, y, title, value, exposure = false) {
  const v = pct(value);
  const c = exposure ? exposureColor(v) : color(v);
  const lbl = exposure ? exposureLabel(v) : label(v);
  return `
    <rect x="${x}" y="${y}" width="250" height="116" rx="18" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="${x + 20}" y="${y + 32}" font-size="15" font-weight="800" fill="#475569">${safe(title)}</text>
    <text x="${x + 20}" y="${y + 78}" font-size="39" font-weight="900" fill="${c}">${v}%</text>
    <text x="${x + 132}" y="${y + 78}" font-size="15" font-weight="900" fill="${c}">${lbl}</text>
  `;
}

function bar(x, y, title, value, w = 470) {
  const v = pct(value);
  const c = color(v);
  return `
    <text x="${x}" y="${y}" font-size="15" font-weight="850" fill="#0f172a">${safe(title)}</text>
    <rect x="${x}" y="${y + 13}" width="${w}" height="12" rx="6" fill="#e5e7eb"/>
    <rect x="${x}" y="${y + 13}" width="${Math.round(w * v / 100)}" height="12" rx="6" fill="${c}"/>
    <text x="${x + w + 18}" y="${y + 25}" font-size="15" font-weight="900" fill="${c}">${v}%</text>
  `;
}

function smallBox(x, y, title, body, w = 250, h = 88) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#ffffff" stroke="#e2e8f0"/>
    <text x="${x + 18}" y="${y + 30}" font-size="15" font-weight="900" fill="#0f172a">${safe(title)}</text>
    <foreignObject x="${x + 18}" y="${y + 42}" width="${w - 36}" height="${h - 48}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:13px;line-height:1.35;color:#475569;font-weight:650;overflow:hidden;">
        ${safe(body)}
      </div>
    </foreignObject>
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
  const fragmentation = Math.max(0, Math.min(100, Math.round((100 - c4) * .45 + (100 - c5) * .35 + (100 - ociO) * .2)));
  const weakest = [['C1 Policy Alignment', c1], ['C2 Instrument Embedding', c2], ['C3 Resource Alignment', c3], ['C4 Monitoring System', c4], ['C5 Trigger & Escalation', c5], ['C6 Traceability', c6]].sort((a, b) => a[1] - b[1])[0];

  const name = pick(f, ['Strategy Name', 'Policy Name', 'Name'], 'National Governance Dashboard');
  const country = pick(f, ['Country'], 'Ghana');
  const owner = pick(f, ['Issuing Authority', 'Owner', 'Responsible Institution'], 'National owner');
  const strategyId = pick(f, ['Strategy ID', 'ID', 'Policy ID'], record?.id || '-');
  const summary = pick(f, ['AI Executive Summary', 'Executive Governance Narrative', 'Governance Intelligence Summary'], 'Operational governance snapshot generated from the selected Airtable record.');
  const diagnosis = pick(f, ['Policy Diagnosis', 'Operational Coherence Diagnosis', 'AI Key Risk'], 'Review policy alignment, monitoring reliability, escalation readiness and auditability evidence.');
  const recommendation = pick(f, ['AI Main Recommendation', 'Priority Intervention Narrative'], 'Strengthen monitoring reliability, escalation closure and traceability evidence.');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1180" viewBox="0 0 1280 1180">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.12"/></filter>
    <linearGradient id="soft" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f8fafc"/><stop offset="1" stop-color="#eef2ff"/></linearGradient>
  </defs>
  <rect width="1280" height="1180" fill="#f3f6fb"/>
  <rect x="34" y="28" width="1212" height="1126" rx="28" fill="#ffffff" stroke="#e2e8f0" filter="url(#shadow)"/>

  <text x="72" y="74" font-size="17" font-weight="900" fill="#4f46e5">National Strategy Governance Dashboard</text>
  <text x="72" y="125" font-size="38" font-weight="900" fill="#0f172a">${safe(name)}</text>
  <text x="72" y="160" font-size="19" font-weight="750" fill="#64748b">${safe(strategyId)} • ${safe(country)} • ${safe(owner)} • Updated ${new Date().toLocaleDateString()}</text>

  ${metricBlock(72, 202, 'Overall Governance', overall)}
  ${metricBlock(344, 202, 'Design Coherence', ociD)}
  ${metricBlock(616, 202, 'Operational Coherence', ociO)}
  ${metricBlock(888, 202, `Weakest ${weakest[0].split(' ')[0]}`, weakest[1])}

  <rect x="72" y="356" width="540" height="310" rx="20" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="102" y="402" font-size="24" font-weight="900" fill="#0f172a">OCAM Component Performance</text>
  ${bar(102, 446, 'C1 Policy Alignment', c1, 380)}
  ${bar(102, 491, 'C2 Instrument Embedding', c2, 380)}
  ${bar(102, 536, 'C3 Resource Alignment', c3, 380)}
  ${bar(102, 581, 'C4 Monitoring System', c4, 380)}
  ${bar(102, 626, 'C5 Trigger & Escalation', c5, 380)}

  <rect x="646" y="356" width="562" height="310" rx="20" fill="#eef2ff" stroke="#c7d2fe"/>
  <text x="676" y="402" font-size="24" font-weight="900" fill="#0f172a">Governance Synthesis</text>
  <foreignObject x="676" y="425" width="500" height="155">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:18px;line-height:1.42;color:#334155;font-weight:650;overflow:hidden;">
      ${safe(summary).slice(0, 520)}${safe(summary).length > 520 ? '…' : ''}
    </div>
  </foreignObject>
  <text x="676" y="620" font-size="17" font-weight="900" fill="#4f46e5">Full-dashboard image preview generated for Stacker.</text>

  <rect x="72" y="700" width="1136" height="138" rx="20" fill="url(#soft)" stroke="#dbeafe"/>
  <text x="102" y="742" font-size="23" font-weight="900" fill="#0f172a">Operational Governance Chain</text>
  <rect x="102" y="770" width="210" height="42" rx="12" fill="#dbeafe" stroke="#bfdbfe"/><text x="126" y="797" font-size="16" font-weight="900" fill="#1e3a8a">National Strategy</text>
  <text x="335" y="798" font-size="26" font-weight="900" fill="#2563eb">➜</text>
  <rect x="378" y="770" width="190" height="42" rx="12" fill="#fff" stroke="#bfdbfe"/><text x="420" y="797" font-size="16" font-weight="900" fill="#1e3a8a">Policy Layer</text>
  <text x="590" y="798" font-size="26" font-weight="900" fill="#2563eb">➜</text>
  <rect x="633" y="770" width="210" height="42" rx="12" fill="#fff" stroke="#bfdbfe"/><text x="670" y="797" font-size="16" font-weight="900" fill="#1e3a8a">Programme Layer</text>
  <text x="866" y="798" font-size="26" font-weight="900" fill="#2563eb">➜</text>
  <rect x="909" y="770" width="210" height="42" rx="12" fill="#fff" stroke="#bfdbfe"/><text x="955" y="797" font-size="16" font-weight="900" fill="#1e3a8a">Action Layer</text>

  <rect x="72" y="872" width="364" height="208" rx="20" fill="#fff7ed" stroke="#fed7aa"/>
  <text x="102" y="916" font-size="23" font-weight="900" fill="#0f172a">Governance Exposure</text>
  <text x="102" y="966" font-size="46" font-weight="900" fill="${exposureColor(fragmentation)}">${fragmentation}%</text>
  <text x="240" y="965" font-size="18" font-weight="900" fill="${exposureColor(fragmentation)}">${exposureLabel(fragmentation)} Exposure</text>
  <text x="102" y="1018" font-size="16" font-weight="800" fill="#475569">Monitoring ${c4}% • Escalation ${c5}% • Traceability ${c6}%</text>

  <rect x="458" y="872" width="350" height="208" rx="20" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="488" y="916" font-size="23" font-weight="900" fill="#0f172a">Priority Diagnosis</text>
  <foreignObject x="488" y="940" width="290" height="104">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:16px;line-height:1.38;color:#475569;font-weight:650;overflow:hidden;">
      ${safe(diagnosis).slice(0, 260)}${safe(diagnosis).length > 260 ? '…' : ''}
    </div>
  </foreignObject>

  <rect x="830" y="872" width="378" height="208" rx="20" fill="#ffffff" stroke="#e2e8f0"/>
  <text x="860" y="916" font-size="23" font-weight="900" fill="#0f172a">Recommended Action</text>
  <foreignObject x="860" y="940" width="318" height="104">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;font-size:16px;line-height:1.38;color:#475569;font-weight:650;overflow:hidden;">
      ${safe(recommendation).slice(0, 290)}${safe(recommendation).length > 290 ? '…' : ''}
    </div>
  </foreignObject>

  ${smallBox(72, 1102, 'Dashboard Mode', 'Full governance thumbnail preview', 250, 36)}
  <text x="970" y="1126" font-size="13" font-weight="800" fill="#94a3b8">PCAP / OCAM</text>
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
