import {useMemo,useState} from 'react';
import {MapPin,CalendarDays,Info,ShieldAlert,Layers3} from 'lucide-react';
import type {Rain} from './engine';
import {fmt} from './engine';

export type AtlasMode='power'|'imerg'|'gap';
export function atlasValue(day:Rain,mode:AtlasMode):number{return mode==='gap'?Math.abs(day.power-day.imerg):day[mode];}
export function atlasSummary(days:Rain[],mode:AtlasMode,threshold=1){
 if(!days.length)return {days:0,total:null,maximum:null,highDay:null,wetDays:null};
 const amounts=days.map(d=>atlasValue(d,mode));const max=Math.max(...amounts);const idx=amounts.findIndex(v=>v===max);
 return {days:days.length,total:mode==='gap'?null:amounts.reduce((a,b)=>a+b,0),maximum:max,highDay:days[idx].date,wetDays:mode==='gap'?null:amounts.filter(x=>x>=threshold).length};
}
const mmColor=(v:number,mode:AtlasMode)=>{
 // Explicit display-only thresholds, in mm/day. Never label these as agronomic risk cutoffs.
 if(mode==='gap')return v<1?'#e9f0ea':v<5?'#e7cfa0':v<10?'#dda458':v<20?'#bb703c':'#874b32';
 return v<1?'#eaf1ec':v<5?'#c3e0d4':v<10?'#8cc9b1':v<20?'#4b9b7c':'#19664d';
};
const MONTHS=[['2024-06','June'],['2024-07','July'],['2024-08','August'],['2024-09','September']] as const;
export function ClimateAtlas({daily}:{daily:Rain[]}){
 const [mode,setMode]=useState<AtlasMode>('gap');const [period,setPeriod]=useState('all');const [selectedDate,setSelectedDate]=useState('2024-07-01');
 const view=useMemo(()=>period==='all'?daily:daily.filter(d=>d.date.startsWith(period)),[daily,period]);
 const summary=useMemo(()=>atlasSummary(view,mode),[view,mode]);
 const chosen=view.find(d=>d.date===selectedDate)??view[0];
 const grouped=MONTHS.map(([key,label])=>({key,label,days:view.filter(d=>d.date.startsWith(key))})).filter(g=>g.days.length>0);
 const mapUrl='https://www.openstreetmap.org/export/embed.html?bbox=-16.38%2C13.95%2C-15.78%2C14.35&layer=mapnik&marker=14.15%2C-16.08';
 return <section className="panel atlas-panel" aria-label="Kaolack climate atlas">
  <div className="panel-head"><div><span className="section-num">02 / CLIMATE ATLAS · LOCATION + TEMPORAL HEATMAP</span><h3>Put every rainfall estimate on the map — and calendar.</h3></div><span className="atlas-proof"><ShieldAlert size={14}/> Point-scale evidence only</span></div>
  <p className="section-description">Explore a real geographic locator and a date-by-date heatmap built from the matched NASA observations. This dataset has one pilot location, so no interpolated spatial rainfall field is shown.</p>
  <div className="atlas-layout"><div className="atlas-geography"><div className="atlas-map"><iframe title="OpenStreetMap map of Kaolack pilot reference point" src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/></div><div className="atlas-map-footer"><MapPin size={17}/><div><strong>Kaolack pilot</strong><span>14.15°N, 16.08°W · Reference point, not a mapped field boundary</span></div><a href="https://www.openstreetmap.org/?mlat=14.15&mlon=-16.08#map=10/14.15/-16.08" target="_blank" rel="noreferrer">Open map ↗</a></div><p className="atlas-footnote">Map tiles © OpenStreetMap contributors. The basemap does not depict precipitation.</p></div>
  <div className="atlas-analysis"><div className="atlas-controls"><div className="atlas-tabs" role="group" aria-label="Climate series"><button aria-pressed={mode==='power'} className={mode==='power'?'active':''} onClick={()=>setMode('power')}>POWER</button><button aria-pressed={mode==='imerg'} className={mode==='imerg'?'active':''} onClick={()=>setMode('imerg')}>IMERG</button><button aria-pressed={mode==='gap'} className={mode==='gap'?'active':''} onClick={()=>setMode('gap')}>|DIFFERENCE|</button></div><label>Period <select aria-label="Atlas time period" value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">Jun–Sep</option>{MONTHS.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label></div>
  <div className="atlas-results"><div><span>{mode==='gap'?'Absolute difference · sum not defined':'Rainfall total · selected period'}</span><strong>{summary.total===null?'—':`${fmt(summary.total,1)} mm`}</strong></div><div><span>{mode==='gap'?'Maximum daily source gap':'Maximum daily rainfall'}</span><strong>{summary.maximum===null?'—':`${fmt(summary.maximum,1)} mm`}</strong></div><div><span>Day of maximum</span><strong>{summary.highDay??'—'}</strong></div></div>
  <div className="atlas-calendar" role="group" aria-label="Daily rainfall temporal heatmap">{grouped.map(g=><div className="atlas-month" key={g.key}><div className="atlas-month-label">{g.label}</div><div className="atlas-days">{g.days.map(d=><button key={d.date} aria-label={`${d.date}: ${mode==='gap'?'absolute difference':mode} ${fmt(atlasValue(d,mode),2)} millimeters`} aria-pressed={selectedDate===d.date} title={`${d.date}: ${fmt(atlasValue(d,mode),2)} mm`} style={{background:mmColor(atlasValue(d,mode),mode)}} className={selectedDate===d.date?'chosen':''} onClick={()=>setSelectedDate(d.date)} />)}</div></div>)}</div>
  <div className="atlas-legend"><span>Daily value · mm (visual bins)</span>{(mode==='gap'?['< 1','1–5','5–10','10–20','≥ 20']:['< 1','1–5','5–10','10–20','≥ 20']).map((label,i)=><span key={label} className="atlas-key"><i style={{background:mmColor([0,2,7,15,25][i],mode)}}/>{label}</span>)}</div>
  {chosen&&<div className="atlas-day-details"><CalendarDays size={18}/><div><strong>{chosen.date}</strong><small>POWER {fmt(chosen.power,2)} mm · IMERG {fmt(chosen.imerg,2)} mm · absolute gap {fmt(Math.abs(chosen.power-chosen.imerg),2)} mm</small></div></div>}
  <div className="atlas-context"><Layers3 size={16}/><span><b>What this shows:</b> rainfall intensity estimates and disagreement over time. It does not prove which source is correct or where within Kaolack rainfall was highest.</span></div></div></div>
  <p className="muted-note"><Info size={15}/> Temporal cells correspond to observed dates, not geographic pixels. An actual spatial heatmap requires georeferenced IMERG/POWER grids or rasters and spatial QA, which are not supplied in this 122-day point-series dataset.</p>
 </section>;
}

