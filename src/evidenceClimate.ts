import type {Crop,Field,Rain,Source} from './engine';
import {diagnoseHistoricalWindow} from './agronomy';

/** Every relation below is a DOCUMENTARY context signal, NOT a validated gain or yield coefficient. */
export type KnowledgeState = 'DOCUMENTED_SYSTEM'|'SPECIFIC_STUDY'|'NOT_ESTABLISHED';
export type EvidenceRule = {id:string;crop:Crop;dimension:'calendar'|'soil'|'water'|'rotation'|'economic';label:string;claim:string;state:'METHOD'|'CONTEXT'|'NOT_CALIBRATED';references:string[];requiredInputs:string[]};
export const CROP_EVIDENCE: EvidenceRule[] = [
 {id:'M-WATER',crop:'Millet',dimension:'water',label:'Post-sowing rainfall distribution',claim:'Season onset and the longest subsequent dry spell are relevant descriptors; no millet-specific failure threshold has been established here.',state:'CONTEXT',references:['L03-001'],requiredInputs:['Millet variety and maturity window','Site-validated moisture/stress thresholds']},
 {id:'M-SOIL',crop:'Millet',dimension:'soil',label:'Soil limiting factors',claim:'A plot-specific soil test is required to infer suitability; a declared texture does not establish yield potential.',state:'METHOD',references:['L03-004'],requiredInputs:['Plot pH, effective soil depth, organic matter, texture']},
 {id:'G-ROT',crop:'Groundnut',dimension:'rotation',label:'Millet–groundnut cropping system',claim:'A millet–groundnut rotation has been investigated locally; this is not proof of an order-specific yield advantage on this field.',state:'CONTEXT',references:['L03-003','L02-003'],requiredInputs:['Field management, previous crops, amendments and local trial outcomes']},
 {id:'G-POST',crop:'Groundnut',dimension:'economic',label:'Postharvest management',claim:'Drying and storage conditions are a documented operational consideration, but no site-specific cost or risk score is available.',state:'CONTEXT',references:['L03-009'],requiredInputs:['Drying and storage capacity','Local selling and input costs']},
 {id:'C-WATER',crop:'Cowpea',dimension:'water',label:'Crop-specific water response',claim:'FAO water-balance and yield-response methods cannot be parameterized for this cowpea variety with the available dataset.',state:'NOT_CALIBRATED',references:['L03-014','L03-015'],requiredInputs:['Cowpea variety and growth stages','Local Kc, soil storage, ET0 and stress response']},
 {id:'C-ROT',crop:'Cowpea',dimension:'rotation',label:'Millet–cowpea evidence gap',claim:'The cited millet–mung bean intercropping evidence does not establish a millet–cowpea annual rotation benefit; mung bean and cowpea are different crops.',state:'NOT_CALIBRATED',references:['L03-005'],requiredInputs:['Local ordered cowpea rotation trial']},
 {id:'S-ONSET',crop:'Sorghum',dimension:'calendar',label:'Rainfall onset and sowing date',claim:'Sorghum-focused onset definitions have been explored using simulations in Senegal; they are not a calibrated sowing-date rule for this farm.',state:'CONTEXT',references:['L03-002'],requiredInputs:['Sorghum variety and duration','Soil moisture measurements and local onset validation']},
 {id:'S-WATER',crop:'Sorghum',dimension:'water',label:'Water-balance model inputs',claim:'Stage-specific evapotranspiration requires location and cultivar inputs not present in this demonstration.',state:'METHOD',references:['L03-014','L03-015'],requiredInputs:['ET0, sorghum Kc/stages, usable soil water']}
];
export type CropCheck = {crop:Crop;rules:EvidenceRule[];suitability:'NOT_ESTABLISHED';reason:string};
export function cropKnowledge(crop:Crop):CropCheck {
 return {crop,rules:CROP_EVIDENCE.filter(r=>r.crop===crop),suitability:'NOT_ESTABLISHED',reason:'Published context is not a plot-level suitability or yield calibration.'};
}
export type SourceWindow = {source:Source;start:string;days:number;rainMm:number;wetDays:number;dryDays:number;firstWetDate:string|null};
export type HistoricalSignal={start:string;coverage:'COMPLETE'|'INCOMPLETE';windows:Partial<Record<Source,SourceWindow>>;note:string};
/** Does not infer agronomic sowing thresholds, predict future seasons, or impute missing days. */
export function historicalSignals(data:Rain[],start:string,days=30,rainThreshold=1):HistoricalSignal {
 const windows:Partial<Record<Source,SourceWindow>>={};
 for(const source of ['power','imerg'] as const){
  try {const v=diagnoseHistoricalWindow(data,source,start,days,rainThreshold);windows[source]={source,start,days,rainMm:v.totalMm,wetDays:v.wetDays,dryDays:v.longestDryDays,firstWetDate:v.firstWetDate};}
  catch { /* An incomplete window remains unobserved; never silently extrapolate. */ }
 }
 return {start,coverage:windows.power&&windows.imerg?'COMPLETE':'INCOMPLETE',windows,note:'Historical gridded precipitation estimates only. Observed dry spells are not crop stress or future-season forecasts.'};
}
export type RotationKnowledge={rotation:[Crop,Crop];sequenceEvidence:'STUDIED_SYSTEM'|'NOT_ESTABLISHED';referenceIds:string[];hardConstraint:'EXCLUDED'|'NO_KNOWN_EXCLUSION';fieldRecommendation:'WITHHELD';missing:string[];signals:HistoricalSignal;stages:'NOT_ASSESSED';why:string[]};
export function evaluateDocumentedRotation(first:Crop,second:Crop,field:Field,data:Rain[],start:string,days=30,rainThreshold=1):RotationKnowledge {
 const studied=first==='Millet'&&second==='Groundnut'||first==='Groundnut'&&second==='Millet';
 const repeated=first===second;const absent=field.seed[first]==='no'||field.seed[second]==='no';
 const missing=new Set<string>();
 if(field.soil==='unknown') missing.add('Measured plot soil texture and chemistry');
 else missing.add('Measured plot pH, organic matter and effective soil depth');
 if(field.previous===null)missing.add('Prior-season field history');
 for(const c of new Set([first,second])){
  if(field.seed[c]==='unknown')missing.add(`${c} seed confirmation`);
  for(const rule of cropKnowledge(c).rules)for(const need of rule.requiredInputs)missing.add(need);
 }
 if(!studied) missing.add(`Local ordered-sequence evidence for ${first} → ${second}`);
 const signals=historicalSignals(data,start,days,rainThreshold);
 if(signals.coverage==='INCOMPLETE')missing.add('Complete matched NASA observational coverage');
 return {rotation:[first,second],sequenceEvidence:studied?'STUDIED_SYSTEM':'NOT_ESTABLISHED',referenceIds:studied?(first==='Millet'?['L03-003','L02-003']:['L02-002','L02-003']):[],hardConstraint:repeated||absent?'EXCLUDED':'NO_KNOWN_EXCLUSION',fieldRecommendation:'WITHHELD',missing:[...missing],signals,stages:'NOT_ASSESSED',why:[studied?'This ordered system appears in local studies; its field-level effect is not established.':'No validated pair-specific effect is available from the selected evidence register.', 'Rainfall measures describe historical exposure, not actual crop water deficit, ET0, growth-stage stress or yield.', 'The second crop slot is a conceptual rotation year, not a measured second-year precipitation scenario.']};
}
