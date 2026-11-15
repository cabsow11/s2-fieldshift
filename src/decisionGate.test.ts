import {describe,it,expect} from 'vitest';
import {agriculturalDecisionGate} from './decisionGate';
import type {Field,Rain} from './engine';
const rain:Rain[]=Array.from({length:30},(_,j)=>({date:`2024-07-${String(j+1).padStart(2,'0')}`,power:j%3===0?4:0,imerg:j%6===0?7:0}));
const field:Field={previous:'Groundnut',soil:'loamy',rainfed:true,seed:{Millet:'yes',Groundnut:'yes',Cowpea:'yes',Sorghum:'yes'}};
describe('Agricultural decision gate: no unsourced recommendations',()=>{
 it('returns observable NASA features without yield claims',()=>{const x=agriculturalDecisionGate('Millet','Groundnut',field,rain,'2024-07-01');expect(x.observations.power.wetDays).toBe(10);expect(x.observations.imerg.wetDays).toBe(5);expect(x.proofOfAgronomicSuperiority).toBe(false);expect(x.outcome).toBe('REQUIRES_FIELD_VERIFICATION');});
 it('never treats demo-feasible as field-recommended',()=>{const x=agriculturalDecisionGate('Millet','Cowpea',field,rain,'2024-07-01');expect(x.demoFeasibility).toBe('YES');expect(x.outcome).toBe('REQUIRES_FIELD_VERIFICATION');expect(x.evidence.some(e=>e.id==='crop-response'&&e.type==='MISSING')).toBe(true);});
 it('excludes unavailable seed and flags missing input',()=>{const f={...field,seed:{...field.seed,Cowpea:'no' as const}};const x=agriculturalDecisionGate('Millet','Cowpea',f,rain,'2024-07-01');expect(x.outcome).toBe('EXCLUDED');expect(x.nextActions.some(a=>a.id==='seed-Cowpea'&&a.priority===1)).toBe(true);});
 it('excludes repeated crop',()=>{expect(agriculturalDecisionGate('Millet','Millet',field,rain,'2024-07-01').outcome).toBe('EXCLUDED');});
 it('raises unknown seeds and previous crop priorities',()=>{const f={...field,previous:null,soil:'unknown' as const,seed:{...field.seed,Millet:'unknown' as const}};const x=agriculturalDecisionGate('Millet','Cowpea',f,rain,'2024-07-01');expect(x.demoFeasibility).toBe('UNKNOWN');expect(x.nextActions.some(a=>a.id==='history'&&a.priority===1)).toBe(true);expect(x.nextActions.some(a=>a.id==='texture'&&a.priority===1)).toBe(true);});
 it('preserves order-specific distinctions without inventing profit',()=>{const a=agriculturalDecisionGate('Millet','Groundnut',field,rain,'2024-07-01');const b=agriculturalDecisionGate('Groundnut','Millet',field,rain,'2024-07-01');expect(a.evidence.find(e=>e.id==='rotation-literature')?.description).not.toEqual(b.evidence.find(e=>e.id==='rotation-literature')?.description);expect(a.evidence.find(e=>e.id==='crop-response')?.type).toBe('MISSING');});
 it('refuses missing NASA day instead of interpolation',()=>expect(()=>agriculturalDecisionGate('Millet','Cowpea',field,rain.slice(1),'2024-07-01')).toThrow(/Missing/));
});
