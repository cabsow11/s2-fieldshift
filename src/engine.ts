export type Crop='Millet'|'Groundnut'|'Cowpea'|'Sorghum';
export type Verdict='YES'|'NO'|'UNKNOWN';
export type Rain={date:string;imerg:number;power:number};
export type Source='power'|'imerg';
export const crops:Crop[]=['Millet','Groundnut','Cowpea','Sorghum'];
export const fmt=(v:number,d=1)=>v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
export function summarize(data:Rain[],source:Source,threshold=1){
 const vals=data.map(r=>r[source]);let longest=0,run=0;
 for(const v of vals){if(v<threshold){run++;longest=Math.max(longest,run);}else run=0;}
 return{total:vals.reduce((a,b)=>a+b,0),wet:vals.filter(x=>x>=threshold).length,longest,peak:Math.max(...vals),n:vals.length};
}
export function discrepancy(data:Rain[]){const ds=data.map(x=>x.imerg-x.power);return {mae:ds.reduce((s,v)=>s+Math.abs(v),0)/ds.length,rmse:Math.sqrt(ds.reduce((s,v)=>s+v*v,0)/ds.length),mean:ds.reduce((s,v)=>s+v,0)/ds.length};}
export interface Field{previous:Crop|null;seed:{[K in Crop]:'yes'|'no'|'unknown'};soil:'unknown'|'sandy'|'loamy'|'clayey';rainfed:boolean;}
export interface Rotation{first:Crop;second:Crop;id:string;verdict:Verdict;reasons:string[]}
export function feasibility(first:Crop,second:Crop,field:Field):Rotation{
 const reasons:string[]=[];let verdict:Verdict='YES';
 if(first===second){verdict='NO';reasons.push('This repeats the same crop; it is not a two-crop rotation (monocropping is not assessed here).');}
 if(field.seed[first]==='no'||field.seed[second]==='no'){verdict='NO';reasons.push('Seeds explicitly unavailable for at least one crop.');}
 if(verdict!=='NO'&&(field.seed[first]==='unknown'||field.seed[second]==='unknown')){verdict='UNKNOWN';reasons.push('Seed availability has not been confirmed.');}
 if(verdict!=='NO'&&field.soil==='unknown'){verdict='UNKNOWN';reasons.push('Soil suitability needs local verification.');}
 if(field.previous===first)reasons.push('Previous crop repeats in season one: review soil management (advisory only).');
 if(!field.rainfed)reasons.push('Supplemental water access declared; no irrigated yield calibration available.');
 if(verdict==='YES')reasons.unshift('Passed available explicit constraints; not a certified agronomic recommendation.');
 return {first,second,id:`${first}-${second}`,verdict,reasons};
}
export const rotations=(field:Field)=>crops.flatMap(a=>crops.map(b=>feasibility(a,b,field)));
export function frontier(w:number){if(w<0||w>1||!Number.isFinite(w))throw Error('Weight must be between 0 and 1');return{a:40+40*w,b:75-25*w,threshold:35/65,preferred:Math.abs(65*w-35)<1e-9?'TIE':65*w>35?'A':'B'};}
export function minimaxRegret(scores:number[][]){if(!scores.length||!scores[0]?.length)throw Error('Empty score matrix');const n=scores[0].length;if(scores.some(x=>x.length!==n||x.some(y=>!Number.isFinite(y))))throw Error('Invalid score matrix');const maxes=Array.from({length:n},(_,j)=>Math.max(...scores.map(r=>r[j])));const regrets=scores.map(r=>r.map((x,j)=>maxes[j]-x));const maxRegret=regrets.map(r=>Math.max(...r));const best=Math.min(...maxRegret);return{regrets,maxRegret,winners:maxRegret.flatMap((x,i)=>Math.abs(x-best)<1e-9?[i]:[])};}

/**
 * An exploratory, NOT calibrated, link from historical NASA rainfall to candidate
 * crop sequences. It repeats the SAME 2024 observation window as a counterfactual
 * for both sequence positions. Scores are illustrative and not projected yields.
 */
