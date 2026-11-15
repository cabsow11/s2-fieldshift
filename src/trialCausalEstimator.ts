/** Neyman-style unadjusted ITT contrast for externally verified, fully observed randomized trial arms.
 * This function is not called with NASA climate observations. No target transport is implemented.
 */
export type TrialRow={unitId:string;assigned:'treatment'|'control';outcome:number};
export type TrialProtocol={treatment:string;comparator:string;outcome:string;unit:string;population:string;randomizationAudited:boolean;followupComplete:boolean;noInterferenceJustified:boolean;sourceVerified:boolean};
export type TrialEstimate={status:'NOT_IDENTIFIED'|'STUDY_ITT_ESTIMATED';reason:string[];difference:number|null;se:number|null;lower95:number|null;upper95:number|null;nTreatment:number;nControl:number;estimand:string};
export function estimateTrialITT(rows:TrialRow[],p:TrialProtocol):TrialEstimate{
 const nt=rows.filter(r=>r.assigned==='treatment').length,nc=rows.filter(r=>r.assigned==='control').length;
 const base={nTreatment:nt,nControl:nc,estimand:'Study sample: intention-to-treat difference in mean outcomes (assigned treatment minus assigned control), not a Kaolack CATE'};
 const reason:string[]=[];
 if(!p.randomizationAudited)reason.push('Random assignment not independently audited');
 if(!p.sourceVerified)reason.push('Source dataset and protocol not independently verified');
 if(!p.followupComplete)reason.push('Outcome missingness/attrition unassessed');
 if(!p.noInterferenceJustified)reason.push('Potential treatment interference not addressed');
 if(!p.population.trim()||!p.treatment.trim()||!p.comparator.trim()||!p.outcome.trim()||!p.unit.trim())reason.push('Target estimand and outcome unit not fully described');
 if(nt<2||nc<2)reason.push('At least two observed units per arm required for a variance estimate');
 if(new Set(rows.map(r=>r.unitId)).size!==rows.length||rows.some(r=>!r.unitId||!Number.isFinite(r.outcome)||!['treatment','control'].includes(r.assigned)))reason.push('Duplicate units, invalid assignments, or nonfinite outcomes');
 if(reason.length)return {status:'NOT_IDENTIFIED',reason,difference:null,se:null,lower95:null,upper95:null,...base};
 const t=rows.filter(r=>r.assigned==='treatment').map(r=>r.outcome),c=rows.filter(r=>r.assigned==='control').map(r=>r.outcome);
 const mean=(x:number[])=>x.reduce((a,b)=>a+b,0)/x.length;
 const variance=(x:number[])=>{const m=mean(x);return x.reduce((a,b)=>a+(b-m)**2,0)/(x.length-1)};
 const difference=mean(t)-mean(c),se=Math.sqrt(variance(t)/t.length+variance(c)/c.length);
 // z-interval is illustrative large-sample approximation; small samples need t/robust/randomization inference.
 return {status:'STUDY_ITT_ESTIMATED',reason:['Unadjusted difference-in-means; normal-approximation 95% CI; no cluster correction or interference correction','Not transported to Kaolack and not a crop rotation effect unless the studied interventions exactly match'],difference,se,lower95:difference-1.96*se,upper95:difference+1.96*se,...base};
}