export function DecisionVerdict({scope,sourceGap,selectedPair,known,unknown}:{scope:'climate'|'rotation'|'frontier';sourceGap?:number;selectedPair?:string[];known?:number;unknown?:number}){
 const climate=scope==='climate',rotation=scope==='rotation';
 return <section className="decision-verdict panel" aria-label="Evidence-based interpretation"><div className="panel-head"><div><span className="section-num">DECISION INTERPRETATION</span><h3>{climate?'What can the climate evidence tell us?':rotation?'What can we conclude about these rotations?':'Is there an evidence-based agricultural winner?'}</h3></div><span className="verdict-badge"><ShieldAlert size={14}/> {climate?'SOURCE DISAGREEMENT':'RECOMMENDATION WITHHELD'}</span></div>
 <div className="verdict-grid"><div><span>Observed / screened</span><strong>{climate?`Two NASA rainfall products`:rotation?`${known??0} passed demo constraints · ${unknown??0} unknown`:`${selectedPair?.join(' vs ')||'Selected crop sequences'}`}</strong><small>{climate?`Absolute seasonal total difference: ${sourceGap===undefined?'—':`${fmt(Math.abs(sourceGap),1)} mm`}`:'Constraint-screening is not a validated suitability assessment.'}</small></div><div><span>Evidence strength</span><strong>{climate?'Historical source comparison':'Insufficient for agronomic ranking'}</strong><small>{climate?'No independent gauge validation at this site.':'Local yield, soil response and season-two outcomes unverified.'}</small></div><div><span>Decision status</span><strong>{climate?'Interpret with caution':'NOT RANKABLE'}</strong><small>{climate?'No risk classification or spatial rainfall zones asserted.':'A mathematical demo preference is not an agricultural recommendation.'}</small></div></div>
 <p className="verdict-explain"><b>What to do next:</b> {climate?'Inspect which dates differ most and collect local station observations before interpreting product accuracy.': 'Measure plot soil conditions, confirm crop varieties and schedules, then obtain local ordered-rotation outcome evidence before ranking yields or fertility.'}</p></section>
}
