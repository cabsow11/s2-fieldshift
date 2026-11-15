#!/usr/bin/env python3
"""Authenticated NASA Earthdata granule collector with resumable scientific extraction.

Complete-by-coverage means every requested daily IMERG file / every selected SMAP temporal
sample is checked against expected dates. A partial collection is never labeled COMPLETE.

Install: pip install earthaccess h5py numpy
Login:  earthaccess login (interactive prompt or EARTHDATA_USERNAME / EARTHDATA_PASSWORD)
Usage: python scripts/sync_earthdata.py --product imerg --start 2015-01-01 --end 2025-12-31
       python scripts/sync_earthdata.py --product smap --start 2015-04-01 --end 2025-12-31 --cadence daily
Requires Earthdata Cloud access, local disk and network. Does not require credentials in frontend.
"""
import argparse, calendar, csv, datetime as dt, hashlib, json, os, re, sys, tempfile
from pathlib import Path

try:
 import earthaccess, h5py, numpy as np
except ImportError as ex:
 sys.exit('Install Python dependencies: pip install earthaccess h5py numpy\n'+str(ex))

POINT_LAT=14.15;POINT_LON=-16.08
ROI=(13.8,-16.5,14.5,-15.6) # lat_min, lon_min, lat_max, lon_max; NOT administrative boundary

def monthly_intervals(start,end):
 y,m=start.year,start.month
 while dt.date(y,m,1)<=end:
  final=dt.date(y,m,calendar.monthrange(y,m)[1]);a=max(start,dt.date(y,m,1));b=min(end,final)
  if a<=b:yield a,b
  y,m=(y+1,1) if m==12 else (y,m+1)

def date_from_name(name):
 m=re.search(r'(20\d{6})',name)
 if m:
  try:return dt.datetime.strptime(m.group(1),'%Y%m%d').date().isoformat()
  except ValueError:pass
 return None

def _attribute_scalar(attrs, name, default):
 """NetCDF4/HDF5 numeric attributes may be arrays rather than Python scalars."""
 raw=attrs.get(name, default)
 arr=np.asarray(raw)
 return float(arr.reshape(-1)[0]) if arr.size else float(default)

