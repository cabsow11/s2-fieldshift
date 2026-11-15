import {describe,it,expect} from 'vitest';
import {analyzeSoil,parseSoilProfiles,rotationSoilMechanisms} from './soilHealth';
const header='latitude,longitude,depth_cm,ph,clay_pct,sand_pct,soc_g_kg,total_n_g_kg,measurement_type,source,sample_date,ph_q05,ph_q95';
const line='14.15,-16.08,5,6.3,15,75,7.2,0.5,soilgrids_model,ISRIC SoilGrids,,5.8,6.9';
describe('Soil Health Evidence Engine',()=>{
 it('does not invent a soil baseline without data',()=>{const r=analyzeSoil([],'Millet','Groundnut');expect(r.status).toBe('NO_SOIL_INPUT');expect(r.properties).toHaveLength(0)});
 it('validates provenance, profile and uncertainty',()=>{const p=parseSoilProfiles(header+'\n'+line);expect(p[0].properties.ph?.low).toBe(5.8);const r=analyzeSoil(p,'Groundnut','Millet');expect(r.status).toBe('SOURCE_DERIVED_NOT_FIELD_VALIDATED');expect(r.properties.length).toBe(5)});
 it('blocks invalid uncertainty bounds',()=>expect(()=>parseSoilProfiles(header+'\n'+line.replace('5.8,6.9','6.8,7.1'))).toThrow());
 it('rejects missing provenance',()=>expect(()=>parseSoilProfiles(header+'\n'+line.replace('ISRIC SoilGrids',''))).toThrow());
 it('distinguishes crop order in documented mechanism without yield gain',()=>{const a=rotationSoilMechanisms('Groundnut','Millet');const b=rotationSoilMechanisms('Millet','Groundnut');expect(a[1].detail).not.toEqual(b[1].detail);expect(a[3].level).toBe('UNIDENTIFIED')});
 it('does not assert lab verification for SoilGrids',()=>expect(analyzeSoil(parseSoilProfiles(header+'\n'+line),'Millet','Cowpea').warnings.join(' ')).toMatch(/not laboratory/i));
});
