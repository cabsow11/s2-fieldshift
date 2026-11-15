import {describe,it,expect} from 'vitest';
import {estimateTrialITT,type TrialProtocol} from './trialCausalEstimator';
const p:TrialProtocol={treatment:'A',comparator:'B',outcome:'Y',unit:'kg/ha',population:'synthetic trial',randomizationAudited:false,followupComplete:true,noInterferenceJustified:true,sourceVerified:false};
const rows=[{unitId:'1',assigned:'treatment' as const,outcome:10},{unitId:'2',assigned:'treatment' as const,outcome:12},{unitId:'3',assigned:'control' as const,outcome:4},{unitId:'4',assigned:'control' as const,outcome:6}];
describe('Gated randomized study ITT estimator',()=>{
 it('blocks unverified randomization and sources',()=>{const out=estimateTrialITT(rows,p);expect(out.status).toBe('NOT_IDENTIFIED');expect(out.difference).toBeNull()});
 it('computes sample ITT only for audited synthetic protocol fixture',()=>{const out=estimateTrialITT(rows,{...p,randomizationAudited:true,sourceVerified:true});expect(out.status).toBe('STUDY_ITT_ESTIMATED');expect(out.difference).toBeCloseTo(6);expect(out.se).toBeCloseTo(Math.sqrt(2));expect(out.estimand).toMatch(/not a Kaolack/)});
 it('blocks duplicates and missing arm',()=>{expect(estimateTrialITT([...rows,{...rows[0]}],{...p,randomizationAudited:true,sourceVerified:true}).status).toBe('NOT_IDENTIFIED');expect(estimateTrialITT(rows.slice(0,2),{...p,randomizationAudited:true,sourceVerified:true}).status).toBe('NOT_IDENTIFIED')});
});
