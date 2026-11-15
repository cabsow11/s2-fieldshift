import {WaterParametersPanel} from './WaterParametersPanel';
import type {Crop,Field,Rain} from './engine';
import {cropKnowledge,evaluateDocumentedRotation} from './evidenceClimate';
export function EvidenceClimatePanel({pair,field,data,start,threshold}:{pair:[string,string];field:Field;data:Rain[];start:string;threshold:number}){
 const assessments=pair.map(id=>{const [a,b]=id.split('-') as [Crop,Crop];return evaluateDocumentedRotation(a,b,field,data,start,30,threshold)});
 return <section className="panel" aria-label="Evidence-based agricultural diagnostics" style={{marginBottom:20}}>
  <span className="section-num">V1.5 + V1.6 / AGRONOMIC EVIDENCE × HISTORICAL CLIMATE</span>
  <h3>What can the evidence actually establish?</h3>
  <p className="section-description">Crop-specific documentary checks and NASA precipitation diagnostics for the selected rotation pair. This is not a yield prediction, a planting recommendation, or a forecast of the next two seasons.</p>
  <div className="evidence-agro-grid">{assessments.map((r,idx)=><article key={idx} className="evidence-agro-card">
   <div className="evidence-agro-title"><strong>{r.rotation[0]} → {r.rotation[1]}</strong><span className={r.hardConstraint==='EXCLUDED'?'evidence-agro-blocked':'evidence-agro-unknown'}>{r.hardConstraint==='EXCLUDED'?'EXCLUDED':'FIELD VALIDATION REQUIRED'}</span></div>
   <p><b>Literature:</b> {r.sequenceEvidence==='STUDIED_SYSTEM'?'Studied system — no transferable quantified benefit':'Sequence effect not established'}. {r.referenceIds.join(', ')||'No pair-specific reference'}</p>
   <div className="evidence-agro-metrics">{(['power','imerg'] as const).map(source=><div key={source}><small>{source.toUpperCase()} · 30 observed days</small><strong>{r.signals.windows[source]?`${r.signals.windows[source]!.rainMm.toFixed(1)} mm`: 'Not available'}</strong><small>{r.signals.windows[source]?`${r.signals.windows[source]!.wetDays} wet days · ${r.signals.windows[source]!.dryDays} day max dry run`:'Incomplete history'}</small></div>)}</div>
   <p className="evidence-agro-label">Crop evidence (non-predictive)</p>
   {([...new Set(r.rotation)] as Crop[]).map(c=><div key={c} className="evidence-agro-rule"><b>{c}</b>{cropKnowledge(c).rules.map(rule=><div key={rule.id}><span>{rule.label} · {rule.references.join(', ')}</span><small>{rule.claim}</small></div>)}</div>)}
   <details><summary>Missing evidence ({r.missing.length} inputs)</summary><ul>{r.missing.slice(0,12).map(m=><li key={m}>{m}</li>)}</ul></details>
   <p className="evidence-agro-gate">Decision gate: recommendation withheld. Crop-stage stress and agronomic superiority are not validated.</p>
  </article>)}</div>
  {assessments.length>0&&<WaterParametersPanel crop={assessments[0].rotation[0]} observations={data} sowing={start}/>}
  <p className="muted-note">Source separation: POWER UTC and GPM IMERG Final V07B are historical gridded estimates. They are not independent future scenarios, rainfall gauges, soil water content or yield outcomes. Descriptive rain thresholds are user-controlled.</p>
 </section>
}
