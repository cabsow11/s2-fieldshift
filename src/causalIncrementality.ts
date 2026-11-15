/** Evidence-gated causal claims. Imported study assertions are unverified: they never auto-authorize effects. */
export type StudyDesign='randomized_field_trial'|'observational_cohort'|'quasi_experiment'|'review'|'mechanistic'|'unknown';
export type EffectRecord={id:string;title:string;doiOrUrl:string;design:StudyDesign;population:string;region:string;treatment:string;comparator:string;outcome:string;unit:string;estimate:number|null;lower95:number|null;upper95:number|null;sampleSize:number|null;assignmentDescribed:boolean;confoundersAddressed:boolean;consistencySupported:boolean;positivitySupported:boolean;effectModifiersMeasured:boolean;targetOverlapSupported:boolean;independentSourceReviewed:boolean;};
export type CausalGate={id:string;status:'NOT_IDENTIFIED'|'STUDY_EFFECT_ONLY'|'ELIGIBLE_FOR_CONTEXTUAL_REVIEW';estimate:number|null;interval:[number,number]|null;requirements:string[];scope:string;};
export const MISSING_EFFECT_MESSAGE='Causal effect not identified for the Kaolack pilot';
export function evaluateCausalEvidence(r:EffectRecord):CausalGate{
 const requirements:string[]=[];
 if(!r.independentSourceReviewed)requirements.push('Source has not been independently reviewed against its original publication');
 if(!r.doiOrUrl.trim()||!r.title.trim())requirements.push('Traceable study title and DOI/URL missing');
 if(!r.treatment.trim()||!r.comparator.trim()||!r.outcome.trim()||!r.unit.trim()||!r.population.trim())requirements.push('Treatment, comparator, outcome, unit, and study population must be specified');
 if(r.estimate===null||r.lower95===null||r.upper95===null||![r.estimate,r.lower95,r.upper95].every(Number.isFinite)||r.lower95>r.estimate||r.estimate>r.upper95)requirements.push('Valid point estimate and confidence interval required');
 if(r.design!=='randomized_field_trial')requirements.push('Only independently reviewed randomized field-trial contrasts enter the numerical study-effect display; other designs remain in documentary register pending design-specific audit');
 if(!r.assignmentDescribed)requirements.push('Assignment and allocation must be documented');
 if(!r.consistencySupported)requirements.push('Well-defined interventions and consistency need evaluation');
 if(!r.positivitySupported)requirements.push('Treatment/comparator overlap or eligibility must be documented');
 if(r.sampleSize===null||!Number.isInteger(r.sampleSize)||r.sampleSize<2)requirements.push('Valid sample size missing');
 if(requirements.length)return {id:r.id,status:'NOT_IDENTIFIED',estimate:null,interval:null,requirements,scope:MISSING_EFFECT_MESSAGE};
 const transport:string[]=[];
 if(!r.effectModifiersMeasured)transport.push('Effect modifiers relevant to target conditions not measured');
 if(!r.targetOverlapSupported)transport.push('Study-to-Kaolack covariate support not established');
 // Even a reviewed study estimate never becomes a Kaolack CATE without a justified transport estimator.
 return {id:r.id,status:transport.length?'STUDY_EFFECT_ONLY':'ELIGIBLE_FOR_CONTEXTUAL_REVIEW',estimate:r.estimate,interval:[r.lower95!,r.upper95!],requirements:[...transport,'This is the original study contrast, NOT an estimated Kaolack treatment effect; quantitative transport estimator is not implemented.'],scope:'Published study effect only; Kaolack causal effect not identified'};
}
export function reviewEvidenceRegister(records:EffectRecord[]):{total:number;notIdentified:number;studyOnly:number;contextReview:number;gates:CausalGate[];pilotEffect:number|null}{
 const gates=records.map(evaluateCausalEvidence);
 return {total:records.length,notIdentified:gates.filter(g=>g.status==='NOT_IDENTIFIED').length,studyOnly:gates.filter(g=>g.status==='STUDY_EFFECT_ONLY').length,contextReview:gates.filter(g=>g.status==='ELIGIBLE_FOR_CONTEXTUAL_REVIEW').length,gates,pilotEffect:null};
}
/** Safely ingest a JSON array as DOCUMENTARY candidates only; never grant independent review from uploaded content. */
export function parseUnreviewedRegister(json:string):EffectRecord[]{
 const v:unknown=JSON.parse(json);if(!Array.isArray(v)||v.length>100)throw Error('Expected an array of at most 100 records');
 return v.map((raw,i)=>{
  if(!raw||typeof raw!=='object')throw Error(`Invalid record ${i+1}`);
  const r=raw as Record<string,unknown>;
  const str=(key:string)=>typeof r[key]==='string'?(r[key] as string).slice(0,500):'';
  const nullable=(key:string)=>typeof r[key]==='number'&&Number.isFinite(r[key])?r[key] as number:null;
  const bool=(key:string)=>r[key]===true;
  const validDesign:StudyDesign[]=['randomized_field_trial','observational_cohort','quasi_experiment','review','mechanistic','unknown'];
  const design=validDesign.includes(str('design') as StudyDesign)?str('design') as StudyDesign:'unknown';
  return {id:str('id')||`entry-${i+1}`,title:str('title'),doiOrUrl:str('doiOrUrl'),design,population:str('population'),region:str('region'),treatment:str('treatment'),comparator:str('comparator'),outcome:str('outcome'),unit:str('unit'),estimate:nullable('estimate'),lower95:nullable('lower95'),upper95:nullable('upper95'),sampleSize:nullable('sampleSize'),assignmentDescribed:bool('assignmentDescribed'),confoundersAddressed:bool('confoundersAddressed'),consistencySupported:bool('consistencySupported'),positivitySupported:bool('positivitySupported'),effectModifiersMeasured:bool('effectModifiersMeasured'),targetOverlapSupported:bool('targetOverlapSupported'),independentSourceReviewed:false};
 });
}
