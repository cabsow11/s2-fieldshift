import {describe,it,expect} from 'vitest';
import {atlasValue,atlasSummary} from './ClimateAtlas';
import type {Rain} from './engine';
const days=[{date:'2024-07-01',power:0,imerg:2},{date:'2024-07-02',power:12,imerg:3}] as Rain[];
describe('Climate atlas source integrity',()=>{
 it('uses observed daily point values, not interpolated pixels',()=>{expect(atlasValue(days[0],'power')).toBe(0);expect(atlasValue(days[0],'gap')).toBe(2)});
 it('computes absolute daily source difference without claiming error',()=>{expect(atlasSummary(days,'gap').maximum).toBe(9);expect(atlasSummary(days,'gap').total).toBeNull()});
 it('computes precipitation totals and wet days on the chosen series',()=>{expect(atlasSummary(days,'power',1).total).toBe(12);expect(atlasSummary(days,'imerg',1).wetDays).toBe(2)});
 it('handles empty data without inventing results',()=>{expect(atlasSummary([],'power').maximum).toBeNull()});
});
