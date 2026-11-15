import type {Crop,Rain,Source} from './engine';

/** FAO Irrigation Water Management Training Manual No. 3, Crop Water Needs,
 * chapter 3, Tables 7, 8 and 14. These are GENERIC reference figures; no
 * Senegal-specific cultivar, plot or yield calibration is implied.
 * https://www.fao.org/4/S2022E/s2022e07.htm
 */
export const FAO_WATER_SOURCE = 'https://www.fao.org/4/S2022E/s2022e07.htm';
export type Phase = 'initial' | 'development' | 'mid' | 'late';
export type ParameterState = 'GENERIC_FAO_REFERENCE'|'NOT_ESTABLISHED';
export interface CropWaterReference {
 crop: Crop;
 kc: readonly [number,number,number,number] | null;
 stageDays: readonly [number,number,number,number] | null;
 seasonalNeedMm: readonly [number,number] | null;
 source: string;
 state: ParameterState;
 note: string;
}
export const CROP_WATER_REFERENCE: Record<Crop,CropWaterReference> = {
 Millet: {crop:'Millet',kc:[0.35,0.70,1.10,0.65],stageDays:[15,25,40,25],seasonalNeedMm:[450,650],source:FAO_WATER_SOURCE,state:'GENERIC_FAO_REFERENCE',note:'One 105-day FAO example; local millet variety and stages are unknown.'},
 Groundnut:{crop:'Groundnut',kc:[0.45,0.75,1.05,0.70],stageDays:[25,35,45,25],seasonalNeedMm:[500,700],source:FAO_WATER_SOURCE,state:'GENERIC_FAO_REFERENCE',note:'One 130-day FAO example; variety, management and soil demand local adjustment.'},
 Sorghum:{crop:'Sorghum',kc:[0.35,0.75,1.10,0.65],stageDays:[20,30,40,30],seasonalNeedMm:[450,650],source:FAO_WATER_SOURCE,state:'GENERIC_FAO_REFERENCE',note:'One 120-day FAO example, not local maturity calibration.'},
 Cowpea:{crop:'Cowpea',kc:null,stageDays:null,seasonalNeedMm:null,source:FAO_WATER_SOURCE,state:'NOT_ESTABLISHED',note:'Generic bean/pulse values are not automatically assigned to cowpea; specific validated parameterization missing.'}
};
export type CropWaterDay={date:string;dayAfterSowing:number;phase:Phase;kc:number;rainMm:number;etcReferenceMm:number|null};
export type WaterWindowResult={crop:Crop;source:Source;start:string;days:number;status:'REFERENCE_ONLY'|'ASSUMPTION_SCENARIO'|'PARAMETERS_MISSING';rainMm:number;wetDays:number;longestDryDays:number;kcDays:CropWaterDay[];referenceEtcMm:number|null;seasonCovered:false;warning:string[]};
function stageFor(index:number,durations:readonly number[]):{phase:Phase;stage:number}{
 let cumulative=0;
 for(let i=0;i<4;i++){cumulative+=durations[i];if(index<cumulative)return {phase:(['initial','development','mid','late'] as const)[i],stage:i};}
 throw new Error('Outside reference crop life cycle');
}
/**
 * Computes daily FAO-reference Kc schedule, optional illustrative ETc = Kc *
 * USER-ASSUMED constant ET0. Rainfall is historical NASA source data. No soil
 * water budget, rain effectiveness, actual ET0, yield, or drought conclusion.
 */
export function referenceWaterWindow(args:{crop:Crop;source:Source;rain:Rain[];sowing:string;days:number;rainThresholdMm?:number;assumedEtoMmDay?:number|null}):WaterWindowResult{
 const {crop,source,rain,sowing,days}=args;
 const threshold=args.rainThresholdMm??1,eto=args.assumedEtoMmDay??null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(sowing)||!Number.isInteger(days)||days<1||days>122||!Number.isFinite(threshold)||threshold<0|| (eto!==null&&(!Number.isFinite(eto)||eto<=0||eto>15)))throw Error('Invalid climate or ET0 assumptions');
 const ref=CROP_WATER_REFERENCE[crop];
 const rows:CropWaterDay[]=[];
 const byDate=new Map(rain.map(r=>[r.date,r]));
 if(byDate.size!==rain.length)throw Error('Duplicated climate dates');
 const start=Date.parse(sowing+'T00:00:00Z');
 if(!Number.isFinite(start)||new Date(start).toISOString().slice(0,10)!==sowing)throw Error('Invalid sowing date');
 if(ref.stageDays&&days>ref.stageDays.reduce((a,b)=>a+b,0))throw Error('Requested window exceeds illustrative crop duration');
 let total=0,wet=0,longest=0,run=0,referenceEtc=0;
 for(let i=0;i<days;i++){
  const date=new Date(start+i*86400000).toISOString().slice(0,10);
  const obs=byDate.get(date);if(!obs)throw Error('Missing NASA date '+date);
  const mm=obs[source];if(!Number.isFinite(mm)||mm<0)throw Error('Invalid NASA rainfall '+date);
  total+=mm; if(mm>=threshold){wet++;run=0;}else {run++;longest=Math.max(longest,run);}
  if(ref.kc&&ref.stageDays){const s=stageFor(i,ref.stageDays);const kc=ref.kc[s.stage];const etc=eto===null?null:kc*eto;
   if(etc!==null)referenceEtc+=etc;rows.push({date,dayAfterSowing:i+1,phase:s.phase,kc,rainMm:mm,etcReferenceMm:etc});}
 }
 return {crop,source,start:sowing,days,status:ref.kc?(eto===null?'REFERENCE_ONLY':'ASSUMPTION_SCENARIO'):'PARAMETERS_MISSING',rainMm:total,wetDays:wet,longestDryDays:longest,kcDays:rows,referenceEtcMm:ref.kc&&eto!==null?referenceEtc:null,seasonCovered:false,warning:[
  'Historical gridded rainfall is not future weather or measured soil water.',
  'The FAO coefficients and stage lengths are generic references, not crop-variety or site calibration.',
  'Rainfall versus ETc is not a soil water deficit: no runoff, infiltration, storage, deep drainage or effective rainfall model.',
  'No ordered rotation effects, yield or soil fertility outcome can be inferred.',
  ...(eto!==null?['ET0 is a user-entered constant SCENARIO, not a NASA observation or measured field value.']:['Actual daily ET0 is missing; no ETc is calculated.']),
  ...(ref.kc?[]:['Cowpea-specific Kc and stages are not established; a bean proxy is prohibited.'])
 ]};
}
