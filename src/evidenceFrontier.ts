import type { Crop, Field, Rain, Source } from './engine';
import { CROP_WATER_REFERENCE, referenceWaterWindow } from './agroParameters';
import { agriculturalDecisionGate } from './decisionGate';

/** This module intentionally performs no yield, soil fertility or profit ranking.
 * Scope: evidence comparability, conditional FAO-reference water-demand ordering,
 * and decision non-identifiability. POWER / IMERG are historical data products.
 */
export type EvidenceFrontierStatus = 'EXCLUDED'|'NOT_COMPARABLE'|'PARTIAL_REFERENCE_COMPARISON';
export type DemandRelation = 'A_LESS_REFERENCE_ETC'|'B_LESS_REFERENCE_ETC'|'EQUAL_REFERENCE_ETC'|'NOT_IDENTIFIABLE';
export interface EvidenceFrontierResult {
 pair: readonly [string,string];
 status: EvidenceFrontierStatus;
 demandRelation: DemandRelation;
 etoAssumption: number|null;
 cropOne: readonly [Crop,Crop];
 kcs: readonly [number|null,number|null];
 referenceDemand: readonly [number|null,number|null];
 rainfall: Record<Source,{totalMm:number;wetDays:number;longestDryDays:number}|null>;
 agronomicWinner:null;
 agronomicReversal:null;
 agronomicRegret:null;
 whatCanBeCompared:string[];
 blockers:string[];
 notes:string[];
}
const sources:Source[]=['power','imerg'];
export function evidenceBoundedFrontier(args:{
 pair:readonly [string,string];field:Field;data:Rain[];sowing:string;days?:number;threshold?:number;etoMmDay?:number|null;
}):EvidenceFrontierResult {
 const {pair,field,data,sowing}=args;
 const days=args.days??30, threshold=args.threshold??1, eto=args.etoMmDay??null;
 if(pair.length!==2||pair[0]===pair[1])throw Error('Select two distinct rotation IDs');
 if(eto!==null&&(!Number.isFinite(eto)||eto<=0||eto>15))throw Error('ET0 assumption must be 0 < ET0 <= 15');
 const parse=(id:string):[Crop,Crop]=>{
  const parts=id.split('-');
  if(parts.length!==2||parts.some(p=>!['Millet','Groundnut','Cowpea','Sorghum'].includes(p)))throw Error('Invalid rotation ID');
  return parts as [Crop,Crop];
 };
 const a=parse(pair[0]),b=parse(pair[1]);
 const gateA=agriculturalDecisionGate(a[0],a[1],field,data,sowing,days,threshold);
 const gateB=agriculturalDecisionGate(b[0],b[1],field,data,sowing,days,threshold);
 const excluded=gateA.outcome==='EXCLUDED'||gateB.outcome==='EXCLUDED';
 const demands:[number|null,number|null]=[null,null];
 const dailyKc:[number|null,number|null]=[null,null];
 const rainfall={} as EvidenceFrontierResult['rainfall'];
 // Historical rainfall and *first-crop* generic reference ETc are computed over
 // the same dated window. Second-year weather and crop response are unknown.
 for(const s of sources){
  const ref=referenceWaterWindow({crop:a[0],source:s,rain:data,sowing,days,rainThresholdMm:threshold,assumedEtoMmDay:eto});
  rainfall[s]={totalMm:ref.rainMm,wetDays:ref.wetDays,longestDryDays:ref.longestDryDays};
 }
 for(let i=0;i<2;i++){
  const crop=i===0?a[0]:b[0];
  const ref=CROP_WATER_REFERENCE[crop];
  if(ref.kc&&ref.stageDays&&days<=ref.stageDays.reduce((x,y)=>x+y,0)){
   const window=referenceWaterWindow({crop,source:'power',rain:data,sowing,days,rainThresholdMm:threshold,assumedEtoMmDay:eto});
   dailyKc[i]=window.kcDays.reduce((sum,d)=>sum+d.kc,0)/days;
   demands[i]=window.referenceEtcMm;
  }
 }
 let demandRelation:DemandRelation='NOT_IDENTIFIABLE';
 if(demands.every(x=>x!==null)){
  const diff=demands[0]!-demands[1]!;
  demandRelation=Math.abs(diff)<1e-9?'EQUAL_REFERENCE_ETC':diff<0?'A_LESS_REFERENCE_ETC':'B_LESS_REFERENCE_ETC';
 }
 const blockers=[
  'No plot-calibrated crop yield, soil-fertility or ordered-rotation response coefficients.',
  'No observed future season-two climate; a 2024 window cannot represent both years.',
  'No measured water holding capacity, infiltration, effective rainfall, runoff or daily local ET0.',
  'Economic trade-offs and farmer-specific outcomes cannot be quantified from the current inputs.'
 ];
 if(eto===null)blockers.unshift('A daily ET0 input is missing; no crop ETc comparison is performed.');
 if(!CROP_WATER_REFERENCE[a[0]].kc||!CROP_WATER_REFERENCE[b[0]].kc)blockers.unshift('At least one first crop lacks validated reference Kc/stage parameters (cowpea is not proxied).');
 if(excluded)blockers.unshift('At least one selected rotation violates an explicit two-crop or seed-availability constraint.');
 return {
  pair,status:excluded?'EXCLUDED':!demands.every(x=>x!==null)?'NOT_COMPARABLE':'PARTIAL_REFERENCE_COMPARISON',
  demandRelation,etoAssumption:eto,cropOne:[a[0],b[0]],kcs:dailyKc,referenceDemand:demands,rainfall,
  agronomicWinner:null,agronomicReversal:null,agronomicRegret:null,
  whatCanBeCompared:[
   'Matched NASA POWER and GPM IMERG historical rainfall metrics (source estimates, not ground truth).',
   'First-crop generic FAO Kc stage schedules, when available, over the same 30-day historical window.',
   ...(demands.every(x=>x!==null)?['Conditional relative FAO-reference ETc with the identical user-assumed ET0; lower ETc is NOT evidence of a superior rotation.']:[]),
   'Resource exclusions explicitly declared by the farmer, without claiming soil suitability.'
  ],blockers,
  notes:[
   'ETc is a generic reference DEMAND, not a crop-stress or yield estimate. It is independent of rainfall source when ET0 and Kc are held fixed.',
   'POWER–IMERG disagreement cannot by itself produce an order-specific agronomic ranking or decision reversal.',
   'A scientifically valid decision frontier may contain NO agricultural crossing; this is the correct output when comparative attributes are unidentified.',
   'Second crop is retained as a sequence label, not simulated as a second-year crop outcome.'
  ]
 };
}
