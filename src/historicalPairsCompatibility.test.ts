import {describe,it,expect} from 'vitest';
import extended from '../public/data/fieldshift_nasa_extended.json';
import {buildHistoricalPairs,rotationExposure,type HistoricalDay} from './historicalRotation';
import type {Field} from './engine';
const daily=extended.powerDaily as HistoricalDay[];
const field:Field={previous:'Groundnut',soil:'loamy',rainfed:true,seed:{Millet:'yes',Groundnut:'yes',Cowpea:'yes',Sorghum:'yes'}};
describe('Historical window API compatibility and evidence integrity',()=>{
 it('yields 10 contiguous two-season rainy-season windows from 2015–2025',()=>{
  const p=buildHistoricalPairs(daily,1);
  expect(p).toHaveLength(10);
  expect(p[0].first.start).toBe('2015-06-01');
  expect(p[0].second.end).toBe('2016-09-30');
  expect(p.at(-1)?.second.year).toBe(2025);
  expect(p.every(x=>x.first.days===122&&x.second.days===122)).toBe(true);
 });
 it('never interpolates missing days or duplicates',()=>{
  expect(buildHistoricalPairs(daily.filter(d=>d.date!=='2020-08-01'))).toHaveLength(8);
  expect(()=>buildHistoricalPairs([...daily,daily[0]])).toThrow();
 });
 it('rejects invalid rain and wet-day threshold',()=>{
  expect(()=>buildHistoricalPairs(daily,-1)).toThrow();
  expect(()=>buildHistoricalPairs([{date:'2020-06-01',rain:-2}])).toThrow();
 });
 it('labels crop positions without estimating a crop effect',()=>{
  const x=rotationExposure('Millet','Cowpea',field,buildHistoricalPairs(daily));
  expect(x.pairs).toHaveLength(10);
  expect(x.pairs.every(p=>p.yieldDifference===null&&!p.causalEffectIdentified)).toBe(true);
 });
});
