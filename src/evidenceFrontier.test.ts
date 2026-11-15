import {describe,it,expect} from 'vitest';
import {evidenceBoundedFrontier} from './evidenceFrontier';
import type {Field,Rain} from './engine';
import climate from '../public/data/kaolack_2024.json';
const data:Rain[]=climate.daily;
const field:Field={previous:'Groundnut',seed:{Millet:'yes',Groundnut:'yes',Cowpea:'yes',Sorghum:'yes'},soil:'loamy',rainfed:true};
const base={field,data,sowing:'2024-07-01',days:30,threshold:1};
describe('Evidence-bounded agricultural frontier',()=>{
 it('never invents yield/soil ranking or a reversal',()=>{const a=evidenceBoundedFrontier({...base,pair:['Millet-Groundnut','Sorghum-Groundnut'],etoMmDay:5});expect(a.agronomicWinner).toBeNull();expect(a.agronomicReversal).toBeNull();expect(a.agronomicRegret).toBeNull();});
 it('retains observed source disagreement without inventing independent seasons',()=>{const a=evidenceBoundedFrontier({...base,pair:['Millet-Groundnut','Sorghum-Groundnut']});expect(a.rainfall.power?.totalMm).toBeCloseTo(168.53,2);expect(a.rainfall.imerg?.totalMm).toBeCloseTo(190.69,2);expect(a.rainfall.power?.longestDryDays).toBe(3);expect(a.rainfall.imerg?.longestDryDays).toBe(5);});
 it('requires ET0 assumption before reporting ETc',()=>{const a=evidenceBoundedFrontier({...base,pair:['Millet-Groundnut','Sorghum-Groundnut']});expect(a.referenceDemand).toEqual([null,null]);expect(a.status).toBe('NOT_COMPARABLE');});
 it('computes explicitly conditional reference ETc for first crop only',()=>{const a=evidenceBoundedFrontier({...base,pair:['Millet-Groundnut','Sorghum-Groundnut'],etoMmDay:5});expect(a.referenceDemand[0]).toBeCloseTo(78.75,6);expect(a.referenceDemand[1]).toBeCloseTo(72.5,6);expect(a.status).toBe('PARTIAL_REFERENCE_COMPARISON');});
 it('does not borrow cowpea coefficients from generic beans',()=>{const a=evidenceBoundedFrontier({...base,pair:['Millet-Groundnut','Cowpea-Groundnut'],etoMmDay:5});expect(a.referenceDemand[1]).toBeNull();expect(a.demandRelation).toBe('NOT_IDENTIFIABLE');});
 it('excludes seed-unavailable candidates',()=>{const f={...field,seed:{...field.seed,Sorghum:'no' as const}};const a=evidenceBoundedFrontier({...base,field:f,pair:['Millet-Groundnut','Sorghum-Groundnut'],etoMmDay:5});expect(a.status).toBe('EXCLUDED');expect(a.agronomicWinner).toBeNull();});
 it('rejects invalid pair and ET0',()=>{expect(()=>evidenceBoundedFrontier({...base,pair:['Millet-Groundnut','Millet-Groundnut']})).toThrow();expect(()=>evidenceBoundedFrontier({...base,pair:['Millet-Groundnut','Sorghum-Groundnut'],etoMmDay:-1})).toThrow();});
 it('reference ETc is not falsely assigned to a NASA source',()=>{const a=evidenceBoundedFrontier({...base,pair:['Millet-Groundnut','Sorghum-Groundnut'],etoMmDay:5});expect(a.notes.join(' ')).toContain('independent of rainfall source');});
});
