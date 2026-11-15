import {describe,it,expect} from 'vitest';
import {evaluateCausalEvidence,parseUnreviewedRegister,reviewEvidenceRegister,type EffectRecord} from './causalIncrementality';
const r:EffectRecord={id:'hypothetical',title:'Demo only',doiOrUrl:'doi:demo',design:'randomized_field_trial',population:'external study',region:'outside target',treatment:'Groundnut-Millet',comparator:'Millet-Groundnut',outcome:'Yield',unit:'kg/ha',estimate:10,lower95:3,upper95:17,sampleSize:100,assignmentDescribed:true,confoundersAddressed:true,consistencySupported:true,positivitySupported:true,effectModifiersMeasured:false,targetOverlapSupported:false,independentSourceReviewed:false};
describe('Causal evidence governance',()=>{
 it('refuses unreviewed numeric estimates',()=>{expect(evaluateCausalEvidence(r).status).toBe('NOT_IDENTIFIED');expect(evaluateCausalEvidence(r).estimate).toBeNull()});
 it('cannot self-certify from imported JSON',()=>{const parsed=parseUnreviewedRegister(JSON.stringify([{...r,independentSourceReviewed:true}]));expect(parsed[0].independentSourceReviewed).toBe(false);expect(reviewEvidenceRegister(parsed).pilotEffect).toBeNull()});
 it('blocks malformed intervals',()=>{expect(evaluateCausalEvidence({...r,independentSourceReviewed:true,lower95:15}).status).toBe('NOT_IDENTIFIED')});
 it('does not transfer reviewed study estimate to Kaolack',()=>{const g=evaluateCausalEvidence({...r,independentSourceReviewed:true});expect(g.status).toBe('STUDY_EFFECT_ONLY');expect(g.scope).toMatch(/Kaolack causal effect not identified/)});
 it('distinguishes contextual review from a transported estimate',()=>{const g=evaluateCausalEvidence({...r,independentSourceReviewed:true,targetOverlapSupported:true,effectModifiersMeasured:true});expect(g.status).toBe('ELIGIBLE_FOR_CONTEXTUAL_REVIEW');expect(reviewEvidenceRegister([{...r,independentSourceReviewed:true,targetOverlapSupported:true,effectModifiersMeasured:true}]).pilotEffect).toBeNull()});
 it('rejects wrong payload shape',()=>{expect(()=>parseUnreviewedRegister('{}')).toThrow()});
});
