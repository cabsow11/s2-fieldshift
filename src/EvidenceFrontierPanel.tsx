import {useMemo,useState} from 'react';
import type {Crop,Field,Rain,Source} from './engine';
import {evidenceBoundedFrontier} from './evidenceFrontier';

export function EvidenceFrontierPanel({pair,field,data,sowing,threshold}:{pair:[string,string];field:Field;data:Rain[];sowing:string;threshold:number}){
 const [etoInput,setEtoInput]=useState('');
 const eto=etoInput.trim()===''?null:Number(etoInput);
 const valid=eto===null||Number.isFinite(eto)&&eto>0&&eto<=15;
 const result=useMemo(()=>{
  if(!valid||data.length===0)return null;
  try{return evidenceBoundedFrontier({pair,field,data,sowing,threshold,etoMmDay:eto});}
  catch{return null;}
 },[pair,field,data,sowing,threshold,eto,valid]);
 return <section className="panel evidence-frontier" aria-label="Evidence-bounded agricultural decision frontier" style={{marginBottom:20}}>
  <div className="panel-head"><div><span className="section-num">V1.7 · EVIDENCE-BOUNDED AGRICULTURAL FRONTIER</span><h3>Can the agricultural decision actually be ranked?</h3></div><span className="subtle-badge">NO INVENTED WINNER</span></div>
  <p className="section-description">A scientifically conservative comparison of the two selected crop sequences. We display real historical NASA evidence and reference crop-water demand when estimable. We do not turn either into unobserved yield, fertility or financial benefits.</p>
  <div className="evidence-frontier-pairs"><div><small>ROTATION A</small><strong>{pair[0].replace('-', ' → ')}</strong></div><div><small>ROTATION B</small><strong>{pair[1].replace('-', ' → ')}</strong></div></div>
  <label className="field-control" style={{marginTop:16,maxWidth:390}}>Optional shared ET0 assumption (mm/day)
   <input type="number" min="0.1" max="15" step="0.1" value={etoInput} placeholder="Leave empty for observation-only mode" onChange={e=>setEtoInput(e.target.value)}/>
  </label>
  {!valid&&<p role="alert">Enter a positive ET0 up to 15 mm/day, or leave blank.</p>}
  {result?<>
    <div className="evidence-frontier-grid">
     {(['power','imerg'] as Source[]).map(source=><div key={source}><small>{source==='power'?'NASA POWER UTC':'GPM IMERG V07B'} · historical 30 days</small><strong>{result.rainfall[source]?.totalMm.toFixed(2)} mm</strong><span>{result.rainfall[source]?.wetDays} wet days · maximum dry spell {result.rainfall[source]?.longestDryDays} days</span></div>)}
    </div>
    <div className="evidence-frontier-grid">
     {result.cropOne.map((crop:Crop,i)=><div key={i}><small>{i===0?'A':'B'} · first-season {crop}</small><strong>{result.referenceDemand[i]===null?'ETc not calculable':`${result.referenceDemand[i]!.toFixed(2)} mm reference ETc`}</strong><span>{result.kcs[i]===null?'Crop-specific reference schedule unavailable':`Average generic FAO Kc ${result.kcs[i]!.toFixed(3)}`}</span></div>)}
    </div>
    <div className="evidence-frontier-result" role="status"><strong>{result.status==='EXCLUDED'?'EXCLUDED — at least one explicit constraint fails':result.status==='PARTIAL_REFERENCE_COMPARISON'?'PARTIAL COMPARISON — reference crop-water demand only':'INSUFFICIENT PARAMETERS — no crop-water comparison'}</strong>
     <p>{result.demandRelation==='A_LESS_REFERENCE_ETC'?'Under the same assumed ET0, crop A has a lower generic reference ETc than crop B.':result.demandRelation==='B_LESS_REFERENCE_ETC'?'Under the same assumed ET0, crop B has a lower generic reference ETc than crop A.':result.demandRelation==='EQUAL_REFERENCE_ETC'?'Both first crops have equal reference ETc under these assumptions.':'A comparative reference water demand is not identifiable with the current inputs.'}</p>
     <p><b>Agricultural winner:</b> NOT IDENTIFIED · <b>Reversal frontier:</b> NOT IDENTIFIED · <b>Agricultural minimax regret:</b> NOT COMPUTABLE</p>
    </div>
    <details><summary>What the evidence supports ({result.whatCanBeCompared.length})</summary><ul>{result.whatCanBeCompared.map(s=><li key={s}>{s}</li>)}</ul></details>
    <details open><summary>What prevents an agricultural ranking ({result.blockers.length})</summary><ul>{result.blockers.map(s=><li key={s}>{s}</li>)}</ul></details>
    <p className="muted-note">{result.notes.join(' ')}</p>
  </>:<p className="muted-note">The dataset is unavailable or the assumed input is invalid. No numerical result is inferred.</p>}
 </section>
}
