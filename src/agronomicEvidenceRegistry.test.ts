import {describe,it,expect} from 'vitest';
import {PARAMETER_REGISTRY,auditParameterProvenance,permitAgronomicCoefficient} from './agronomicEvidenceRegistry';
describe('Agronomic provenance fail-closed gate',()=>{
 it('retains explicit distinctions',()=>{const x=auditParameterProvenance();expect(x.total).toBe(12);expect(x.sourceObserved).toBe(2);expect(x.pendingSpatial).toBe(3);expect(x.synthetic).toBe(2);expect(x.coefficientReady).toBe(0);expect(x.allTraced).toBe(true)});
 it('rejects silent use of published LER as a yield coefficient',()=>{expect(()=>permitAgronomicCoefficient(PARAMETER_REGISTRY.find(r=>r.id==='millet_cowpea')!)).toThrow(/BLOCKED/)});
 it('rejects illicit synthetic clearance',()=>{const wrong={...PARAMETER_REGISTRY.find(r=>r.id==='soil_care')!,transfer:'DIRECT_DESCRIPTIVE' as const};expect(()=>auditParameterProvenance([wrong])).toThrow(/Synthetic parameter cleared/)});
 it('refuses fictional SoilGrids fields',()=>{const wrong={...PARAMETER_REGISTRY.find(r=>r.id==='soil_ph')!,observedValue:'6.3'};expect(()=>auditParameterProvenance([wrong])).toThrow(/Unextracted raster/)});
 it('rejects populated unidentified causal outcome',()=>{const wrong={...PARAMETER_REGISTRY.find(r=>r.id==='rotation_yield')!,observedValue:'12%'};expect(()=>auditParameterProvenance([wrong])).toThrow(/Unidentified effect populated/)});
});
