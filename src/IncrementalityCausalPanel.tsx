import {useEffect,useMemo,useState} from 'react';
import type {Rain} from './engine';
import {auditIncrementalValue,type AuditResult} from './decisionIncrementality';
import {MISSING_EFFECT_MESSAGE,parseUnreviewedRegister,reviewEvidenceRegister,type EffectRecord} from './causalIncrementality';

type Extended={powerDaily:{date:string;rain:number}[]};
export function IncrementalityCausalPanel({daily}:{daily:Rain[]}){
 const [history,setHistory]=useState<Extended|null>(null);const [loadError,setLoadError]=useState('');const [records,setRecords]=useState<EffectRecord[]>([]);const [error,setError]=useState('');
 useEffect(()=>{let active=true;fetch(`${import.meta.env.BASE_URL}data/fieldshift_nasa_extended.json`).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()}).then((d:Extended)=>{if(active)setHistory(d)}).catch(e=>{if(active)setLoadError(String(e))});return()=>{active=false}},[]);
 const audit:AuditResult|null=useMemo(()=>history&&daily.length?auditIncrementalValue(daily,history.powerDaily):null,[daily,history]);
 const causal=useMemo(()=>reviewEvidenceRegister(records),[records]);
 const exportAudit=()=>{if(!audit)return;const blob=new Blob([JSON.stringify({audit,causalRegisterStatus:{total:causal.total,notIdentified:causal.notIdentified,studyOnly:causal.studyOnly,contextReview:causal.contextReview,pilotEffect:null},generatedAt:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='s2-fieldshift-incrementality-causal-audit.json';a.click();URL.revokeObjectURL(url)};
 async function importEvidence(file:File|undefined){if(!file)return;setError('');try{if(file.size>250000)throw Error('Maximum 250 KB');const parsed=parseUnreviewedRegister(await file.text());setRecords(parsed)}catch(e){setError(String(e));setRecords([])}}
 return <section className="panel" aria-label="Incremental decision value and causal evidence audit" style={{marginBottom:20}}>
  <div className="panel-head"><div><span className="section-num">S² / SCIENTIFIC GOVERNANCE · V2.1.7</span><h3>Incremental Decision Value × Causal Evidence</h3></div><span className="subtle-badge">EVIDENCE-BOUNDED</span></div>
  <p className="section-description">A reproducible capability audit across versioned algorithms and a separate causal-identification gate. These are not estimates of additional crop yield, decision accuracy, or realized farmer benefit.</p>
  <div className="info-strip"><strong>Scope:</strong> historical NASA POWER is used for descriptive two-season contexts. The separate 2024 matched POWER–IMERG data remain the paired source comparison. No observational Earth data alone are used to identify crop treatment effects.</div>
  <h4>Incremental Decision Value Audit</h4>
  {loadError&&<p role="alert">Audit input unavailable: {loadError}</p>}
  {!audit&&!loadError&&<p>Reading published NASA historical dataset…</p>}
  {audit&&<>
   <div className="f19-kpis">
    <div><span>POWER historical dates</span><b>{audit.historical.historicalDays}</b></div>
    <div><span>Complete consecutive-year windows</span><b>{audit.historical.completeTwoYearWindows}</b></div>
    <div><span>Eligible ordered rotations (demo profile)</span><b>{audit.historical.eligibleCount}</b></div>
    <div><span>Year-pair × eligible-rotation contexts</span><b>{audit.historical.directionalClimateContexts}</b></div>
    <div><span>Observed soil properties in fixed benchmark</span><b>0</b></div>
    <div><span>Identified Kaolack causal effects</span><b>0</b></div>
   </div>
   <p className="muted-note">Baseline V2.1.4: one 2024 paired series and 16 synthetic rotation candidates. V2.1.5 adds chronological 2015–2025 POWER contexts; V2.1.6 adds source-gated soil descriptors. The numerical context count is NOT the number of independent weather scenarios or proven superior decisions.</p>
   <p className="muted-note">Integrity: {audit.integrity.allMetricsComputable?'All required coverage checks passed':'At least one baseline or history check failed: use caution'}. Complete paired source coverage: {audit.integrity.pairedComparisonComplete?'yes':'no'}; historical date count: {audit.integrity.historicalCoverageValid?'expected':'unexpected'}.</p>
   <details><summary>Limitations and interpretation</summary><ul>{audit.warnings.map(w=><li key={w}>{w}</li>)}</ul></details>
   <button className="secondary-btn" onClick={exportAudit}>Export reproducible audit JSON</button>
  </>}
  <h4 style={{marginTop:28}}>Causal Agronomic Incrementality Gate</h4>
  <div className="info-strip"><strong>{MISSING_EFFECT_MESSAGE}.</strong> Imported literature records are documentary candidates only. A source must be independently reviewed; no imported number is automatically accepted as a verified effect.</div>
  <p className="section-description">Define treatment, comparator, crop outcome, units, study population, research design, confidence interval, assignment, confounding conditions and target overlap. An identified effect in a study is NOT automatically transportable to Kaolack.</p>
  <label className="field-control">Import optional causal evidence register (JSON, maximum 100 records)
   <input type="file" accept=".json,application/json" aria-label="Import causal evidence JSON" onChange={e=>void importEvidence(e.target.files?.[0])}/>
  </label>
  {error&&<p role="alert">{error}</p>}
  <div className="f19-kpis">
   <div><span>Imported documentary candidates</span><b>{causal.total}</b></div>
   <div><span>Not identified by gate</span><b>{causal.notIdentified}</b></div>
   <div><span>Independently reviewed study effects</span><b>{causal.studyOnly+causal.contextReview}</b></div>
   <div><span>Kaolack causal effects</span><b>0</b></div>
  </div>
  {causal.gates.slice(0,8).map(g=><details key={g.id}><summary>{g.id} — {g.status}</summary><p>{g.scope}</p><ul>{g.requirements.map(x=><li key={x}>{x}</li>)}</ul></details>)}
  <p className="muted-note">Design rule: the software does not grant independent review on self-declared uploaded data, and does not implement a transport estimator. Therefore no field-scale causal estimate is asserted. For an identified effect, a methodological audit and validated source review are required before any quantitative use.</p>
  <p className="muted-note">Methods: target-trial specification, exchangeability/consistency/positivity; transportability and overlap; effect estimation only within an identified target population. Background: Causal Inference Methods for Combining Randomized Trials and Observational Studies (Statistical Science, 2024); review of generalizability and transportability (Annual Review of Statistics and Its Application, 2023).</p>
 </section>;
}
