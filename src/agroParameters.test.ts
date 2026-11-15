import {describe,it,expect} from 'vitest';
import {CROP_WATER_REFERENCE,referenceWaterWindow} from './agroParameters';
import type {Rain} from './engine';
const rain:Rain[]=Array.from({length:122},(_,i)=>({date:new Date(Date.UTC(2024,5,1+i)).toISOString().slice(0,10),power:2,imerg:3}));
const base={crop:'Millet' as const,source:'power' as const,rain,sowing:'2024-06-01',days:30};
describe('FAO evidence-based parameterization and observational guardrails',()=>{
 it('has exactly sourced FAO Kc for three crops',()=>{expect(CROP_WATER_REFERENCE.Millet.kc).toEqual([.35,.70,1.10,.65]);expect(CROP_WATER_REFERENCE.Groundnut.stageDays).toEqual([25,35,45,25]);expect(CROP_WATER_REFERENCE.Sorghum.seasonalNeedMm).toEqual([450,650])});
 it('refuses assigning bean coefficients to cowpea',()=>{expect(CROP_WATER_REFERENCE.Cowpea.kc).toBeNull();const x=referenceWaterWindow({...base,crop:'Cowpea',assumedEtoMmDay:5});expect(x.status).toBe('PARAMETERS_MISSING');expect(x.referenceEtcMm).toBeNull()});
 it('defaults to evidence-only without invented ET0',()=>{const x=referenceWaterWindow(base);expect(x.status).toBe('REFERENCE_ONLY');expect(x.referenceEtcMm).toBeNull();expect(x.rainMm).toBe(60);expect(x.kcDays).toHaveLength(30);expect(x.seasonCovered).toBe(false)});
 it('calculates 15 initial and 15 development days for millet under explicit scenario',()=>{const x=referenceWaterWindow({...base,assumedEtoMmDay:5});expect(x.status).toBe('ASSUMPTION_SCENARIO');expect(x.referenceEtcMm).toBeCloseTo(15*.35*5+15*.7*5,8);expect(x.kcDays[14].phase).toBe('initial');expect(x.kcDays[15].phase).toBe('development')});
 it('preserves separate NASA rainfall products without source averaging',()=>{const p=referenceWaterWindow(base);const i=referenceWaterWindow({...base,source:'imerg'});expect(i.rainMm).toBe(90);expect(p.rainMm).toBe(60)});
 it('rejects incomplete historical coverage',()=>{expect(()=>referenceWaterWindow({...base,sowing:'2024-09-15'})).toThrow('Missing NASA date')});
 it('rejects an invalid date or ET0',()=>{expect(()=>referenceWaterWindow({...base,sowing:'2024-02-30'})).toThrow();expect(()=>referenceWaterWindow({...base,assumedEtoMmDay:-2})).toThrow();expect(()=>referenceWaterWindow({...base,assumedEtoMmDay:Number.NaN})).toThrow()});
 it('rejects nonfinite or negative source observations',()=>{expect(()=>referenceWaterWindow({...base,rain:rain.map((r,i)=>i===5?{...r,power:-1}:r)})).toThrow()});
 it('does not confuse repeated records with daily coverage',()=>{expect(()=>referenceWaterWindow({...base,rain:[...rain,rain[0]]})).toThrow('Duplicated climate dates')});
 it('makes every scenario and noninference explicit',()=>{const x=referenceWaterWindow({...base,assumedEtoMmDay:5});expect(x.warning.some(s=>s.includes('user-entered'))).toBe(true);expect(x.warning.some(s=>s.includes('yield'))).toBe(true)});
});
