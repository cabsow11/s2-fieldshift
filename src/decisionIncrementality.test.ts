import {describe,it,expect} from 'vitest';
import {auditIncrementalValue} from './decisionIncrementality';
import paired from '../public/data/kaolack_2024.json';
import extended from '../public/data/fieldshift_nasa_extended.json';
import type {Rain} from './engine';
describe('Incremental analytical value audit',()=>{
 const audit=auditIncrementalValue(paired.daily as Rain[],extended.powerDaily);
 it('checks full daily coverage and 10 contiguous two-year windows',()=>{expect(audit.integrity.historicalCoverageValid).toBe(true);expect(audit.historical.completeTwoYearWindows).toBe(10)});
 it('checks baseline comparability of 122 paired observations',()=>{expect(audit.integrity.pairedComparisonComplete).toBe(true);expect(audit.integrity.allMetricsComputable).toBe(true)});
 it('computes historical contexts without inventing additional crop outcomes',()=>{expect(audit.deltas.contextEvaluationsAdded).toBe(120);expect(audit.deltas.identifiedCausalEffectsAdded).toBe(0);expect(audit.historical.causalEffectsIdentified).toBe(0)});
 it('does not invent soil-property observations',()=>{expect(audit.soil.soilPropertiesObserved).toBe(0)});
});
