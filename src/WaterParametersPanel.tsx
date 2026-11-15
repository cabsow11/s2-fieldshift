import {useMemo,useState} from 'react';
import type {Crop,Rain,Source} from './engine';
import {CROP_WATER_REFERENCE,FAO_WATER_SOURCE,referenceWaterWindow} from './agroParameters';

export function WaterParametersPanel({crop,observations,sowing}:{crop:Crop;observations:Rain[];sowing:string}){
 const [etoInput,setEtoInput]=useState('');
 const eto=etoInput.trim()===''?null:Number(etoInput);
 const inputValid=eto===null||(Number.isFinite(eto)&&eto>0&&eto<=15);
 const ref=CROP_WATER_REFERENCE[crop];
 const result=useMemo(()=>{
  if(!inputValid||!observations.length)return null;
  try{return (['power','imerg'] as Source[]).map(source=>referenceWaterWindow({crop,source,rain:observations,sowing,days:30,assumedEtoMmDay:eto}));}
  catch{return null;}
 },[crop,observations,sowing,eto,inputValid]);
 return <section className="panel" style={{marginBottom:20}} aria-label="FAO crop parameters and NASA historical observations">
  <span className="section-num">V1.6.1 / DOCUMENTED CROP PARAMETERS × NASA</span>
  <h3>Crop water reference — {crop}</h3>
  <p className="section-description">FAO reference crop factors and stage lengths, explicitly separated from NASA rainfall. No site-calibrated water balance, yield or fertilizer benefit is calculated.</p>
  <p><b>Evidence status:</b> {ref.state==='GENERIC_FAO_REFERENCE'?'Generic FAO reference — not a Kaolack calibration':'Cowpea parameters not established'}. {ref.note}</p>
  <div className="evidence-agro-metrics">
  {ref.kc?<><div><small>FAO Kc · Initial / development</small><strong>{ref.kc[0].toFixed(2)} / {ref.kc[1].toFixed(2)}</strong><small>Mid {ref.kc[2].toFixed(2)} · late {ref.kc[3].toFixed(2)}</small></div><div><small>Reference stage lengths</small><strong>{ref.stageDays!.join(' / ')} days</strong><small>Example phenology, not local cultivar calendar</small></div><div><small>FAO seasonal crop water demand</small><strong>{ref.seasonalNeedMm![0]}–{ref.seasonalNeedMm![1]} mm</strong><small>Entire cycle only; not 30-day rain requirement</small></div></>:<div><small>Specific Kc / stage duration</small><strong>Not established</strong><small>No generic bean coefficient substitution</small></div>}
  </div>
  <label style={{display:'block',marginTop:14,marginBottom:8}} htmlFor="eto-scenario"><strong>Optional assumed constant ET0 (mm/day)</strong> — experiment only; leave blank for evidence-only mode</label>
  <input id="eto-scenario" type="number" min="0.1" max="15" step="0.1" value={etoInput} onChange={e=>setEtoInput(e.target.value)} placeholder="Not available — no ETc calculation" style={{maxWidth:320,width:'100%',padding:10,border:'1px solid #b6c9b9',borderRadius:8}}/>
  {!inputValid&&<p role="alert" style={{color:'#a13d20'}}>Use a finite positive ET0 between 0 and 15 mm/day, or leave the field blank.</p>}
  {result?<><div className="evidence-agro-metrics" style={{marginTop:15}}>{result.map(r=><div key={r.source}><small>{r.source.toUpperCase()} · historical 30-day rainfall</small><strong>{r.rainMm.toFixed(2)} mm</strong><small>{r.wetDays} days ≥ 1 mm · longest dry run {r.longestDryDays} days</small>{r.referenceEtcMm!==null&&<><strong style={{fontSize:'1.15em'}}>Scenario ETc {r.referenceEtcMm.toFixed(2)} mm</strong><small>FAO Kc × user-assumed daily ET0; NOT actual crop stress or water deficit</small></>}</div>)}</div></>:<p className="muted-note">Historical 30-day window unavailable or parameters invalid; no values have been imputed.</p>}
  <p className="muted-note"><b>Decision gate: WITHHELD.</b> Crop water requirement ≠ rainfall, and rainfall − ETc ≠ crop water deficit. Soil capacity, ET0 observations, cultivar-specific timing and field outcomes remain unavailable. The illustrative decision scores elsewhere do not become agronomic rankings.</p>
  <p className="muted-note"><a href={FAO_WATER_SOURCE} target="_blank" rel="noreferrer">FAO Crop Water Needs — chapter 3, Tables 7, 8 and 14 (original reference)</a></p>
 </section>
}
