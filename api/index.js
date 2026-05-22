import express from 'express';

const app = express();

function html() {
  return `<!DOCTYPE html>
<html>
<head>
  <title>PCAP National Governance Dashboard</title>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root{--navy:#0b1533;--muted:#64748b;--line:#e5e7eb;--bg:#f5f7fb;--green:#16a34a;--blue:#2563eb;--orange:#f97316;--red:#dc2626;--purple:#6d40d8;--teal:#14b8a6}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);font-family:Arial,Helvetica,sans-serif;color:var(--navy);padding:14px}.shell{max-width:1880px;margin:0 auto;background:white;border:1px solid var(--line);border-radius:12px;padding:20px;box-shadow:0 8px 28px rgba(15,23,42,.05)}
    .top{display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{display:flex;align-items:center;gap:18px}.crest{width:62px;height:72px;border-radius:16px;background:linear-gradient(145deg,#0f172a,#1e40af);display:grid;place-items:center;color:#fff;font-size:34px;box-shadow:inset 0 0 0 4px #eaf2ff}.title{font-size:34px;font-weight:900;letter-spacing:-.5px}.subtitle{margin-top:8px;color:#475569;font-size:15px}.actions{display:flex;align-items:center;gap:18px;color:#334155;font-size:14px}.btn{border:1px solid #d1d5db;background:#f8fafc;border-radius:10px;padding:12px 18px;font-weight:800;color:#0f172a}
    .grid5{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:18px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.grid-bottom{display:grid;grid-template-columns:1.45fr .95fr;gap:12px;margin-top:12px}.card{background:white;border:1px solid var(--line);border-radius:10px;padding:16px;box-shadow:0 3px 16px rgba(15,23,42,.04)}.card h3{margin:0 0 12px;font-size:16px}.info{display:inline-flex;width:17px;height:17px;border:1px solid #94a3b8;border-radius:50%;align-items:center;justify-content:center;font-size:11px;color:#64748b;margin-left:6px}
    .gauge{height:166px;display:grid;place-items:center}.semi{width:245px;height:122px;position:relative;overflow:hidden}.semi:before{content:"";position:absolute;inset:0 0 auto 0;width:245px;height:245px;border-radius:50%;background:conic-gradient(from 270deg,var(--c) calc(var(--v)*1.8deg),#e5e7eb 0 180deg,transparent 0)}.semi:after{content:"";position:absolute;left:38px;top:38px;width:169px;height:169px;border-radius:50%;background:white}.gnum{position:absolute;left:0;right:0;top:54px;text-align:center;font-size:34px;font-weight:900;color:var(--c);z-index:1}.glabel{position:absolute;left:0;right:0;top:94px;text-align:center;font-size:13px;font-weight:900;color:var(--c);z-index:1}.scale{display:flex;justify-content:space-between;margin-top:2px;font-size:12px;color:#0f172a}.metric-title{text-align:center;font-size:15px;font-weight:900;min-height:36px}.metric-sub{text-align:center;font-size:12px;color:#475569;font-weight:800;margin-top:4px}
    .main-panel{display:grid;grid-template-columns:1fr 1fr;gap:18px}.radar-wrap{display:grid;grid-template-columns:54% 46%;gap:10px;align-items:center}.bars{padding:8px 8px 0}.bar{display:grid;grid-template-columns:210px 1fr 45px;gap:12px;align-items:center;margin:14px 0}.bar b{font-size:13px}.bar-track{height:7px;background:#e5e7eb;border-radius:99px;overflow:hidden}.bar-fill{height:7px;border-radius:99px;background:var(--c);width:var(--w)}.weak{margin-top:18px;border:1px solid #fecaca;background:#fff1f2;color:#b91c1c;border-radius:8px;padding:12px;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:space-between}.pill{border-radius:999px;padding:7px 12px;background:#dc2626;color:white}
    .halfgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.mini .semi{width:190px;height:95px}.mini .semi:before{width:190px;height:190px}.mini .semi:after{left:30px;top:30px;width:130px;height:130px}.mini .gnum{top:44px;font-size:28px}.mini .glabel{top:77px;font-size:12px}.mini .scale{font-size:11px}.mini .metric-title{font-size:14px;min-height:22px}
    table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #e5e7eb;padding:9px;text-align:center}th{background:#f8fafc;font-size:11px}td:first-child,td:nth-child(2){text-align:left;font-weight:800}.small-g{width:52px;height:26px;position:relative;display:inline-block;overflow:hidden}.small-g:before{content:"";position:absolute;left:0;top:0;width:52px;height:52px;border-radius:50%;background:conic-gradient(from 270deg,var(--c) calc(var(--v)*1.8deg),#e5e7eb 0 180deg,transparent 0)}.small-g:after{content:"";position:absolute;left:10px;top:10px;width:32px;height:32px;border-radius:50%;background:white}.score{font-weight:900;font-size:16px}.badge{display:inline-block;padding:7px 12px;border-radius:6px;font-weight:900;font-size:11px}.good{background:#ecfdf5;color:#166534;border:1px solid #bbf7d0}.mod{background:#fff7ed;color:#ea580c;border:1px solid #fed7aa}.weakb{background:#fff1f2;color:#b91c1c;border:1px solid #fecaca}
    .synthesis{display:grid;grid-template-columns:1fr 1fr;gap:14px}.box{border:1px solid #e5e7eb;border-radius:10px;padding:14px;background:#fff}.box h4{margin:0 0 10px;font-size:14px}.box p{margin:7px 0;font-size:12px;line-height:1.35}.ok{color:#16a34a;font-weight:900}.warn{color:#dc2626;font-weight:900}.priority{background:#eff6ff}.chart{height:132px;border:1px solid #e5e7eb;border-radius:10px;margin-top:12px;padding:8px;background:#fff}.note{margin-top:14px;color:#475569;font-size:12px}
    @media(max-width:1200px){.grid5,.grid2,.grid-bottom,.main-panel,.radar-wrap,.halfgrid,.synthesis{grid-template-columns:1fr}.top{display:block}.actions{margin-top:12px}}
  </style>
</head>
<body>
  <div class="shell">
    <div class="top">
      <div class="brand">
        <div class="crest">🏛</div>
        <div><div class="title">PCAP National Governance Dashboard</div><div class="subtitle">Recursive Governance Intelligence &nbsp;•&nbsp; Governance View Only</div></div>
      </div>
      <div class="actions"><span>Last Updated: May 25, 2025</span><span>•</span><span>10:42 AM</span><button class="btn">⇩ Download PNG</button></div>
    </div>

    <div class="grid5">
      ${gauge('National Strategy Recursive Governance Score',78,'STRONG','var(--green)')}
      ${gauge('Governance Drift',32,'MODERATE','var(--orange)')}
      ${gauge('Monitoring Reliability',58,'MODERATE','var(--blue)')}
      ${gauge('Escalation Readiness',71,'STRONG','var(--purple)')}
      ${gauge('Escalated Actions',34,'HIGH PRIORITY','var(--red)','17','0','50+')}
    </div>

    <div class="grid2">
      <div class="card">
        <h3>Recursive Governance Components (C1 – C6) <span class="info">i</span></h3>
        <div class="radar-wrap">
          <svg viewBox="0 0 420 360" width="100%" height="330">
            <g transform="translate(210 175)">
              <polygon points="0,-135 117,-67 117,67 0,135 -117,67 -117,-67" fill="none" stroke="#cbd5e1"/>
              <polygon points="0,-101 88,-50 88,50 0,101 -88,50 -88,-50" fill="none" stroke="#dbe3ef"/>
              <polygon points="0,-68 59,-34 59,34 0,68 -59,34 -59,-34" fill="none" stroke="#dbe3ef"/>
              <polygon points="0,-34 29,-17 29,17 0,34 -29,17 -29,-17" fill="none" stroke="#dbe3ef"/>
              <line x1="0" y1="0" x2="0" y2="-135" stroke="#dbe3ef"/><line x1="0" y1="0" x2="117" y2="-67" stroke="#dbe3ef"/><line x1="0" y1="0" x2="117" y2="67" stroke="#dbe3ef"/><line x1="0" y1="0" x2="0" y2="135" stroke="#dbe3ef"/><line x1="0" y1="0" x2="-117" y2="67" stroke="#dbe3ef"/><line x1="0" y1="0" x2="-117" y2="-67" stroke="#dbe3ef"/>
              <polygon points="0,-111 88,-50 63,36 0,85 -91,52 -96,-55" fill="rgba(37,99,235,.12)" stroke="#2563eb" stroke-width="4"/>
              <circle cx="0" cy="-111" r="6" fill="#2563eb"/><circle cx="88" cy="-50" r="6" fill="#2563eb"/><circle cx="63" cy="36" r="6" fill="#2563eb"/><circle cx="0" cy="85" r="6" fill="#2563eb"/><circle cx="-91" cy="52" r="6" fill="#2563eb"/><circle cx="-96" cy="-55" r="6" fill="#2563eb"/>
              <text x="0" y="-158" text-anchor="middle" font-size="13">C1\nPolicy Governance</text><text x="148" y="-70" text-anchor="middle" font-size="13">C2\nInstrument Governance</text><text x="150" y="80" text-anchor="middle" font-size="13">C3\nResource Governance</text><text x="0" y="164" text-anchor="middle" font-size="13">C4\nMonitoring Governance</text><text x="-150" y="80" text-anchor="middle" font-size="13">C5\nEscalation Governance</text><text x="-150" y="-70" text-anchor="middle" font-size="13">C6\nTraceability Governance</text>
            </g>
          </svg>
          <div class="bars">
            ${bar('C1 Policy Governance',82,'var(--green)')}${bar('C2 Instrument Governance',75,'var(--green)')}${bar('C3 Resource Governance',54,'var(--orange)')}${bar('C4 Monitoring Governance',63,'var(--blue)')}${bar('C5 Escalation Governance',78,'var(--purple)')}${bar('C6 Traceability Governance',72,'var(--teal)')}
            <div class="weak"><span>Weakest Component<br/>C3 Resource Governance</span><span class="pill">54%</span></div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Governance Intelligence (Half Circle Visualization) <span class="info">i</span></h3>
        <div class="halfgrid">
          ${miniGauge('C1 Policy Governance',82,'STRONG','var(--green)')}${miniGauge('C2 Instrument Governance',75,'STRONG','var(--green)')}${miniGauge('C3 Resource Governance',54,'MODERATE','var(--orange)')}${miniGauge('C4 Monitoring Governance',63,'MODERATE','var(--blue)')}${miniGauge('C5 Escalation Governance',78,'STRONG','var(--purple)')}${miniGauge('C6 Traceability Governance',72,'STRONG','var(--teal)')}
        </div>
      </div>
    </div>

    <div class="grid-bottom">
      <div class="card">
        <h3>Sectoral Strategies Governance Benchmarking <span class="info">i</span></h3>
        <table>
          <thead><tr><th>#</th><th>Sectoral Strategy</th><th>C1 Policy</th><th>C2 Instrument</th><th>C3 Resource</th><th>C4 Monitoring</th><th>C5 Escalation</th><th>C6 Traceability</th><th>Overall Governance Score</th><th>OCI-D</th><th>OCI-O</th><th>Governance Label</th></tr></thead>
          <tbody>
            ${row(1,'Health',[85,80,65,70,80,75],79,88,72,'STRONG')}${row(2,'Education',[80,75,60,65,75,70],71,62,66,'STRONG')}${row(3,'Agriculture',[75,70,50,55,70,65],64,55,58,'MODERATE')}${row(4,'Energy',[70,65,45,50,60,60],58,48,52,'MODERATE')}${row(5,'Transport',[65,60,40,45,55,55],53,42,46,'WEAK')}${row(6,'Water & Sanitation',[60,55,35,40,50,50],48,38,42,'WEAK')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>Governance Synthesis <span class="info">i</span></h3>
        <div class="synthesis">
          <div>
            <div class="box"><h4 class="ok">Key Strengths</h4><p>● Strong Policy Governance (82%)</p><p>● Strong Escalation Governance (78%)</p><p>● Strong Traceability Governance (72%)</p></div>
            <div class="box" style="margin-top:12px"><h4 class="warn">Key Gaps</h4><p>△ Resource Governance needs attention (54%)</p><p>△ Monitoring Governance below strong threshold (63%)</p><p>△ Governance Drift at moderate level (32%)</p></div>
            <div class="box priority" style="margin-top:12px"><h4>Governance Priorities</h4><p>1. Strengthen Resource Governance and allocations</p><p>2. Improve Monitoring reliability systems</p><p>3. Reduce Governance Drift through proactive oversight</p></div>
          </div>
          <div>
            <div class="chart"><b>Governance Drift Trend (Last 6 Periods)</b><svg viewBox="0 0 360 100" width="100%" height="95"><polyline points="10,52 75,62 140,50 205,44 270,55 340,40" fill="none" stroke="#f97316" stroke-width="4"/><polygon points="10,52 75,62 140,50 205,44 270,55 340,40 340,90 10,90" fill="rgba(249,115,22,.16)"/><text x="10" y="20" font-size="12">28%</text><text x="335" y="20" font-size="12">32%</text></svg></div>
            <div class="chart"><b>Escalation Readiness Trend (Last 6 Periods)</b><svg viewBox="0 0 360 100" width="100%" height="95"><polyline points="10,62 75,58 140,52 205,48 270,44 340,38" fill="none" stroke="#6d40d8" stroke-width="4"/><polygon points="10,62 75,58 140,52 205,48 270,44 340,38 340,90 10,90" fill="rgba(109,64,216,.14)"/><text x="10" y="20" font-size="12">64%</text><text x="330" y="20" font-size="12">71%</text></svg></div>
          </div>
        </div>
      </div>
    </div>
    <div class="note">Note: All scores are percentages (0–100). Governance view only. Strategic coherence is available in a separate dashboard.</div>
  </div>
</body>
</html>`;
}

