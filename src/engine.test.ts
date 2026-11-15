import {describe,it,expect} from 'vitest';import {frontier,minimaxRegret,feasibility,summarize,discrepancy,Field} from './engine';
const field:Field={previous:null,soil:'sandy',rainfed:true,seed:{Millet:'yes',Groundnut:'yes',Cowpea:'yes',Sorghum:'yes'}};
describe('Scientific separation & algorithm contracts',()=>{
it('frontier crossing exact',()=>{expect(frontier(35/65).preferred).toBe('TIE');expect(frontier(.5).preferred).toBe('B');expect(frontier(.6).preferred).toBe('A');});
it('regret example with scenario-major matrix',()=>{const r=minimaxRegret([[70,30],[60,60]]);expect(r.maxRegret).toEqual([30,10]);expect(r.winners).toEqual([1]);});
it('repeating a crop is not labeled a rotation',()=>{expect(feasibility('Millet','Millet',field).verdict).toBe('NO');});
it('known seed unavailable blocks',()=>{expect(feasibility('Millet','Cowpea',{...field,seed:{...field.seed,Cowpea:'no'}}).verdict).toBe('NO');});
it('unknown soil stays unknown',()=>{expect(feasibility('Millet','Cowpea',{...field,soil:'unknown'}).verdict).toBe('UNKNOWN');});
it('wet day >= threshold, strict dry day',()=>{expect(summarize([{date:'a',power:0,imerg:0},{date:'b',power:1,imerg:1},{date:'c',power:0,imerg:0}], 'power',1)).toMatchObject({wet:1,longest:1,total:1});});
it('source MAE not truth error',()=>{expect(discrepancy([{date:'a',power:10,imerg:0},{date:'b',power:0,imerg:10}])).toMatchObject({mae:10,rmse:10,mean:0});});
});
import {climateWindow,climateRotationScreen,DEFAULT_TOLERANCE,proxyScore,rotations} from './engine';
describe('NASA-to-decision exploratory link',()=>{
 const d=Array.from({length:30},(_,i)=>({date:`2024-07-${String(i+1).padStart(2,'0')}`,power:i<9?0:2,imerg:i<13?0:2}));
 it('computes distinct source dry streaks from the same dates',()=>{
  expect(climateWindow(d,'power','2024-07-01',30,1).longestDryDays).toBe(9);
  expect(climateWindow(d,'imerg','2024-07-01',30,1).longestDryDays).toBe(13);
 });
 it('uses actual rainfall, not source averaging, and screens only YES',()=>{
  const r=climateRotationScreen(rotations(field),d,'2024-07-01',DEFAULT_TOLERANCE);
  expect(r.windows.power.longestDryDays).toBe(9);
  expect(r.windows.imerg.longestDryDays).toBe(13);
  const candidate=r.rows.find(x=>x.id==='Millet-Groundnut')!;
  expect(candidate.sourceScores.power).not.toBe(candidate.sourceScores.imerg);
  expect(candidate.maxRegret).not.toBeNull();
  const unknown=climateRotationScreen(rotations({...field,soil:'unknown'}),d,'2024-07-01',DEFAULT_TOLERANCE);
  expect(unknown.winners).toEqual([]);
  expect(unknown.rows.every(x=>x.maxRegret===null)).toBe(true);
 });
 it('prevents missing dates and rejects invalid assumptions',()=>{
  expect(()=>climateWindow(d.slice(1),'power','2024-07-01',30,1)).toThrow();
  expect(()=>proxyScore(5,0)).toThrow();
  expect(proxyScore(5,5)).toBe(50);
 });
 it('keeps symmetric crop pair scoring explicit (no invented order benefit)',()=>{
  const r=climateRotationScreen(rotations(field),d,'2024-07-01',DEFAULT_TOLERANCE);
  expect(r.rows.find(x=>x.id==='Millet-Groundnut')!.sourceScores).toEqual(r.rows.find(x=>x.id==='Groundnut-Millet')!.sourceScores);
 });
});
