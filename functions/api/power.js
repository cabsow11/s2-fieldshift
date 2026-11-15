// Cloudflare Pages Function: source-linked, UTC-explicit NASA POWER gateway.
// Never embed secrets in browser code. The first public request loads the complete requested interval;
// subsequent requests reuse cache. A failed source returns an error, never fabricated data.
const BASE = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const ALLOWED = ['PRECTOTCORR','T2M','T2M_MAX','T2M_MIN','ALLSKY_SFC_SW_DWN','RH2M','WS2M'];
const number = (x, lo, hi) => Number.isFinite(Number(x)) && Number(x) >= lo && Number(x) <= hi;
const validDate = x => /^\d{8}$/.test(x) && !Number.isNaN(Date.parse(`${x.slice(0,4)}-${x.slice(4,6)}-${x.slice(6,8)}T00:00:00Z`));
export async function onRequestGet(context){
  const url=new URL(context.request.url);const q=url.searchParams;
  const lat=q.get('lat')??'14.15',lon=q.get('lon')??'-16.08',start=q.get('start')??'20150101',end=q.get('end')??'20251231';
  const parameters=(q.get('parameters')??'PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN').split(',');
  const origin=context.request.headers.get('Origin');
  const h={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=3600, s-maxage=86400','X-Content-Type-Options':'nosniff'};
  if(!number(lat,-90,90)||!number(lon,-180,180)||!validDate(start)||!validDate(end)||start>end||parameters.length>7||parameters.some(p=>!ALLOWED.includes(p))){return new Response(JSON.stringify({error:'Invalid bounds, UTC date range or unsupported NASA variable'}),{status:400,headers:h});}
  // Prevent arbitrary large unbounded queries; requested dates remain user-controlled.
  if(Date.parse(end.slice(0,4)+'-'+end.slice(4,6)+'-'+end.slice(6,8))-Date.parse(start.slice(0,4)+'-'+start.slice(4,6)+'-'+start.slice(6,8))>1000*86400000){return new Response(JSON.stringify({error:'Limit one request to 1000 days; client should fetch successive intervals'}),{status:400,headers:h});}
  const nasa=new URL(BASE);Object.entries({parameters:parameters.join(','),community:'AG',latitude:lat,longitude:lon,start,end,format:'JSON','time-standard':'UTC'}).forEach(([k,v])=>nasa.searchParams.set(k,v));
  try{
    const response=await fetch(nasa.toString(),{headers:{Accept:'application/json'},cf:{cacheEverything:true,cacheTtl:86400},signal:AbortSignal.timeout(22000)});
    if(!response.ok)throw new Error('NASA POWER HTTP '+response.status);
    const body=await response.json();
    const series=body?.properties?.parameter;
    if(!series||!series.PRECTOTCORR)throw new Error('NASA response lacks requested series');
    const dates=Object.keys(series.PRECTOTCORR).sort();
    const records=dates.map(d=>({date:`${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`,...Object.fromEntries(parameters.map(p=>[p,Number(series[p]?.[d])===-999?null:Number.isFinite(Number(series[p]?.[d]))?Number(series[p][d]):null]))}));
    return new Response(JSON.stringify({provider:'NASA POWER',product:'Daily Point',timeStandard:'UTC',requested:{lat:+lat,lon:+lon,start,end,parameters},sourceUrl:nasa.toString(),fetchedAt:new Date().toISOString(),count:records.length,records,units:body?.parameters??null}),{headers:h});
  }catch(e){return new Response(JSON.stringify({error:'Upstream NASA POWER unavailable',detail:String(e),sourceUrl:nasa.toString()}),{status:502,headers:{...h,'Cache-Control':'no-store'}});}
}
