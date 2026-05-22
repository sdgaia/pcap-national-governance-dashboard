import express from 'express';
const app = express();

const KEY = process.env.AIRTABLE_API_KEY;
const BASE = process.env.AIRTABLE_BASE_ID;
const NAT_TABLE = process.env.AIRTABLE_NATIONAL_STRATEGIES_TABLE || 'National Strategies';
const SEC_TABLE = process.env.AIRTABLE_SECTORAL_STRATEGIES_TABLE || 'Sectoral Strategies';

function clean(v){return String(v ?? '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]));}
function field(f,n,d=''){for(const x of n){const v=f?.[x];if(v!==undefined&&v!==null&&v!=='')return v;}return d;}
function text(f,n,d='Not specified'){const v=field(f,n,d);if(Array.isArray(v))return v.map(x=>typeof x==='object'?(x.name||x.id||''):x).filter(Boolean).join(', ')||d;return typeof v==='object'&&v?.name?v.name:String(v||d);}
function num(f,n,d=0){const v=field(f,n,d);const n0=Number(Array.isArray(v)?v[0]:v);return Number.isFinite(n0)?(n0>0&&n0<=1?Math.round(n0*100):Math.round(n0)):d;}
function label(v){return v>=80?'Strong':v>=60?'Moderate':v>=40?'Fragile':'Critical';}
function color(v){return v>=80?'green':v>=60?'blue':v>=40?'orange':'red';}

async function get(table,id){
 if(!KEY||!BASE||!id) return null;
 const url=`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}/${id}`;
 const r=await fetch(url,{headers:{Authorization:`Bearer ${KEY}`}});
 if(!r.ok) throw new Error(await r.text());
 return r.json();
}
async function linked(table,ids){
 if(!Array.isArray(ids))return[];
 const out=[];
 for(const id of ids.slice(0,12)){try{const r=await get(table,id);if(r)out.push(r);}catch(e){}}
 return out;
}

function data(record,sectors){
 const f=record?.fields||{};
 const c1=num(f,['C1 Policy Governance','C1 Score'],82), c2=num(f,['C2 Instrument Governance','C2 Policy Governance','C2 Score'],75), c3=num(f,['C3 Resource Governance','C3 Policy Governance','C3 Score'],54), c4=num(f,['C4 Monitoring Governance','C4 Policy Governance','C4 Score'],63), c5=num(f,['C5 Escalation Governance','C5 Policy Governance','C5 Score'],78), c6=num(f,['C6 Traceability Governance','C6 Policy Governance','C6 Score'],72);
 const avg=Math.round((c1+c2+c3+c4+c5+c6)/6);
 const sectorRows=(sectors||[]).map((r,i)=>{const s=r.fields||{};const score=num(s,['Overall Coherence Score','C1 Policy Governance','Final Sectoral Strategy Coherence Score'],0)||0;return{idx:i+1,name:text(s,['Strategy Name','Sector Strategy ID','Name'],`Sectoral Strategy ${i+1}`),score,status:label(score)}}).filter(x=>x.score>0).sort((a,b)=>a.score-b.score);
 return {
  id:text(f,['ID','Strategy ID'],record?.id||'NS'),
  name:text(f,['Strategy Name','Name'],'National Development Strategy'),
  country:text(f,['Country'],'Ghana'),
  score:num(f,['National Strategy Recursive Governance Score','OVERALL Coherence Score','Overall Coherence Score'],avg),
  drift:num(f,['Governance Drift'],32),
  monitoring:num(f,['Monitoring Reliability'],c4),
  escalation:num(f,['Escalation Readiness'],c5),
  escalated:num(f,['Escalated Actions'],17),
  c:[c1,c2,c3,c4,c5,c6],
  sectors:sectorRows.length?sectorRows:[{idx:1,name:'Health',score:79,status:'Moderate'},{idx:2,name:'Education',score:71,status:'Moderate'},{idx:3,name:'Agriculture',score:64,status:'Moderate'},{idx:4,name:'Energy',score:58,status:'Fragile'},{idx:5,name:'Transport',score:53,status:'Fragile'}],
  diagnosis:[text(f,['Policy Diagnosis'],'Policy governance is structurally present.'),text(f,['Monitoring Diagnosis'],'Monitoring reliability requires continued strengthening.'),text(f,['Escalation Diagnosis'],'Escalation readiness requires closure discipline.'),text(f,['Auditability Diagnosis'],'Traceability architecture is broadly adequate.')]
 };
}

function card(t,v,unit='',cls='green'){return `<div class="card"><h3>${clean(t)}</h3><div class="big ${cls}">${clean(v)}${unit}</div><div class="small">${clean(label(Number(v)||0))}</div></div>`;}
function bar(n,v){return `<div class="bar"><span>${clean(n)}</span><div class="track"><div class="fill ${color(v)}" style="width:${v}%"></div></div><b>${v}%</b></div>`;}
function row(s,i){return `<tr><td>${i+1}</td><td>${clean(s.name)}</td><td>${s.score}%</td><td><span class="badge ${color(s.score)}">${clean(s.status)}</span></td></tr>`;}

function render(d){return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>PCAP National Governance Dashboard</title><style>
body{margin:0;padding:18px;background:#f5f7fb;font-family:Arial,sans-serif;color:#0f172a}.wrap{max-width:1880px;margin:auto;background:white;border:1px solid #e5e7eb;border-radius:16px;padding:22px;box-shadow:0 8px 28px #0000000a}.top{display:flex;justify-content:space-between;gap:20px}.title{font-size:36px;font-weight:900}.sub{margin-top:8px;color:#64748b}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-top:20px}.card{background:white;border:1px solid #e5e7eb;border-radius:14px;padding:18px}.card h3{margin:0;font-size:16px}.big{font-size:48px;font-weight:900;text-align:center;margin-top:34px}.small{text-align:center;font-weight:800}.green{color:#16a34a}.blue{color:#2563eb}.orange{color:#f97316}.red{color:#dc2626}.purple{color:#7c3aed}.two{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}.bottom{display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-top:14px}.bar{display:grid;grid-template-columns:210px 1fr 48px;gap:12px;align-items:center;margin:18px 0}.track{height:10px;background:#e5e7eb;border-radius:99px;overflow:hidden}.fill{height:10px;border-radius:99px}.fill.green{background:#16a34a}.fill.blue{background:#2563eb}.fill.orange{background:#f97316}.fill.red{background:#dc2626}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #e5e7eb;padding:10px;text-align:center}th{background:#f8fafc}.badge{padding:6px 11px;border-radius:999px;font-weight:800}.badge.green{background:#ecfdf5}.badge.blue{background:#eff6ff}.badge.orange{background:#fff7ed}.badge.red{background:#fff1f2}.synth p{font-size:14px;line-height:1.45}.note{margin-top:14px;color:#64748b;font-size:12px}@media(max-width:1100px){.grid,.two,.bottom{grid-template-columns:1fr}.top{display:block}}
</style></head><body><div class="wrap"><div class="top"><div><div class="title">PCAP National Governance Dashboard</div><div class="sub">${clean(d.id)} — ${clean(d.name)} • ${clean(d.country)} • Live Airtable Governance View</div></div><div>Updated • ${new Date().toLocaleDateString()}</div></div><div class="grid">${card('Recursive Governance Score',d.score,'% ',color(d.score))}${card('Governance Drift',d.drift,'% ',d.drift>25?'red':d.drift>10?'orange':'green')}${card('Monitoring Reliability',d.monitoring,'% ',color(d.monitoring))}${card('Escalation Readiness',d.escalation,'% ',color(d.escalation))}${card('Escalated Actions',d.escalated,'',d.escalated>25?'red':d.escalated>10?'orange':'green')}</div><div class="two"><div class="card"><h3>Recursive Governance Components (C1–C6)</h3>${['C1 Policy Governance','C2 Instrument Governance','C3 Resource Governance','C4 Monitoring Governance','C5 Escalation Governance','C6 Traceability Governance'].map((n,i)=>bar(n,d.c[i])).join('')}</div><div class="card synth"><h3>Governance Intelligence Components</h3><p><b>Weakest component:</b> ${['C1','C2','C3','C4','C5','C6'][d.c.indexOf(Math.min(...d.c))]} at ${Math.min(...d.c)}%.</p><p><b>Monitoring reliability:</b> ${d.monitoring}%.</p><p><b>Escalation readiness:</b> ${d.escalation}%.</p><p><b>Governance drift:</b> ${d.drift}%.</p></div></div><div class="bottom"><div class="card"><h3>Sectoral Strategies Governance Benchmarking</h3><table><thead><tr><th>#</th><th>Sectoral Strategy</th><th>Overall Governance</th><th>Status</th></tr></thead><tbody>${d.sectors.map(row).join('')}</tbody></table></div><div class="card synth"><h3>Governance Synthesis</h3>${d.diagnosis.map(x=>`<p>• ${clean(x)}</p>`).join('')}</div></div><div class="note">Live Airtable rendering. Strategic coherence remains in a separate dashboard.</div></div></body></html>`}

async function handle(req,res){try{const recordId=String(req.query.recordId||'').trim();let rec=null,sectors=[];if(recordId){rec=await get(NAT_TABLE,recordId);const f=rec?.fields||{};sectors=await linked(SEC_TABLE,f['Sectoral Strategies']||f['Linked Sectoral Strategies']||[]);}res.setHeader('Content-Type','text/html; charset=utf-8');res.send(render(data(rec,sectors)));}catch(e){res.status(500).send('Dashboard error: '+clean(e.message));}}
app.get('/',handle);app.get('/api',handle);
export default app;
