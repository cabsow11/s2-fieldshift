import {describe,it,expect} from 'vitest';
import {readCSV,checkDataset,descriptiveYields,summarySoil} from './additionalEvidence';
const row=(t:string)=>readCSV(t);
describe('User dataset validation and evidence boundaries',()=>{
 it('parses CSV quotes and BOM',()=>expect(row('\uFEFFname,source\n"field, one",Lab\n')[0].name).toBe('field, one'));
 it('rejects missing provenance',()=>expect(()=>checkDataset('smap',row('date,surface,rootzone,latitude,longitude,source\n2024-06-01,0.2,0.3,14,-16,\n'))).toThrow(/source/));
 it('rejects invalid calendar days',()=>expect(()=>checkDataset('smap',row('date,surface,rootzone,latitude,longitude,source\n2024-02-30,0.2,0.3,14,-16,NASA\n'))).toThrow(/date/));
 it('rejects impossible moisture',()=>expect(()=>checkDataset('smap',row('date,surface,rootzone,latitude,longitude,source\n2024-06-01,1.2,0.3,14,-16,NASA\n'))).toThrow(/surface/));
 it('accepts valid georeferenced pixels',()=>expect(checkDataset('imerg',row('date,lat,lon,rain_mm,source\n2024-06-01,14.15,-16.05,12,NASA V07B\n')).summary).toMatch(/1 precipitation pixels/));
 it('refuses zero-property soil rows',()=>expect(()=>checkDataset('soil',row('latitude,longitude,depth_cm,ph,measurement_type,source\n14,-16,5,,soilgrids_model,ISRIC\n'))).toThrow(/property/));
 it('preserves model versus laboratory measurement provenance',()=>expect(checkDataset('soil',row('latitude,longitude,depth_cm,ph,measurement_type,source\n14,-16,5,6.5,soilgrids_model,ISRIC\n')).rows[0].measurement_type).toBe('soilgrids_model'));
 it('summarises observed yields without claiming causal effects',()=>{const r=row('plot_id,season,crop,previous_crop,yield_kg_ha,source\na,2024,Millet,Groundnut,900,trial\nb,2024,Millet,Groundnut,1100,trial\n');expect(descriptiveYields(checkDataset('trials',r).rows)[0].mean).toBe(1000)});
 it('handles soil property missingness',()=>expect(summarySoil(row('ph,clay_pct\n5.7,\n'))[1].mean).toBeNull());
 it('blocks duplicate raster keys',()=>expect(()=>checkDataset('imerg',row('date,lat,lon,rain_mm,source\n2024-06-01,14,-16,5,NASA\n2024-06-01,14,-16,7,NASA\n'))).toThrow(/Duplicate/));
});
