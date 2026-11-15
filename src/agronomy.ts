import type {Crop, Field, Rain, Source} from './engine';

/** Source-led interpretation only. No invented crop-response coefficient or field suitability guarantee. */
export type EvidenceStatus='DOCUMENTED_CONTEXT'|'USER_DECLARED'|'NOT_ESTABLISHED';
export type EvidenceFinding={code:string;label:string;status:EvidenceStatus;detail:string;references:string[]};
export type ClimateDiagnostic={source:Source;start:string;days:number;totalMm:number;wetDays:number;longestDryDays:number;firstWetDate:string|null;};
export type AgronomicAssessment={rotation:[Crop,Crop];climate:Record<Source,ClimateDiagnostic>;findings:EvidenceFinding[];missingInputs:string[];decisionStatus:'NOT_RANKABLE';};

export const EVIDENCE_REFERENCES=[
 {id:'L03-001',reference:'Ndiaye et al. (2024), Environmental Research Communications 6, 075024',basis:'Sowing date, onset, longest dry spell and cumulative rainfall after sowing; station study, not a calibrated FieldShift onset rule'},
 {id:'L03-003',reference:'Diongue et al. (2022), Hydrological Sciences Journal, DOI 10.1080/02626667.2022.2142474',basis:'Millet–groundnut soil-water study; not a universal crop-sequence benefit'},
 {id:'L03-004',reference:'Sandy ferruginous soil suitability study (2026), Cogent Food & Agriculture',basis:'Local soil suitability requires measured limiting factors; texture label alone is insufficient'},
 {id:'L02-002',reference:'Ndiaye et al. (2026), Journal of Applied Biosciences 218',basis:'Groundnut followed by millet studied under specific experimental soil amendment treatments; do not transfer yield gains'},
 {id:'L02-003',reference:'Faye et al. (2021), Sustainability 13, 11817',basis:'Millet/groundnut rotations and amendments on sandy soils; soil benefits depend on management'},
 {id:'L03-009',reference:'Manga et al. (2023), Journal of Animal & Plant Sciences 56(2)',basis:'Groundnut postharvest drying and storage management matter'},
 {id:'L03-014',reference:'FAO-56, Crop Evapotranspiration',basis:'ET0/Kc methodology only; no Kaolack plot-level ET0/Kc inputs here'},
 {id:'L03-015',reference:'FAO-66, Crop Yield Response to Water',basis:'Stage-specific water-response framework; no validated crop parameters available in this MVP'}
] as const;
const nextDay=(date:string,days:number)=>{const d=new Date(date+'T00:00:00Z');if(Number.isNaN(d.valueOf()))throw new Error('Invalid date');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
export function diagnoseHistoricalWindow(data:Rain[],source:Source,start:string,days=30,rainThreshold=1):ClimateDiagnostic{
 if(!Number.isInteger(days)||days<1||!Number.isFinite(rainThreshold)||rainThreshold<0)throw new Error('Invalid analysis settings');
 const index=new Map(data.map(row=>[row.date,row]));let totalMm=0,wetDays=0,longestDryDays=0,dry=0,firstWetDate:string|null=null;
 for(let i=0;i<days;i++){const date=nextDay(start,i);const val=index.get(date)?.[source];
  if(val===undefined||!Number.isFinite(val)||val<0)throw new Error('Missing or invalid daily rainfall on '+date);
  totalMm+=val;
  if(val>=rainThreshold){wetDays++;dry=0;if(firstWetDate===null)firstWetDate=date;}else{dry++;longestDryDays=Math.max(longestDryDays,dry);}
 }
 return {source,start,days,totalMm,wetDays,longestDryDays,firstWetDate};
}
/** Values are observational summaries, not agronomic onset, crop stress or yield calculations. */
export function assessAgronomy(first:Crop,second:Crop,field:Field,data:Rain[],start:string,days=30,rainThreshold=1):AgronomicAssessment{
 const climate={power:diagnoseHistoricalWindow(data,'power',start,days,rainThreshold),imerg:diagnoseHistoricalWindow(data,'imerg',start,days,rainThreshold)};
 const findings:EvidenceFinding[]=[];
 const add=(code:string,label:string,status:EvidenceStatus,detail:string,references:string[]=[])=>findings.push({code,label,status,detail,references});
 if(first===second)add('repeat','Repeated crop','DOCUMENTED_CONTEXT','This is continuous cropping, not a two-crop rotation as defined in the explorer.');
 else if(first==='Millet'&&second==='Groundnut')add('rotation','Millet → groundnut','DOCUMENTED_CONTEXT','Millet–groundnut rotation is documented as a system. Specific benefit for this order and field remains unestablished.',['L03-003','L02-003']);
 else if(first==='Groundnut'&&second==='Millet')add('rotation','Groundnut → millet','DOCUMENTED_CONTEXT','A groundnut-to-millet sequence has been studied under specific experimental treatments; no generalizable yield bonus is applied.',['L02-002','L02-003']);
 else add('rotation',`${first} → ${second}`,'NOT_ESTABLISHED','No plot-specific sequence outcome is established for this pair in the current evidence register.');
 add('rain','Historical post-sowing rainfall','DOCUMENTED_CONTEXT',`The ${days}-day historical windows yield ${climate.power.totalMm.toFixed(1)} mm (POWER) and ${climate.imerg.totalMm.toFixed(1)} mm (IMERG). The two sources are estimates, not station truth.`,['L03-001']);
 add('sowing','Agronomic sowing onset','NOT_ESTABLISHED','Rainfall observations allow descriptive post-sowing dry-spell diagnostics, but no crop-specific safe-onset threshold has been validated for this site.',['L03-001']);
 add('soil','Soil suitability','NOT_ESTABLISHED',field.soil==='unknown'?'Soil texture has not been supplied.':'A texture category was entered, but plot pH, depth, organic matter and limiting factors have not been measured.',['L03-004']);
 if(field.previous===null)add('previous','Crop preceding this rotation','NOT_ESTABLISHED','Previous season crop not provided; carry-over constraints cannot be assessed.');
 else add('previous','Crop preceding this rotation','USER_DECLARED',`User-declared preceding crop: ${field.previous}. No numerical carry-over benefit is assumed.`);
 if(first==='Groundnut'||second==='Groundnut')add('postharvest','Groundnut drying and storage','NOT_ESTABLISHED','Harvest drying/storage arrangements are unknown and may affect economic feasibility.',['L03-009']);
 add('yield','Expected yield and profit','NOT_ESTABLISHED','No local crop yield, soil-water balance, input cost or market price calibration. Crop performance is not predicted.',['L03-014','L03-015']);
 const missingInputs=['Plot-level soil tests (pH, depth, organic matter and limiting factors)','Crop varieties and verified sowing/maturity dates','Locally grounded crop-water and stress-response parameters','Yield/price/input data or field trial evidence'];
 if(field.previous===null)missingInputs.push('Previous field crop');
 if(first==='Groundnut'||second==='Groundnut')missingInputs.push('Groundnut storage / post-harvest arrangements');
 for(const crop of new Set([first,second])){if(field.seed[crop]!=='yes')missingInputs.push(`${crop} seed availability confirmation`);}
 return {rotation:[first,second],climate,findings,missingInputs,decisionStatus:'NOT_RANKABLE'};
}