def convert_imerg(path):
 """Extract geographic ROI from IMERG V07 Daily, handling netCDF4 axis variations.

 The official GPM_3IMERGDF precipitation unit is mm/day. Never multiply by 24.
 Coordinates may be stored in root or Grid; precipitation can be 2D or
 3D with a singleton time dimension. Preserve missing cells as null.
 """
 date=date_from_name(path.name)
 if not date:raise ValueError(f'Cannot determine YYYYMMDD from {path.name}')
 with h5py.File(path) as h:
  base=h['Grid'] if 'Grid' in h and 'precipitation' in h['Grid'] else h
  lats=np.asarray(base['lat'][...]).squeeze()
  lons=np.asarray(base['lon'][...]).squeeze()
  if lats.ndim!=1 or lons.ndim!=1:
   raise ValueError(f'Unexpected coordinate dimensions: lat={lats.shape} lon={lons.shape}')
  # IMERG longitude is conventionally -180..180; 0..360 is also supported.
  lon180=((lons+180)%360)-180
  yi=np.flatnonzero((lats>=ROI[0]-1e-4)&(lats<=ROI[2]+1e-4))
  xi=np.flatnonzero((lon180>=ROI[1]-1e-4)&(lon180<=ROI[3]+1e-4))
  if not len(yi) or not len(xi):raise ValueError('No IMERG cells intersect ROI')
  ds=base['precipitation']
  shape=ds.shape
  # Determine axes from matching latitude/longitude coordinate lengths.
  # All remaining axes MUST be length 1 (e.g. time).
  candidates=[(lo,la) for lo in range(ds.ndim) for la in range(ds.ndim)
              if lo!=la and shape[lo]==len(lons) and shape[la]==len(lats)
              and all(shape[k]==1 for k in range(ds.ndim) if k not in (lo,la))]
  if not candidates:
   raise ValueError(f'Unsupported IMERG precipitation dimensions {shape}; '
                    f'expected lat={len(lats)} lon={len(lons)} with optional singleton time')
  lon_axis,lat_axis=candidates[0]
  slices=[]
  for k in range(ds.ndim):
   if k==lon_axis:slices.append(slice(int(xi.min()),int(xi.max())+1))
   elif k==lat_axis:slices.append(slice(int(yi.min()),int(yi.max())+1))
   else:slices.append(0)
  block=np.asarray(ds[tuple(slices)])
  # After indexing singleton axes, the remaining order is dictated by
  # longitude/latitude axis order, so orient to [lon,lat].
  if lon_axis>lat_axis:block=block.T
  if block.shape!=(int(xi.max()-xi.min()+1),int(yi.max()-yi.min()+1)):
   raise ValueError(f'Unexpected sliced data shape {block.shape}')
  fill=_attribute_scalar(ds.attrs,'_FillValue',-9999.9)
  missing=_attribute_scalar(ds.attrs,'missing_value',fill)
  scale=_attribute_scalar(ds.attrs,'scale_factor',1)
  offset=_attribute_scalar(ds.attrs,'add_offset',0)
  units=ds.attrs.get('units',b'mm/day')
  units=units.decode('utf-8') if isinstance(units,bytes) else str(np.asarray(units).reshape(-1)[0])
  if units.lower().replace(' ','') not in ('mm/day','mmd-1','mmday-1'):
   raise ValueError(f'IMERG daily precipitation units not recognized: {units}')
  rows=[]
  for x in xi:
   for y in yi:
    raw=float(block[int(x-xi.min()),int(y-yi.min())])
    bad=(not np.isfinite(raw) or np.isclose(raw,fill,rtol=0,atol=0.001)
         or np.isclose(raw,missing,rtol=0,atol=0.001) or raw<=-9999)
    # Packed integer data require CF scaling; floating-point V07 daily
    # precipitation is normally already in physical mm/day units.
    value=None if bad else (raw*scale+offset if np.issubdtype(ds.dtype,np.integer) else raw)
    if value is not None and (not np.isfinite(value) or value<0):value=None
    rows.append(dict(date=date,lon=round(float(lon180[x]),5),
                     lat=round(float(lats[y]),5),
                     rain=None if value is None else round(float(value),5)))
  return rows

def convert_smap(path):
 date=date_from_name(path.name)
 with h5py.File(path) as h:
  lats=h['cell_lat'][:];lons=h['cell_lon'][:]
  # Select the closest finite cell, not bilinear interpolation of soil grids.
  dist=(lats-POINT_LAT)**2+((lons-POINT_LON)*np.cos(np.radians(POINT_LAT)))**2
  yi,xi=np.unravel_index(int(np.nanargmin(dist)),dist.shape)
  g=h['Geophysical_Data'];a=float(g['sm_surface'][yi,xi]);b=float(g['sm_rootzone'][yi,xi])
  a=None if a<0 or a>1 else round(a,6);b=None if b<0 or b>1 else round(b,6)
  timestamp=re.search(r'_(20\d{6}T\d{6})',path.name)
  return dict(date=date,time=timestamp.group(1) if timestamp else None,lat=float(lats[yi,xi]),lon=float(lons[yi,xi]),surface=a,rootzone=b)

def write_atomic(path, data):
 path.parent.mkdir(parents=True,exist_ok=True)
 with tempfile.NamedTemporaryFile('w',dir=path.parent,delete=False,encoding='utf-8') as f:
  json.dump(data,f,separators=(',',':'),allow_nan=False);temp=f.name
 os.replace(temp,path)

