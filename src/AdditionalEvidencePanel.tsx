import {useState} from 'react';
import {Database,FileUp,ShieldAlert,ExternalLink,CheckCircle2} from 'lucide-react';
import {readCSV,checkDataset,descriptiveYields,summarySoil,type DataKind,type ImportResult} from './additionalEvidence';
const kinds:{id:DataKind;name:string;template:string;source:string}[]=[
 {id:'imerg',name:'IMERG spatial time series',template:'imerg_grid_TEMPLATE.csv',source:'NASA GES DISC — GPM_3IMERGDF_07'},
 {id:'smap',name:'SMAP soil moisture time series',template:'smap_daily_TEMPLATE.csv',source:'NASA NSIDC AppEEARS — SPL4SMGP'},
 {id:'soil',name:'Soil properties (measured or SoilGrids)',template:'soil_properties_TEMPLATE.csv',source:'ISRIC SoilGrids or laboratory'},
 {id:'gaez',name:'GAEZ modelled yield potential',template:'gaez_yield_potential_TEMPLATE.csv',source:'FAO GAEZ'},
 {id:'trials',name:'Observed rotation/harvest outcomes',template:'rotation_trials_TEMPLATE.csv',source:'DAPSA data or documented plot trials'}];
const sourceLinks=[{name:'NASA GPM IMERG Final',href:'https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDF_07/summary'}, {name:'NASA SMAP AppEEARS',href:'https://appeears.earthdatacloud.nasa.gov/'},{name:'ISRIC SoilGrids',href:'https://isric.org/explore/soilgrids/'},{name:'FAO GAEZ',href:'https://gaez.fao.org/'}];
const fmt=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:2});
export function AdditionalEvidencePanel(){
 const [kind,setKind]=useState<DataKind>('soil'),[imports,setImports]=useState<Partial<Record<DataKind,ImportResult>>>({}),[error,setError]=useState('');
 const selected=kinds.find(k=>k.id===kind)!;const current=imports[kind];
 async function handleUpload(file?:File){if(!file)return;setError('');try{if(file.size>15000000)throw new Error('Maximum 15 MB per CSV; preprocess large NetCDF/GeoTIFF files offline first.');if(!file.name.toLowerCase().endsWith('.csv'))throw new Error('CSV required; use templates in the archive.');const rows=readCSV(await file.text());const result=checkDataset(kind,rows);setImports(v=>({...v,[kind]:result}))}catch(e){setError(e instanceof Error?e.message:String(e))}}
 return <section className="panel f20-evidence" aria-label="Additional agronomic and NASA evidence imports">
  <div className="panel-head"><div><span className="section-num">V2.0 · FIELD DATA & OPEN SCIENCE INPUTS</span><h3>Connect missing evidence — without inventing observations.</h3></div><span className="subtle-badge">LOCAL CSV · PROVENANCE REQUIRED</span></div>
  <p className="section-description">Ten actual IMERG spatial dates, nine SMAP snapshots and eleven years of POWER are bundled. The full IMERG/SMAP histories, SoilGrids extracts and plot yields are <strong>not acquired</strong>. This panel accepts external research files for descriptive review only. Imports stay in this browser session and are not automatically transmitted to a server.</p>
  <div className="f20-status-grid">{kinds.map(k=><div className="f20-status" key={k.id}><span>{k.name}</span><strong>{imports[k.id]?`${imports[k.id]!.rows.length} imported rows`:'Awaiting sourced data'}</strong></div>)}</div>
  <div className="f20-upload"><div className="f19-control"><h4><Database size={17}/> Import verified evidence</h4><label>Dataset <select aria-label="Import dataset type" value={kind} onChange={e=>{setKind(e.target.value as DataKind);setError('')}}>{kinds.map(k=><option key={k.id} value={k.id}>{k.name}</option>)}</select></label></div>
   <p className="muted-note">Source family: {selected.source}. Use the CSV schema in <code>templates/{selected.template}</code>. Each row must declare its source. Dataset bounds, units and dates are checked before display. <a className="f20-template" download href={`${import.meta.env.BASE_URL}templates/${selected.template}`}>Download this CSV template</a></p>
   <label className="f20-file"><FileUp size={18}/> Select CSV data file <input aria-label="Select sourced CSV file" type="file" accept=".csv,text/csv" onChange={e=>void handleUpload(e.target.files?.[0])}/></label>
   {error&&<p className="f20-error" role="alert">{error}</p>}
   {current&&<div className="f20-import-result"><p><CheckCircle2 size={17}/> <strong>{current.summary}</strong></p><p>Provenance: {current.sourceNames.join('; ')}</p><p>{current.warning}</p>
     {kind==='soil'&&<div className="f19-kpis">{summarySoil(current.rows).filter(x=>x.n>0).map(x=><div key={x.property}><span>{x.property} · {x.n} records</span><b>{x.mean===null?'—':fmt(x.mean)}</b></div>)}</div>}
     {kind==='trials'&&<div className="f20-table"><div className="f20-head"><span>Sequence observed</span><span>Records</span><span>Average kg/ha</span></div>{descriptiveYields(current.rows).slice(0,12).map(r=><div key={r.sequence}><span>{r.sequence}</span><span>{r.n}</span><strong>{fmt(r.mean)}</strong></div>)}</div>}
     {kind==='imerg'&&<p>Available dates: {Array.from(new Set(current.rows.map(x=>x.date))).sort().slice(0,15).join(' · ')}. Pixel-level observations are accepted, but are not silently merged with the historical 2024 paired-point series.</p>}
     {kind==='smap'&&<p>Dates: {new Set(current.rows.map(x=>x.date)).size} · Values in m³/m³ · Not direct plot moisture observations.</p>}
     {kind==='gaez'&&<p>Modelled yields are reference scenarios only; they do not predict this farm's harvest.</p>}
     <button className="secondary-btn" onClick={()=>setImports(v=>({...v,[kind]:undefined}))}>Clear current import</button>
   </div>}
  </div>
  <div className="f20-links">{sourceLinks.map(l=><a key={l.href} target="_blank" rel="noopener noreferrer" href={l.href}>{l.name}<ExternalLink size={14}/></a>)}</div>
  <div className="f19-warning"><ShieldAlert size={18}/><div><strong>Scientific release gate</strong><p>Imported measurements are not automatically a calibrated recommendation. Observational differences between sequences do not establish causal effects; SoilGrids pixels are model estimates, GAEZ potentials are scenarios, and missing observations remain missing. No sourced dataset is included unless actually obtained and checked.</p></div></div>
 </section>;
}