export type ToleranceAssumptions = Record<Crop,number>;
export type ClimateWindow = {source:Source; start:string; days:number; rainTotalMm:number; wetDays:number; longestDryDays:number};
export type ClimateScreenRow = {
 id:string; first:Crop;second:Crop; verdict:Verdict;
 sourceScores:Record<Source,number>; maxRegret:number|null;
 sourceSpread:number; warnings:string[];
};
export const DEFAULT_TOLERANCE: ToleranceAssumptions={Millet:6,Groundnut:7,Cowpea:5,Sorghum:8};
export function climateWindow(data:Rain[],source:Source,start:string,days=30,threshold=1):ClimateWindow{
 if(!Number.isInteger(days)||days<=0||threshold<0||!Number.isFinite(threshold))throw Error('Invalid window settings');
 const selected=data.filter(r=>r.date>=start).slice(0,days);
 if(selected.length!==days||selected[0]?.date!==start)throw Error('Missing precipitation dates in selected window');
 for(let i=1;i<selected.length;i++){
  const prev=new Date(selected[i-1].date+'T00:00:00Z');prev.setUTCDate(prev.getUTCDate()+1);
  if(selected[i].date!==prev.toISOString().slice(0,10))throw Error('Window is not contiguous');
 }
 const v=selected.map(r=>r[source]);if(v.some(x=>!Number.isFinite(x)||x<0))throw Error('Invalid rainfall values');
 let longest=0,run=0;for(const x of v){run=x<threshold?run+1:0;longest=Math.max(longest,run);}
 return {source,start,days,rainTotalMm:v.reduce((a,b)=>a+b,0),wetDays:v.filter(x=>x>=threshold).length,longestDryDays:longest};
}
export function proxyScore(longestDryDays:number,assumedToleranceDays:number){
 if(longestDryDays<0||!Number.isFinite(longestDryDays)||!Number.isInteger(assumedToleranceDays)||assumedToleranceDays<=0)throw Error('Invalid illustrative assumptions');
 // Arbitrary bounded sensitivity index, NOT a crop stress/yield function.
 return 100*assumedToleranceDays/(assumedToleranceDays+longestDryDays);
}
export function climateRotationScreen(
 options:Rotation[], data:Rain[], start:string, tolerances:ToleranceAssumptions,
 threshold=1, days=30
):{windows:Record<Source,ClimateWindow>; rows:ClimateScreenRow[]; winners:string[]} {
 const windows={power:climateWindow(data,'power',start,days,threshold),imerg:climateWindow(data,'imerg',start,days,threshold)};
 const rows:ClimateScreenRow[]=options.map(o=>{
  const sourceScores={power:0,imerg:0};
  (['power','imerg'] as Source[]).forEach(src=>{
   const streak=windows[src].longestDryDays;
   sourceScores[src]=(proxyScore(streak,tolerances[o.first])+proxyScore(streak,tolerances[o.second]))/2;
  });
  return {id:o.id,first:o.first,second:o.second,verdict:o.verdict,sourceScores,
   sourceSpread:Math.abs(sourceScores.power-sourceScores.imerg),maxRegret:null,
   warnings:['Illustrative tolerance assumptions; NOT observed crop performance','The 2024 window is reused for both conceptual crop slots, NOT a forecast for year two']};
 });
 const eligible=rows.filter(r=>r.verdict==='YES');
 if(eligible.length){
  const scoreMatrix=eligible.map(r=>[r.sourceScores.power,r.sourceScores.imerg]);
  const result=minimaxRegret(scoreMatrix);
  for(let i=0;i<eligible.length;i++) eligible[i].maxRegret=result.maxRegret[i];
  return {windows,rows,winners:result.winners.map(i=>eligible[i].id)};
 }
 return {windows,rows,winners:[]};
}


/** Shared NASA-linked, explicitly synthetic decision model.
 * NASA sources represent alternative historical estimates, NOT forecasts or independent scenarios.
 * The soil-care numbers are fictional preference attributes, NOT measured soil outcomes.
 */
export const DEMO_SOIL_CARE:Record<Crop,number>={Millet:45,Groundnut:64,Cowpea:88,Sorghum:55};
export type DecisionCandidate={id:string;name:string;soilCare:number;water:Record<Source,number>};
export type PairDecision={options:[DecisionCandidate,DecisionCandidate];weight:number;scores:Record<Source,[number,number]>;regrets:[number,number];winners:string[];reversal:Record<Source,number|null>;preference:Record<Source,string|'TIE'>;limitations:string[]};
export function buildCandidate(row:ClimateScreenRow,soilAttributes:Record<Crop,number>=DEMO_SOIL_CARE):DecisionCandidate{
 const soilCare=(soilAttributes[row.first]+soilAttributes[row.second])/2;
 if(!Number.isFinite(soilCare)||soilCare<0||soilCare>100)throw Error('Invalid synthetic soil attribute');
 return {id:row.id,name:`${row.first} → ${row.second}`,soilCare,water:{...row.sourceScores}};
}
export function pairDecision(rows:ClimateScreenRow[], ids:[string,string],weight:number,soilAttributes:Record<Crop,number>=DEMO_SOIL_CARE):PairDecision{
 if(!Number.isFinite(weight)||weight<0||weight>1)throw Error('Invalid water priority');
 if(ids[0]===ids[1])throw Error('Two different options required');
 const found=ids.map(id=>rows.find(r=>r.id===id));
 if(found.some(r=>!r||r.verdict!=='YES'))throw Error('Both options must pass explicitly declared demo constraints');
 const options=found.map(r=>buildCandidate(r!,soilAttributes)) as [DecisionCandidate,DecisionCandidate];
 const scores={} as Record<Source,[number,number]>;
 const reversal={} as Record<Source,number|null>;
 const preference={} as Record<Source,string|'TIE'>;
 for(const source of ['power','imerg'] as Source[]){
  const [a,b]=options;
  scores[source]=[a.soilCare*(1-weight)+a.water[source]*weight,b.soilCare*(1-weight)+b.water[source]*weight];
  const delta0=a.soilCare-b.soilCare;
  const delta1=a.water[source]-b.water[source];
  const slope=delta1-delta0;
  const crossing=Math.abs(slope)<1e-12?null:-delta0/slope;
  // An endpoint tie is not a reversal of preference within the open weight interval.
  reversal[source]=crossing!==null&&crossing>1e-12&&crossing<1-1e-12?crossing:null;
  preference[source]=Math.abs(scores[source][0]-scores[source][1])<1e-8?'TIE':scores[source][0]>scores[source][1]?a.id:b.id;
 }
 const regret=minimaxRegret(options.map((_,i)=>[scores.power[i],scores.imerg[i]]));
 return {options,weight,scores,regrets:regret.maxRegret as [number,number],winners:regret.winners.map(i=>options[i].id),reversal,preference,
 limitations:['NASA POWER and IMERG are two historical estimates, not independent future climate scenarios.',
 'Water index uses adjustable, hypothetical dry-spell tolerance; soil-care attribute is synthetic and is not measured soil health.',
 'The 2024 historical window is reused in both conceptual crop positions. No yield, profit or real agronomic optimality is inferred.']};
}