def collect(args):
 root=Path(args.output).resolve();root.mkdir(parents=True,exist_ok=True)
 auth=earthaccess.login(strategy='environment') if os.environ.get('EARTHDATA_USERNAME') else earthaccess.login()
 if not auth:raise RuntimeError('Earthdata authentication failed')
 product=args.product;collection='GPM_3IMERGDF' if product=='imerg' else 'SPL4SMGP'
 version='07' if product=='imerg' else '008'
 start=dt.date.fromisoformat(args.start);end=dt.date.fromisoformat(args.end)
 if start>end:raise ValueError('start > end')
 if product=='smap' and start<dt.date(2015,3,31):raise ValueError('SMAP begins 2015-03-31')
 index=root / f'{product}_manifest.json'
 manifest=json.loads(index.read_text()) if index.exists() else {'product':product,'collection':collection,'version':version,'interval':[args.start,args.end],'files':{},'failures':[]}
 store=root/'granules'/product
 consecutive_errors=0
 for a,b in monthly_intervals(start,end):
  print(f'[{product}] {a} … {b}',flush=True)
  results=earthaccess.search_data(short_name=collection,version=version,temporal=(a.isoformat(),b.isoformat()),bounding_box=(ROI[1],ROI[0],ROI[3],ROI[2]),count=-1)
  if not results:
   manifest['failures'].append({'interval':[str(a),str(b)],'reason':'No granules returned by NASA CMR'})
  for item in results:
   ident=str(item.get('meta',{}).get('native-id') or item.get('meta',{}).get('concept-id') or item)
   if ident in manifest['files'] and manifest['files'][ident].get('status')=='ok':continue
   item_date=date_from_name(ident)
   if product=='smap' and args.cadence=='daily' and item_date:
    existing=[v for v in manifest['files'].values() if v.get('date')==item_date and v.get('status')=='ok']
    if existing:continue
   try:
    files=earthaccess.download([item],str(store),threads=1)
    if not files:raise ValueError('Empty Earthdata download')
    p=Path(files[0]);date=date_from_name(p.name)
    if not date or not (str(start)<=date<=str(end)):continue
    if product=='smap' and args.cadence=='daily':
     # Choose the earliest matching file each day, keep exact timestamp provenance.
     existing=[v for v in manifest['files'].values() if v.get('date')==date and v.get('status')=='ok']
     if existing:continue
    values=convert_imerg(p) if product=='imerg' else [convert_smap(p)]
    out=root/'records'/product/(p.stem+'.json')
    write_atomic(out,{'provider':'NASA Earthdata','collection':collection,'version':version,'sourceFile':p.name,'date':date,'values':values})
    sha=hashlib.sha256(p.read_bytes()).hexdigest()
    consecutive_errors=0
    manifest['files'][ident]={'status':'ok','date':date,'time':values[0].get('time') if product=='smap' else None,'recordFile':str(out.relative_to(root)),'source':p.name,'sha256':sha,'cells':len(values)}
    if not args.keep_granules:p.unlink(missing_ok=True)
   except Exception as e:
    consecutive_errors+=1
    manifest['files'][ident]={'status':'error','reason':str(e)}
    print(f'ERROR {product} {ident[:100]}: {type(e).__name__}: {e}',file=sys.stderr)
   finally:
    write_atomic(index,manifest)
   if consecutive_errors>=args.max_errors:
    print(f'ABORT after {consecutive_errors} consecutive errors. Inspect errors before resuming.',file=sys.stderr)
    return 3
  write_atomic(index,manifest)
 dates={v['date'] for v in manifest['files'].values() if v.get('status')=='ok' and v.get('date')}
 expected={(start+dt.timedelta(days=i)).isoformat() for i in range((end-start).days+1)}
 missing=sorted(expected-dates)
 coverage={'product':product,'start':args.start,'end':args.end,'expectedDailyDates':len(expected),'observedDailyDates':len(dates),'missingDailyDates':missing,'status':'COMPLETE_DAILY_DATE_COVERAGE' if not missing else 'INCOMPLETE','caveat':'Daily-date completeness does not guarantee subdaily 3-hourly completeness for SMAP or all variables/quality flags.'}
 write_atomic(root/f'{product}_coverage.json',coverage)
 print(json.dumps({k:v for k,v in coverage.items() if k!='missingDailyDates'},indent=2))
 if missing:print('First missing dates:',missing[:20]);return 2
 return 0

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--product',choices=['imerg','smap'],required=True)
 p.add_argument('--start',default='2015-01-01');p.add_argument('--end',default='2025-12-31');p.add_argument('--output',default='earthdata_archive');p.add_argument('--cadence',choices=['daily','all'],default='daily');p.add_argument('--keep-granules',action='store_true')
 sys.exit(collect(p.parse_args()))
