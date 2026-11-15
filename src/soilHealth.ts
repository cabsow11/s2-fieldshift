/** Soil Health Evidence Engine. Descriptive evidence only: no inferred yield, soil-health change or universal crop preference. */
import type {Crop} from './engine';
import {checkDataset,readCSV,type ParsedRow} from './additionalEvidence';
export type SoilProperty='ph'|'clay_pct'|'sand_pct'|'soc_g_kg'|'total_n_g_kg'|'cec_cmol_kg';
export type SoilProfile={latitude:number;longitude:number;depthCm:number;source:string;kind:'laboratory'|'field'|'soilgrids_model';date:string|null;properties:Partial<Record<SoilProperty,{value:number;low:number|null;high:number|null}>>};
export type SoilFinding={label:string;level:'DOCUMENTED_MECHANISM'|'STRUCTURAL'|'UNIDENTIFIED';detail:string;references:string[]};
export type SoilAssessment={status:'NO_SOIL_INPUT'|'SOURCE_DERIVED_NOT_FIELD_VALIDATED'|'USER_OBSERVATION';profiles:SoilProfile[];warnings:string[];properties:{key:SoilProperty;label:string;value:number;low:number|null;high:number|null;source:string;depthCm:number}[];first:Crop;second:Crop;findings:SoilFinding[];notEstimated:string[]};
const limits:Record<SoilProperty,[number,number]>={ph:[0,14],clay_pct:[0,100],sand_pct:[0,100],soc_g_kg:[0,2000],total_n_g_kg:[0,300],cec_cmol_kg:[0,250]};
const labels:Record<SoilProperty,string>={ph:'Soil pH (water)',clay_pct:'Clay fraction (%)',sand_pct:'Sand fraction (%)',soc_g_kg:'Organic carbon (g/kg)',total_n_g_kg:'Total nitrogen (g/kg)',cec_cmol_kg:'Cation exchange capacity (cmol(c)/kg)'};
const keys=Object.keys(limits) as SoilProperty[];
const finite=(s:string|undefined)=>s!==undefined&&s.trim()!==''&&Number.isFinite(Number(s));
function value(row:ParsedRow,key:string,min:number,max:number):number|null{if(!finite(row[key]))return null;const n=Number(row[key]);if(n<min||n>max)throw new Error(`${key} outside plausible physical bounds`);return n;}
export function parseSoilProfiles(csv:string):SoilProfile[]{
 const rows=readCSV(csv);
 // Reuse existing source, coordinate, depth, and provenance checks rather than bypassing them.
 checkDataset('soil',rows);
 return rows.map((r,i)=>{
  if(!['laboratory','field','soilgrids_model'].includes(r.measurement_type))throw new Error(`Row ${i+2}: unsupported measurement type`);
  const properties:SoilProfile['properties']={};
  for(const key of keys){const v=value(r,key,...limits[key]);if(v===null)continue;
   const low=value(r,`${key}_q05`,...limits[key]),high=value(r,`${key}_q95`,...limits[key]);
   if((low===null)!==(high===null))throw new Error(`Row ${i+2}: ${key} quantile bounds must be supplied together`);
   if(low!==null&&high!==null&&(low>v||v>high))throw new Error(`Row ${i+2}: ${key} median must lie between q05 and q95`);
   properties[key]={value:v,low,high};
  }
  if(Object.keys(properties).length===0)throw new Error(`Row ${i+2}: no supported soil property`);
  return {latitude:Number(r.latitude),longitude:Number(r.longitude),depthCm:Number(r.depth_cm),source:r.source.trim(),kind:r.measurement_type as SoilProfile['kind'],date:r.sample_date?.trim()||null,properties};
 });
}
const legume=(crop:Crop)=>crop==='Groundnut'||crop==='Cowpea';
/** Mechanisms are descriptors, not measured gains, causal effects, crop suitability or recommendations. */
export function rotationSoilMechanisms(first:Crop,second:Crop):SoilFinding[]{
 return [
 {label:'Crop diversity',level:'STRUCTURAL',detail:first===second?'Same species in both slots; no interspecies diversification.':'Two distinct species are sequenced; diversity is documented as a structural attribute, not a quantified soil improvement.',references:['FAO crop rotation guidance']},
 {label:'Legume preceding a cereal',level:'DOCUMENTED_MECHANISM',detail:legume(first)&&!legume(second)?`${first} precedes ${second}. A legume-to-cereal nitrogen pathway is relevant; residue management, nodulation and nutrient balance determine any actual benefit.`:!legume(first)&&legume(second)?`${second} occurs after ${first}, not before the cereal in this two-season order. No residual nitrogen benefit to the previous cereal may be asserted.`:'No legume → cereal transition within the two selected seasons.',references:['FAO crop rotation / integrated soil fertility guidance']},
 {label:'Organic carbon trajectory',level:'UNIDENTIFIED',detail:'Change in soil organic carbon is not calculated: baseline stock, biomass returns, residue removal, tillage and decomposition parameters are unavailable.',references:['ISRIC SoilGrids documentation']},
 {label:'Yield and profitability',level:'UNIDENTIFIED',detail:'Neither yields, nitrogen credits, soil regeneration nor profitability are inferred from crop order or gridded soil characteristics.',references:[]}
 ];
}
export function analyzeSoil(profiles:SoilProfile[],first:Crop,second:Crop,point={lat:14.15,lon:-16.08}):SoilAssessment{
 const warnings:string[]=[];
 const properties:SoilAssessment['properties']=[];
 const accepted=profiles.filter(p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Number.isFinite(p.depthCm));
 for(const p of accepted){
  const dy=(p.latitude-point.lat)*111,dx=(p.longitude-point.lon)*108;
  if(Math.hypot(dx,dy)>10)warnings.push(`A source profile is over 10 km from the pilot reference point; do not treat it as local field evidence.`);
  if(p.kind==='soilgrids_model')warnings.push('SoilGrids reports gridded model predictions, not laboratory measurements; property intervals are model prediction intervals.');
  if(p.depthCm>30)warnings.push('One or more soil properties are deeper than 30 cm; avoid describing them as topsoil measurements.');
  for(const key of keys){const x=p.properties[key];if(!x)continue;properties.push({key,label:labels[key],value:x.value,low:x.low,high:x.high,source:p.source,depthCm:p.depthCm});}
 }
 if(!accepted.length)warnings.push('No sourced soil property is loaded; the declared soil texture is not a measured soil health baseline.');
 if(accepted.length&&accepted.some(p=>p.kind==='soilgrids_model'&&Object.values(p.properties).some(x=>x&&x.low===null)))warnings.push('A SoilGrids property has no q05/q95 bounds; do not infer its uncertainty range.');
 return {status:!accepted.length?'NO_SOIL_INPUT':accepted.every(p=>p.kind==='soilgrids_model')?'SOURCE_DERIVED_NOT_FIELD_VALIDATED':'USER_OBSERVATION',profiles:accepted,properties,warnings:[...new Set(warnings)],first,second,findings:rotationSoilMechanisms(first,second),notEstimated:['Change in soil organic carbon, fertility or nitrogen stock','Rotation-specific yield advantage, economic returns and crop suitability','Causal effects of crop order without an identified comparison']};
}
