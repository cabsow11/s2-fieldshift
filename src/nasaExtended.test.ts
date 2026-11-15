import {describe,it,expect} from 'vitest';
import archived from '../public/data/fieldshift_nasa_extended.json';
import {calculateYearSummary,selectedPixelStats} from './NASADataWorkbench';
describe('NASA extended source QA',()=>{
 it('keeps 4018 dated POWER rows and 11 complete annual summaries',()=>{expect(archived.powerDaily).toHaveLength(4018);expect(archived.annual).toHaveLength(11);expect(new Set(archived.powerDaily.map(x=>x.date)).size).toBe(4018)});
 it('does not silently treat sparse soil measurements as continuous',()=>{expect(archived.smapSamples).toHaveLength(9)});
 it('restricts spatial heatmaps to ten observed dates and 25 grid pixels each',()=>{expect(archived.imergSpatial).toHaveLength(250);for(const date of archived.metadata.spatial.dates) expect(selectedPixelStats(archived.imergSpatial,date).count).toBe(25)});
 it('matches annual metric aggregation from daily records',()=>{for(const a of archived.annual){const got=calculateYearSummary(archived.powerDaily,a.year);expect(got.days).toBe(a.days);expect(got.rain).toBeCloseTo(a.rain,1);expect(got.jjas).toBeCloseTo(a.jjas,1)}});
 it('does not generate pixels for missing dates',()=>expect(selectedPixelStats(archived.imergSpatial,'2024-08-04').count).toBe(0));
});
