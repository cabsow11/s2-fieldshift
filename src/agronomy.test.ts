import {describe,it,expect} from 'vitest';
import {assessAgronomy,diagnoseHistoricalWindow} from './agronomy';
import type {Field,Rain} from './engine';
const data:Rain[]=Array.from({length:30},(_,i)=>({date:`2024-07-${String(i+1).padStart(2,'0')}`,power:i===0?10:0,imerg:i===0?0:i===1?6:0}));
const field:Field={previous:'Groundnut',soil:'loamy',rainfed:true,seed:{Millet:'yes',Groundnut:'yes',Cowpea:'yes',Sorghum:'yes'}};
describe('Evidence-grounded agronomic diagnostics',()=>{
 it('separates historical products and computes actual spells',()=>{const a=diagnoseHistoricalWindow(data,'power','2024-07-01');const b=diagnoseHistoricalWindow(data,'imerg','2024-07-01');expect(a.wetDays).toBe(1);expect(b.wetDays).toBe(1);expect(a.longestDryDays).toBe(29);expect(b.longestDryDays).toBe(28);});
 it('uses ordered crop-sequence evidence without invented benefit scores',()=>{const a=assessAgronomy('Groundnut','Millet',field,data,'2024-07-01');const b=assessAgronomy('Millet','Groundnut',field,data,'2024-07-01');expect(a.findings.find(f=>f.code==='rotation')?.references).toContain('L02-002');expect(b.findings.find(f=>f.code==='rotation')?.references).toContain('L03-003');expect(a.decisionStatus).toBe('NOT_RANKABLE');});
 it('never infers measured soil fitness from declared texture',()=>{const a=assessAgronomy('Millet','Cowpea',field,data,'2024-07-01');expect(a.findings.find(f=>f.code==='soil')?.status).toBe('NOT_ESTABLISHED');});
 it('rejects missing dates instead of smoothing or making up data',()=>{expect(()=>diagnoseHistoricalWindow(data.slice(1),'power','2024-07-01')).toThrow(/Missing/);});
 it('marks absent crop-sequence outcome as not established',()=>{const a=assessAgronomy('Sorghum','Cowpea',field,data,'2024-07-01');expect(a.findings.find(f=>f.code==='rotation')?.status).toBe('NOT_ESTABLISHED');});
 it('surfaces unavailable seeds and prior-crop unknowns',()=>{const a=assessAgronomy('Sorghum','Cowpea',{...field,previous:null,seed:{...field.seed,Cowpea:'unknown'}},data,'2024-07-01');expect(a.missingInputs).toContain('Previous field crop');expect(a.missingInputs).toContain('Cowpea seed availability confirmation');});
});
