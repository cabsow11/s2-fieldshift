import {describe,it,expect} from 'vitest';
import {rotations,climateRotationScreen,pairDecision,DEFAULT_TOLERANCE,type Rain,type Field} from './engine';
import dataset from '../public/data/kaolack_2024.json';
const data=dataset.daily as Rain[];
const farm:Field={previous:'Groundnut',soil:'loamy',rainfed:true,seed:{Millet:'yes',Groundnut:'yes',Cowpea:'yes',Sorghum:'yes'}};
const rows=climateRotationScreen(rotations(farm),data,'2024-07-01',DEFAULT_TOLERANCE,1).rows;
const ids:[string,string]=['Millet-Groundnut','Millet-Cowpea'];
describe('Integrated NASA-linked illustrative frontier',()=>{
 it('keeps unknown fields unranked',()=>{const other=rotations({...farm,soil:'unknown'});expect(other.filter(r=>r.verdict==='YES')).toHaveLength(0)});
 it('offers 12 demo-admissible sequences but no repeated crops',()=>{const r=rotations(farm);expect(r.filter(x=>x.verdict==='YES')).toHaveLength(12);expect(r.filter(x=>x.verdict==='NO')).toHaveLength(4)});
 it('preserves two distinct sources',()=>{const result=climateRotationScreen(rotations(farm),data,'2024-07-01',DEFAULT_TOLERANCE,1);expect(result.windows.power.longestDryDays).toBe(3);expect(result.windows.imerg.longestDryDays).toBe(5)});
 it('uses the exact same selected pair for scores and regret',()=>{const a=pairDecision(rows,ids,.5);expect(a.options.map(x=>x.id)).toEqual(ids);expect(a.regrets).toHaveLength(2);expect(a.scores.power).toHaveLength(2)});
 it('finds an analytically exact crossing for both sources',()=>{const a=pairDecision(rows,ids,.5);for(const src of ['power','imerg'] as const){const w=a.reversal[src];expect(w).not.toBeNull();const crossing=pairDecision(rows,ids,w!);expect(crossing.scores[src][0]).toBeCloseTo(crossing.scores[src][1],8)}});
 it('does not invent a crossing if preference never reverses',()=>{const soil={Millet:60,Groundnut:60,Cowpea:60,Sorghum:60};const a=pairDecision(rows,ids,.5,soil);expect(a.reversal.power).toBeNull();expect(a.reversal.imerg).toBeNull()});
 it('rejects invalid or unknown pairs',()=>{expect(()=>pairDecision(rows,['Millet-Millet',ids[1]],.5)).toThrow();expect(()=>pairDecision(rows,[ids[0],ids[0]],.5)).toThrow();expect(()=>pairDecision(rows,ids,1.5)).toThrow()});
 it('updates score when priorities change',()=>{expect(pairDecision(rows,ids,.1).scores).not.toEqual(pairDecision(rows,ids,.9).scores)});
});
