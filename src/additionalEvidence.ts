export type DataKind='soil'|'trials'|'smap'|'imerg'|'gaez';
export type ParsedRow=Record<string,string>;
export interface ImportResult {kind:DataKind;rows:ParsedRow[];summary:string;warning:string;sourceNames:string[]}
const ISO=/^\d{4}-\d{2}-\d{2}$/;
function number(row:ParsedRow,key:string,min:number,max:number):number {const raw=row[key];if(raw===undefined||raw.trim()==='')throw new Error(`Required field ${key} is missing`);const n=Number(raw);if(!Number.isFinite(n)||n<min||n>max)throw new Error(`Invalid ${key}: ${raw}`);return n}
function calendar(s:string):boolean {if(!ISO.test(s))return false;const d=new Date(`${s}T00:00:00Z`);return !Number.isNaN(d.getTime())&&d.toISOString().startsWith(s)}
export function readCSV(text:string):ParsedRow[] {
 const lines:string[][]=[];let cols:string[]=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){cols.push(value.trim());value=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;cols.push(value.trim());value='';if(cols.some(x=>x!==''))lines.push(cols);cols=[]}else value+=c}
 if(quoted)throw new Error('Unclosed CSV quote');cols.push(value.trim());if(cols.some(x=>x!==''))lines.push(cols);
 if(lines.length<2)throw new Error('CSV must contain headers and data rows');const headers=lines[0].map((h,i)=>i===0?h.replace(/^\uFEFF/,''):h);if(new Set(headers).size!==headers.length)throw new Error('Repeated CSV header');
 return lines.slice(1).map((line,i)=>{if(line.length!==headers.length)throw new Error(`Line ${i+2}: column count mismatch`);return Object.fromEntries(headers.map((h,k)=>[h,line[k]]))});
}
export function checkDataset(kind:DataKind,rows:ParsedRow[]):ImportResult {
 if(!rows.length||rows.length>100000)throw new Error('Dataset must contain 1–100000 rows');
 const required:Record<DataKind,string[]>={soil:['latitude','longitude','depth_cm','measurement_type','source'],trials:['plot_id','season','crop','previous_crop','yield_kg_ha','source'],smap:['date','surface','rootzone','latitude','longitude','source'],imerg:['date','lat','lon','rain_mm','source'],gaez:['crop','latitude','longitude','potential_yield_kg_ha','scenario','source']};
 for(const column of required[kind])if(!rows.every(row=>column in row))throw new Error(`Missing required column: ${column}`);
 const seen=new Set<string>();
 for(const [i,row] of rows.entries()){
  try{
   if(!row.source?.trim())throw new Error('Missing source provenance');
   if(kind==='soil'){number(row,'latitude',-90,90);number(row,'longitude',-180,180);number(row,'depth_cm',0,500);if(!['laboratory','field','soilgrids_model'].includes(row.measurement_type))throw new Error('measurement_type must be laboratory, field, or soilgrids_model');
    for(const [k,a,b] of [['ph',0,14],['clay_pct',0,100],['sand_pct',0,100],['soc_g_kg',0,2000],['total_n_g_kg',0,300],['cec_cmol_kg',0,250]] as const)if(row[k])number(row,k,a,b);
    if(!['ph','clay_pct','sand_pct','soc_g_kg','total_n_g_kg','cec_cmol_kg'].some(k=>row[k]?.trim()))throw new Error('At least one soil property is required');
   }
   if(kind==='trials'){number(row,'yield_kg_ha',0,100000);if(!row.plot_id?.trim()||!row.crop?.trim()||!row.season?.trim()||!row.previous_crop?.trim())throw new Error('Missing experimental identifiers');}
   if(kind==='smap'){if(!calendar(row.date))throw new Error('Invalid date');number(row,'surface',0,1);number(row,'rootzone',0,1);number(row,'latitude',-90,90);number(row,'longitude',-180,180);}
   if(kind==='imerg'){if(!calendar(row.date))throw new Error('Invalid date');number(row,'rain_mm',0,1000);number(row,'lat',-90,90);number(row,'lon',-180,180);}
   if(kind==='gaez'){number(row,'potential_yield_kg_ha',0,100000);number(row,'latitude',-90,90);number(row,'longitude',-180,180);if(!row.crop?.trim()||!row.scenario?.trim())throw new Error('Missing scenario/crop');}
   const key=kind==='imerg'?`${row.date}:${row.lat}:${row.lon}`:kind==='smap'?`${row.date}:${row.latitude}:${row.longitude}`:kind==='trials'?`${row.plot_id}:${row.season}:${row.crop}:${row.treatment??''}`:'';
   if(key&&seen.has(key))throw new Error('Duplicate observation key');if(key)seen.add(key);
  }catch(e){throw new Error(`Row ${i+2}: ${e instanceof Error?e.message:String(e)}`)}
 }
 const sourceNames=Array.from(new Set(rows.map(r=>r.source.trim())));
 const summary=kind==='trials'?`${rows.length} observed plot-season records`:kind==='soil'?`${rows.length} soil property observations/estimates`:kind==='imerg'?`${rows.length} precipitation pixels over ${new Set(rows.map(r=>r.date)).size} dates`:kind==='smap'?`${rows.length} soil moisture observations over ${new Set(rows.map(r=>r.date)).size} dates`:`${rows.length} GAEZ scenario values`;
 const warning=kind==='trials'?'Associations and descriptive averages only; no causal rotation effect is identified.':kind==='soil'?'Do not treat SoilGrids model estimates as laboratory-verified field properties.':kind==='gaez'?'Potential yield is modelled, not observed harvest or validated rotation benefit.':kind==='smap'?'Model-assisted soil moisture, not plot-scale direct measurement.':'Gridded satellite rainfall, not a rain gauge or agronomic outcome.';
 return {kind,rows,summary,warning,sourceNames};
}
export function descriptiveYields(rows:ParsedRow[]){const groups=new Map<string,number[]>();for(const r of rows){const n=Number(r.yield_kg_ha);const key=`${r.previous_crop} → ${r.crop}`;groups.set(key,[...(groups.get(key)||[]),n])}return [...groups.entries()].map(([sequence,values])=>({sequence,n:values.length,mean:values.reduce((s,n)=>s+n,0)/values.length})).sort((a,b)=>b.n-a.n||a.sequence.localeCompare(b.sequence))}
export function summarySoil(rows:ParsedRow[]){const keys=['ph','clay_pct','sand_pct','soc_g_kg','total_n_g_kg'];return keys.map(key=>{const v=rows.map(r=>r[key]?.trim()).filter(Boolean).map(Number).filter(Number.isFinite);return {property:key,n:v.length,mean:v.length?v.reduce((a,b)=>a+b,0)/v.length:null}})}
