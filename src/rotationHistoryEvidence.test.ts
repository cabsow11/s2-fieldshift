import { describe, expect, it } from 'vitest';
import { assessRotationHistory, parseRotationId } from './rotationHistoryEvidence';
import type {Field} from './engine';
const field: Field={previous:'Millet',soil:'unknown',rainfed:true,seed:{Millet:'yes',Groundnut:'yes',Cowpea:'unknown',Sorghum:'yes'}};
describe('historical rotation evidence gate',()=>{
 it('parses only known crops',()=>{expect(parseRotationId('Millet-Cowpea')).toEqual(['Millet','Cowpea']);expect(()=>parseRotationId('Millet-Maize')).toThrow();});
 it('preserves uncertainty and forbids benefit assertion',()=>{const x=assessRotationHistory('Millet-Cowpea',field);expect(x.repeatsPreviousCrop).toBe(true);expect(x.benefitEstablished).toBe(false);expect(x.outcome).toBe('FIELD_VERIFICATION_REQUIRED');});
 it('marks absent previous crop missing',()=>{const x=assessRotationHistory('Millet-Groundnut',{...field,previous:null});expect(x.historyStatus).toBe('MISSING');expect(x.repeatsPreviousCrop).toBeNull();});
 it('does not treat repeated crop as two-crop rotation',()=>{expect(assessRotationHistory('Millet-Millet',field).outcome).toBe('EXCLUDED_BY_EXPLORER_SCOPE');});
});
