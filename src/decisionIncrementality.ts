/** Reproducible analytical-capability comparison, not measured farmer utility or predictive validation. */
import {crops,rotations,climateRotationScreen,DEFAULT_TOLERANCE,type Field,type Rain} from './engine';
import {buildHistoricalPairs,rotationExposure,type HistoricalDay} from './historicalRotation';
export type IncrementalAudit={version:string;scope:string;matchedDays:number;candidateCount:number;eligibleCount:number;excludedCount:number;unknownCount:number;historicalDays:number;completeTwoYearWindows:number;nonidenticalSeasonRainWindows:number;directionalClimateContexts:number;soilPropertiesObserved:number;causalEffectsIdentified:number;limitations:string[]};
export type AuditResult={baseline:IncrementalAudit;historical:IncrementalAudit;soil:IncrementalAudit;deltas:{twoYearWindowsAdded:number;contextEvaluationsAdded:number;observedSoilPropertiesAdded:number;identifiedCausalEffectsAdded:number};integrity:{historicalCoverageValid:boolean;pairedComparisonComplete:boolean;missingAgronomicOutcomes:boolean;fieldDataMissing:boolean;allMetricsComputable:boolean};warnings:string[]};
const fieldFixture:Field={previous:'Groundnut',soil:'loamy',rainfed:true,seed:{Millet:'yes',Groundnut:'yes',Cowpea:'yes',Sorghum:'yes'}};
export function auditIncrementalValue(paired:Rain[],history:HistoricalDay[],field:Field=fieldFixture):AuditResult{
 const opts=rotations(field);const yes=opts.filter(o=>o.verdict==='YES').length;const no=opts.filter(o=>o.verdict==='NO').length;const unknown=opts.filter(o=>o.verdict==='UNKNOWN').length;
 const dates=new Set(history.map(d=>d.date));
 const complete=dates.size===4018&&history.length===4018;
 const pairedValid=paired.length===122&&new Set(paired.map(d=>d.date)).size===122&&paired.every(d=>Number.isFinite(d.power)&&Number.isFinite(d.imerg));
 const windows=buildHistoricalPairs(history,1);
 const seasonDifferences=windows.filter(p=>Math.abs(p.first.totalRainMm-p.second.totalRainMm)>1e-9).length;
 // Contexts = named first- and second-position descriptors over eligible ordered sequences; not ranks or causal effects.
 const directionalContexts=opts.filter(o=>o.verdict==='YES').reduce((n,o)=>n+rotationExposure(o.first,o.second,field,windows).pairs.length,0);
 const historicalDays=history.length;
 const base={matchedDays:paired.length,candidateCount:opts.length,eligibleCount:yes,excludedCount:no,unknownCount:unknown,historicalDays:0,completeTwoYearWindows:0,nonidenticalSeasonRainWindows:0,directionalClimateContexts:0,soilPropertiesObserved:0,causalEffectsIdentified:0};
 // Validate pre-2024 daily climate screening without treating its proxy score as actual decision quality.
 let baselineComputable=false;try{baselineComputable=pairedValid&&climateRotationScreen(opts,paired,'2024-07-01',DEFAULT_TOLERANCE).rows.length===opts.length}catch{/* baseline data missing */}
 const make=(version:string,scope:string,stats:Partial<typeof base>,limitations:string[]):IncrementalAudit=>({...base,...stats,version,scope,limitations});
 const baseline=make('V2.1.4','2024 paired NASA source sensitivity and illustrative rotation screening',{},['No year-two observation; hypothetical tolerance and soil-care scores','No measured farm outcomes']);
 const historical=make('V2.1.5','Consecutive historical POWER seasons (source time convention retained)',{historicalDays,completeTwoYearWindows:windows.length,nonidenticalSeasonRainWindows:seasonDifferences,directionalClimateContexts:directionalContexts},['Differences in first/second crop exposure are not order-specific yield effects','Historical analog windows overlap and are not independent forecasts']);
 const soil=make('V2.1.6','Documentary soil mechanism and provenance-gated soil inputs', {historicalDays,completeTwoYearWindows:windows.length,nonidenticalSeasonRainWindows:seasonDifferences,directionalClimateContexts:directionalContexts},['No measured or SoilGrids soil properties loaded in benchmark fixture','No measured soil-health gains or causal crop response']);
 return {baseline,historical,soil,deltas:{twoYearWindowsAdded:windows.length,contextEvaluationsAdded:directionalContexts,observedSoilPropertiesAdded:0,identifiedCausalEffectsAdded:0},integrity:{historicalCoverageValid:complete,pairedComparisonComplete:pairedValid,missingAgronomicOutcomes:true,fieldDataMissing:true,allMetricsComputable:baselineComputable&&complete&&windows.length===10},warnings:['The audit measures new computable analytical capabilities, NOT an observed improvement in decision outcomes or predictive accuracy.','V2.1.6 adds evidence structure but no observed soil values to this fixed benchmark.','No causal contrast is identified from these NASA time series alone.']};
}
export const auditFixtureField=fieldFixture;
export const auditCrops=crops;
