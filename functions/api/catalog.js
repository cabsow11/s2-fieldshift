// Public NASA Earthdata CMR discovery. This discovers complete records, not raster content.
const BASE='https://cmr.earthdata.nasa.gov/search/granules.json';
const PRODUCTS={imerg:{short_name:'GPM_3IMERGDF',version:'07'},smap:{short_name:'SPL4SMGP',version:'008'}};
export async function onRequestGet({request}){
 const u=new URL(request.url),product=u.searchParams.get('product')||'imerg';
 if(!PRODUCTS[product])return Response.json({error:'Expected product=imerg or smap'},{status:400});
 const start=u.searchParams.get('start')||'2024-06-01',end=u.searchParams.get('end')||'2024-06-30';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end)return Response.json({error:'Bad date interval'},{status:400});
 const q=new URL(BASE);q.searchParams.set('short_name',PRODUCTS[product].short_name);q.searchParams.set('version',PRODUCTS[product].version);q.searchParams.set('temporal',start+'T00:00:00Z,'+end+'T23:59:59Z');q.searchParams.set('bounding_box','-16.5,13.8,-15.6,14.5');q.searchParams.set('page_size','20');q.searchParams.set('page_num','1');
 try{const r=await fetch(q.toString(),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('CMR HTTP '+r.status);const data=await r.json();const items=(data.feed?.entry||[]).map(g=>({id:g.id,title:g.title,updated:g.updated,timeStart:g.time_start,timeEnd:g.time_end,downloadLinks:(g.links||[]).filter(l=>l.href&&!l.inherited&&(!l.rel||l.rel.includes('data#'))).map(l=>({href:l.href,title:l.title})).slice(0,2)}));return Response.json({provider:'NASA Earthdata CMR',product,items,returned:items.length,notice:'Discovery only: full NASA data extraction requires Earthdata authentication and may be large; no claim that all granules have been downloaded.',sourceUrl:q.toString()},{headers:{'Cache-Control':'public,max-age=1800'}})}catch(e){return Response.json({error:'Earthdata CMR unavailable',detail:String(e)},{status:502})}
}
