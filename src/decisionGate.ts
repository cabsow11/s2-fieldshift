import type {Crop, Field, Rain, Source, Verdict} from './engine';
import {assessAgronomy, type AgronomicAssessment} from './agronomy';

/** No learned crop responses; no hidden conversion of qualitative evidence to utility. */
export type GateOutcome='EXCLUDED'|'REQUIRES_FIELD_VERIFICATION';
export type EvidenceType='OBSERVED'|'DECLARED'|'DOCUMENTED_CONTEXT'|'MISSING';
export interface EvidenceItem {id:string;type:EvidenceType;label:string;description:string;references:string[]}
export interface PriorityAction {id:string;priority:1|2|3;action:string;why:string;wouldResolve:string[]}
export interface DecisionGate {
 rotation:[Crop,Crop]; outcome:GateOutcome; proofOfAgronomicSuperiority:false;
 demoFeasibility:Verdict; observations:Record<Source,{totalMm:number;wetDays:number;longestDryDays:number}>;
 sourceDifference:{totalMm:number;wetDays:number;longestDryDays:number};
 evidence:EvidenceItem[]; nextActions:PriorityAction[];
 recommendation:string; warnings:string[];
}
/** An evidence-preserving decision gate. The only hard exclusions are explicit seed absence
 * and repeated-crop sequences under the explorer's two-different-crops remit.
 * Passing these DOES NOT confer soil suitability or modelled farm performance. */
export function agriculturalDecisionGate(first:Crop,second:Crop,field:Field,data:Rain[],start:string,days=30,rainThreshold=1):DecisionGate {
 const diagnosis:AgronomicAssessment=assessAgronomy(first,second,field,data,start,days,rainThreshold);
 const repeated=first===second;
 const unavailable=field.seed[first]==='no'||field.seed[second]==='no';
 const outcome:GateOutcome=repeated||unavailable?'EXCLUDED':'REQUIRES_FIELD_VERIFICATION';
 const demoFeasibility:Verdict=outcome==='EXCLUDED'?'NO':field.soil==='unknown'||field.seed[first]==='unknown'||field.seed[second]==='unknown'?'UNKNOWN':'YES';
 const p=diagnosis.climate.power,i=diagnosis.climate.imerg;
 const evidence:EvidenceItem[]=[
  {id:'rain',type:'OBSERVED',label:'Historical rainfall, NOT future weather',description:`${days} daily observations from ${start}: POWER ${p.totalMm.toFixed(1)} mm / ${p.wetDays} wet days / ${p.longestDryDays}-day longest dry spell; IMERG ${i.totalMm.toFixed(1)} mm / ${i.wetDays} wet days / ${i.longestDryDays}-day longest dry spell.`,references:['L03-001']},
  {id:'resources',type:'DECLARED',label:'Farmer-entered inputs',description:`Soil texture: ${field.soil}; previous crop: ${field.previous??'unknown'}; seed availability: ${first} ${field.seed[first]}, ${second} ${field.seed[second]}; ${field.rainfed?'rainfed':'supplemental water declared'}. These values have not been independently verified.`,references:[]},
  ...diagnosis.findings.filter(f=>f.code==='rotation').map(f=>({id:'rotation-literature',type:(f.status==='DOCUMENTED_CONTEXT'?'DOCUMENTED_CONTEXT':'MISSING') as EvidenceType,label:'Crop order / literature',description:f.detail,references:f.references})),
  {id:'crop-response',type:'MISSING',label:'Measured crop-specific response',description:'No validated growth-stage water thresholds, soil-response coefficients, field yields, or crop prices for these rotations. Numerical agronomic preference cannot be inferred.',references:['L03-014','L03-015']}
 ];
 const nextActions:PriorityAction[]=[];
 const add=(id:string,priority:1|2|3,action:string,why:string,wouldResolve:string[])=>nextActions.push({id,priority,action,why,wouldResolve});
 if(repeated)add('choose-distinct',1,'Choose two different crops for a rotation.','This sequence repeats the same crop and lies outside the two-crop rotation comparison.',['Repeated-crop constraint']);
 for(const crop of [...new Set([first,second])] as Crop[]){
  if(field.seed[crop]==='no')add(`seed-${crop}`,1,`Find an available ${crop} seed source or exclude this option.`,`Seed availability was explicitly marked NO.`,['Seed availability']);
  if(field.seed[crop]==='unknown')add(`seed-${crop}`,1,`Confirm availability of ${crop} seed.`,`Unverified availability blocks a reliable planting plan.`,['Seed availability']);
 }
 if(field.previous===null)add('history',1,'Record the crop grown before the proposed sequence.','Carry-over and repetition constraints need the last planted crop.',['Previous crop']);
 if(field.soil==='unknown')add('texture',1,'Establish the field soil texture and collect a representative soil sample.','No soil description was provided.',['Basic soil description']);
 add('soil-test',1,'Test plot soil: texture, depth, pH, organic matter and major limiting factors.','A user-entered texture label cannot demonstrate that a particular crop will thrive.',['Crop-specific soil suitability']);
 add('calendar',1,'Confirm varieties, sowing dates, maturity windows and local agronomic advice.','Historical first-30-day rain metrics are not validated crop-stage drought-stress thresholds.',['Crop water stress and seasonal suitability']);
 add('trial-evidence',2,`Obtain field-trial or local extension evidence for the ordered sequence ${first} → ${second}.`,'Presence of a rotation in literature does not establish its quantified advantage for this field.',['Order-specific rotation benefit']);
 add('economics',3,'Collect local seed/input costs, labor constraints, expected prices and observed yields.','Without these inputs the system cannot optimize economic benefit.',['Profitability and farmer trade-offs']);
 nextActions.sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
 return {rotation:[first,second],outcome,proofOfAgronomicSuperiority:false,demoFeasibility,
  observations:{power:{totalMm:p.totalMm,wetDays:p.wetDays,longestDryDays:p.longestDryDays},imerg:{totalMm:i.totalMm,wetDays:i.wetDays,longestDryDays:i.longestDryDays}},
  sourceDifference:{totalMm:Math.abs(p.totalMm-i.totalMm),wetDays:Math.abs(p.wetDays-i.wetDays),longestDryDays:Math.abs(p.longestDryDays-i.longestDryDays)},
  evidence,nextActions,
  recommendation:outcome==='EXCLUDED'?'Exclude this sequence under the specified two-crop rotation and resource constraints.':'No validated crop recommendation. Retain as an exploratory candidate only, until field suitability, crop responses and farmer objectives can be checked.',
  warnings:['No yields, probabilities or farm-specific crop-water response have been estimated.','POWER and IMERG are alternative historical products, not independent forecasts or ground-truth gauges.','Two conceptual crop slots cannot be interpreted as actual two-year climate forecasts.']};
}