function gauge(title,val,label,color,display,low='0%',high='100%'){return `<div class="card"><div class="metric-title">${title}<span class="info">i</span></div><div class="gauge"><div><div class="semi" style="--v:${val};--c:${color}"><div class="gnum">${display||val+'%'}</div><div class="glabel">${label}</div></div><div class="scale"><span>${low}</span><span>${high}</span></div></div></div></div>`}
function miniGauge(title,val,label,color){return `<div class="mini"><div class="metric-title">${title}</div><div class="gauge" style="height:118px"><div><div class="semi" style="--v:${val};--c:${color}"><div class="gnum">${val}%</div><div class="glabel">${label}</div></div><div class="scale"><span>0%</span><span>100%</span></div></div></div></div>`}
function bar(t,v,c){return `<div class="bar"><b>${t}</b><div class="bar-track"><div class="bar-fill" style="--w:${v}%;--c:${c}"></div></div><strong>${v}%</strong></div>`}
function small(v){let c=v>=75?'var(--green)':v>=55?'var(--orange)':'var(--red)';return `<span class="small-g" style="--v:${v};--c:${c}"></span>`}
function badge(label){return `<span class="badge ${label==='STRONG'?'good':label==='MODERATE'?'mod':'weakb'}">${label}</span>`}
function row(i,name,vals,overall,d,o,label){return `<tr><td>${i}</td><td>${name}</td>${vals.map(v=>`<td>${small(v)}<br>${v}%</td>`).join('')}<td class="score" style="color:${overall>=75?'var(--green)':overall>=55?'var(--orange)':'var(--red)'}">${overall}%</td><td>${small(d)}<br>${d}%</td><td>${small(o)}<br>${o}%</td><td>${badge(label)}</td></tr>`}

app.get('/', (req, res) => {res.setHeader('Content-Type','text/html; charset=utf-8');res.send(html());});
app.get('/api', (req, res) => {res.setHeader('Content-Type','text/html; charset=utf-8');res.send(html());});

export default app;
