import {useMemo,useState} from 'react';
import type {Crop} from './engine';
import {analyzeSoil,parseSoilProfiles} from './soilHealth';
const f=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:3});
export function SoilHealthPanel({pair}:{pair:[string,string]}){
 const [csv,setCsv]=useState<string|null>(null),[error,setError]=useState('');
 const [kind,setKind]=useState<'A'|'B'>('A');
 const choice=pair[kind==='A'?0:1].split('-') as [Crop,Crop];
 const profiles=useMemo(()=>{if(!csv)return [];try{return parseSoilProfiles(csv)}catch{return []}},[csv]);
 const report=useMemo(()=>analyzeSoil(profiles,choice[0],choice[1]),[profiles,choice[0],choice[1]]);
 async function upload(file:File|undefined){if(!file)return;setError('');try{if(!file.name.toLowerCase().endsWith('.csv'))throw Error('CSV required');if(file.size>2_000_000)throw Error('Max 2 MB');const s=await file.text();parseSoilProfiles(s);setCsv(s)}catch(e){setError(e instanceof Error?e.message:String(e));}}
 return <section className="panel" aria-label="Soil Health Evidence Engine" style={{marginBottom:20}}>
 <div className="panel-head"><div><span className="section-num">S² / SOIL HEALTH EVIDENCE ENGINE · V2.1.6</span><h3>What does the soil evidence actually establish?</h3></div><span className="subtle-badge">PROVENANCE FIRST · NO INVENTED GAINS</span></div>
 <p className="section-description">Compare the structural soil implications of crop order, then attach sourced soil properties if available. SoilGrids values are modelled 250 m estimates with depth-specific uncertainty, not measured farm plots. No soil-restoration or yield gains are predicted.</p>
 <div className="fieldshift-pair-selectors"><label className="field-control">Rotation to inspect<select value={kind} onChange={e=>setKind(e.target.value as 'A'|'B')}><option value="A">A — {pair[0].replace('-', ' → ')}</option><option value="B">B — {pair[1].replace('-', ' → ')}</option></select></label></div>
 <div className="evidence-agro-grid">{report.findings.map(x=><article className="evidence-agro-card" key={x.label}><strong>{x.label}</strong><p>{x.detail}</p><small>{x.level.replaceAll('_',' ')}{x.references.length>0?` · ${x.references.join('; ')}`:''}</small></article>)}</div>
 <div className="f19-control" style={{marginTop:16}}><h4>Sourced soil profile · optional local CSV</h4><p className="muted-note">Use the project template with latitude, longitude, depth_cm, measurement_type, source and at least one measured/modelled property. Optional columns include ph_q05, ph_q95, soc_g_kg_q05 and soc_g_kg_q95. Each row retains provenance. No soil properties are pre-filled for Kaolack.</p>
 <a download href={`${import.meta.env.BASE_URL}templates/soil_properties_TEMPLATE.csv`}>Download soil evidence CSV template</a>
 <label className="field-control" style={{marginTop:12}}>Import sourced soil evidence<input aria-label="Soil health sourced CSV" type="file" accept=".csv,text/csv" onChange={e=>{void upload(e.target.files?.[0])}}/></label></div>
 {error&&<p role="alert" className="connected-error">{error}</p>}
 <div className="info-strip"><strong>Evidence status: {report.status.replaceAll('_',' ')}</strong> · {report.profiles.length} sourced profile(s) · {report.properties.length} property values</div>
 {report.properties.length>0&&<div className="f20-table"><div className="f20-head"><span>Property / depth</span><span>Value</span><span>q05–q95 if sourced</span></div>{report.properties.map((x,i)=><div key={i}><span>{x.label} · {x.depthCm} cm · {x.source}</span><strong>{f(x.value)}</strong><span>{x.low===null||x.high===null?'Not supplied':`${f(x.low)}–${f(x.high)}`}</span></div>)}</div>}
 {report.warnings.map((x,i)=><p className="muted-note" key={i}>• {x}</p>)}
 <details><summary>What this engine does not estimate ({report.notEstimated.length})</summary><ul>{report.notEstimated.map(x=><li key={x}>{x}</li>)}</ul></details>
 <p className="muted-note">Method: <a href="https://docs.isric.org/globaldata/soilgrids/" target="_blank" rel="noreferrer">ISRIC SoilGrids documentation</a>. Diagnostic categories are qualitative and document mechanisms, not numerical claims about a specific field. Imported CSV is processed in this browser session only.</p>
 {csv&&<button className="secondary-btn" onClick={()=>{setCsv(null);setError('')}}>Clear soil evidence</button>}
 </section>;
}
