#!/usr/bin/env python3
"""FieldShift Harmony diagnostic and recoverable, *verified* regional subset collector.

Requires: harmony-py, xarray, netCDF4 (and numpy). Authentication is prompted
in memory. Reuses existing Harmony job and never assumes complete_with_errors
is a valid complete dataset. All records keep provenance and coverage.

Usage:
 python scripts/harmony_recovery.py diagnose --job fd8a7f8f-951a-431d-8f63-b0ef173f2e87
 python scripts/harmony_recovery.py smoke --start 2015-01-01 --end 2015-01-03
 python scripts/harmony_recovery.py collect --start 2015-01-01 --end 2015-01-31

Date end is INCLUSIVE in this command, and converted to an exclusive Harmony stop.
"""
from __future__ import annotations
import argparse, calendar, datetime as dt, getpass, hashlib, json, os, re, sys, tempfile, time
from pathlib import Path

COLLECTION = 'C2723754864-GES_DISC'  # IMERG Final Daily V07, current CMR collection
BOX=(-16.5,13.8,-15.6,14.5)         # west,south,east,north, NOT Kaolack boundary
DEFAULT_JOB='fd8a7f8f-951a-431d-8f63-b0ef173f2e87'
TERMINAL={'successful','complete_with_errors','failed','canceled','cancelled'}


def redact(obj):
    """Remove potentially sensitive URLs/credentials from written diagnostics."""
    sensitive=('token','password','authorization','access_token','refresh_token','secret','credential')
    if isinstance(obj,dict):
        return {str(k):('[REDACTED]' if any(x in str(k).lower() for x in sensitive) else redact(v)) for k,v in obj.items() if str(k).lower() not in ('request', 'url','href')}
    if isinstance(obj,list):return [redact(v) for v in obj]
    if isinstance(obj,(dt.date,dt.datetime)):return obj.isoformat()
    if isinstance(obj,str):
        s=re.sub(r'(?i)(bearer\s+)[a-z0-9_.-]+',r'\1[REDACTED]',obj)
        s=re.sub(r'(?i)(token|password|access_token|refresh_token)=([^\s&]+)',r'\1=[REDACTED]',s)
        return s[:3000]
    return obj


def atomic_json(path, value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile('w',encoding='utf-8',dir=path.parent,delete=False,suffix='.tmp') as f:
        json.dump(value,f,indent=2,ensure_ascii=False,allow_nan=False,default=str);tmp=f.name
    os.replace(tmp,path)


def client_login():
    from harmony import Client
    username=os.getenv('EARTHDATA_USERNAME') or input('Earthdata username: ').strip()
    password=os.getenv('EARTHDATA_PASSWORD') or getpass.getpass('Earthdata password: ')
    if not username or not password:raise ValueError('Empty Earthdata credentials')
    return Client(auth=(username,password))


def job_status(client, job, archive):
    status=client.status(job)
    payload={k:redact(status.get(k)) for k in ('status','message','progress','errors','warnings','num_input_granules','created_at','updated_at') if k in status}
    payload['job_id']=job
    atomic_json(archive/'reports'/f'{job}_diagnosis.json',payload)
    print('JOB:',job,'STATUS:',payload.get('status'),'PROGRESS:',payload.get('progress'))
    print('MESSAGE:',payload.get('message'))
    print('ERRORS:',json.dumps(payload.get('errors',[]),ensure_ascii=False,default=str,indent=2))
    print('WARNINGS:',json.dumps(payload.get('warnings',[]),ensure_ascii=False,default=str,indent=2))
    return status


def normalize_unit(unit):
    unit=str(unit or '').strip().lower().replace(' ','').replace('−','-')
    if unit in ('mm/day','mmd-1','mmday-1','mmd^-1','mm/d'):
        return 1.0
    if unit in ('mm/hr','mm/hour','mmh-1','mmhr-1','mmh^-1'):
        return 24.0 # only when dataset represents a daily MEAN RATE, not a cumulative value
    raise ValueError(f'Unknown precipitation units {unit!r}; no silent conversion')


def extract_daily(path, *, date_hint=None):
    """Read a Harmony-generated daily NetCDF regional output without assuming axis order.

    Returns validated grid cells; does not silently zero-fill, interpolate or average
    multiple timestamps. Fails closed when date or variable semantics unclear.
    """
    import numpy as np, xarray as xr
    path=Path(path)
    with xr.open_dataset(path,decode_cf=True,mask_and_scale=True) as ds:
        latitude=next((k for k in ('lat','latitude','y') if k in ds.coords or k in ds.variables),None)
        longitude=next((k for k in ('lon','longitude','x') if k in ds.coords or k in ds.variables),None)
        if not latitude or not longitude:raise ValueError(f'No lat/lon coordinates in {path.name}; variables={list(ds.variables)}')
        lat=ds[latitude];lon=ds[longitude]
        if lat.ndim!=1 or lon.ndim!=1:raise ValueError('Only 1D geographic grids accepted; no guessed projection')
        choices=[k for k in ds.data_vars if ('precipitation' in k.lower() or 'precip' in k.lower()) and k not in (latitude,longitude)]
        if not choices:raise ValueError(f'No precipitation variable: {list(ds.data_vars)}')
        if len(choices)>1:
            # Daily IMERG uses 'precipitation' not quality fields. Otherwise ambiguity is fatal.
            if 'precipitation' in choices:choices=['precipitation']
            else:raise ValueError(f'Ambiguous precipitation variables: {choices}')
        var=ds[choices[0]]
        extra=[d for d in var.dims if d not in (lat.dims[0],lon.dims[0])]
        if any(var.sizes[d]!=1 for d in extra):raise ValueError(f'Multiple time/band slices; refuse silent selection: {var.dims}/{var.shape}')
        for d in extra:var=var.isel({d:0})
        if set(var.dims)!={lat.dims[0],lon.dims[0]}:raise ValueError(f'Unexpected dimensions: {var.dims}')
        factor=normalize_unit(var.attrs.get('units'))
        values=var.transpose(lat.dims[0],lon.dims[0]).values
        latv=np.asarray(lat.values,dtype=float);lonv=np.asarray(lon.values,dtype=float)
        lonv=((lonv+180)%360)-180
        yi=np.flatnonzero((latv>=BOX[1]-1e-5)&(latv<=BOX[3]+1e-5))
        xi=np.flatnonzero((lonv>=BOX[0]-1e-5)&(lonv<=BOX[2]+1e-5))
        if not len(xi) or not len(yi):raise ValueError(f'Regional output does not intersect Kaolack: {path.name}')
        if date_hint is None:
            # Prefer an unambiguous time coordinate inside the file.
            if 'time' in ds.coords and ds['time'].size == 1:
                t=np.asarray(ds['time'].values).reshape(-1)[0]
                candidate=str(t)[:10]
                if re.fullmatch(r'20\d\d-\d\d-\d\d',candidate):date_hint=candidate
            if date_hint is None:
                m=re.search(r'(20\d{6})',path.name)
                if m:date_hint=dt.datetime.strptime(m.group(1),'%Y%m%d').date().isoformat()
            if date_hint is None:raise ValueError('Cannot identify daily observation date; file/time metadata ambiguous')
        rows=[]
        for y in yi:
            for x in xi:
                raw=float(values[y,x]); val=raw*factor if np.isfinite(raw) else None
                if val is not None and (val<0 or val>1500):raise ValueError(f'Implausible rainfall: {val} mm/day')
                rows.append({'date':date_hint,'lat':round(float(latv[y]),5),'lon':round(float(lonv[x]),5),'rain':None if val is None else round(float(val),5)})
        if not rows:raise ValueError('No valid ROI cells')
        return rows, {'variable':choices[0],'sourceUnits':var.attrs.get('units'),'convertedTo':'mm/day','cells':len(rows),'nullCells':sum(r['rain'] is None for r in rows)}


def safe_download(client,job,archive):
    out=archive/'harmony_downloads'/job;out.mkdir(parents=True,exist_ok=True)
    files=[];errors=[]
    try:
        futures=client.download_all(job,directory=str(out),overwrite=False)
        for future in futures:
            try:
                saved=Path(future.result())
                if not saved.exists() or saved.stat().st_size==0:raise ValueError('Downloaded file missing/empty')
                files.append(str(saved))
                print('DOWNLOADED:',saved.name,saved.stat().st_size,'bytes')
            except Exception as ex:
                errors.append(f'{type(ex).__name__}: {redact(str(ex))}')
    except Exception as ex:
        errors.append(f'{type(ex).__name__}: {redact(str(ex))}')
    return files,errors


def inspect_downloads(paths,archive,job,date_hint=None):
    report=[]
    for file in paths:
        path=Path(file)
        item={'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
        try:
            if path.suffix.lower() not in ('.nc','.nc4','.h5','.hdf5'):
                raise ValueError(f'Not a scientific NetCDF/HDF5 file ({path.suffix})')
            rows,info=extract_daily(path,date_hint=date_hint)
            item.update(info);item['status']='EXTRACTED';item['date']=rows[0]['date']
            target=archive/'records'/'imerg_harmony'/f'{job}_{path.stem}.json'
            atomic_json(target,{'provider':'NASA Earthdata Harmony','collection':COLLECTION,'job':job,'sourceFile':path.name,'values':rows,'metadata':info})
            item['recordFile']=str(target.relative_to(archive))
        except Exception as ex:
            item['status']='NOT_EXTRACTED';item['reason']=f'{type(ex).__name__}: {redact(str(ex))}'
        report.append(item)
        print('EXTRACT:',item['file'],item['status'],item.get('reason',''))
    return report


def inspect_existing(client,job,archive,*,download=True,date_hint=None):
    status=job_status(client,job,archive)
    state=status.get('status')
    files=[];errors=[]
    if download and state in ('successful','complete_with_errors'):
        files,errors=safe_download(client,job,archive)
    elif state not in TERMINAL:
        print('Job not terminal: no polling loop; run command again to check.')
    inspections=inspect_downloads(files,archive,job,date_hint=date_hint)
    summary={'job':job,'status':state,'nFiles':len(files),'extracted':sum(x['status']=='EXTRACTED' for x in inspections),'downloadErrors':errors,'files':inspections,'harmonyErrors':redact(status.get('errors',[])), 'complete':state=='successful' and bool(files) and not errors and bool(inspections) and all(x['status']=='EXTRACTED' for x in inspections)}
    atomic_json(archive/'reports'/f'{job}_files.json',summary)
    print('SUMMARY:',json.dumps({k:v for k,v in summary.items() if k not in ('files','harmonyErrors')},indent=2))
    if state=='complete_with_errors': print('HARMONY PARTIAL FAILURE: available files retained; do not label COMPLETE.')
    return 0 if summary['complete'] else 2


def make_request(start,end,*,variables=None):
    from harmony import BBox,Collection,Request
    stop=dt.datetime.combine(end,dt.time(23,59,59))
    kw={}
    if variables:kw['variables']=variables
    return Request(collection=Collection(id=COLLECTION),spatial=BBox(*BOX),temporal={'start':dt.datetime.combine(start,dt.time.min),'stop':stop},**kw)


def start_job(client,archive,start,end,*,variables=None):
    request=make_request(start,end,variables=variables)
    if not request.is_valid():raise ValueError('Invalid Harmony request')
    job=client.submit(request)
    # Saved before any download; users may recover by job id on next run.
    atomic_json(archive/'reports'/f'job_{start}_{end}.json',{'job':job,'start':str(start),'endInclusive':str(end),'collection':COLLECTION,'bbox':BOX,'variables':variables or ['all']})
    print('SUBMITTED JOB:',job,'DATES:',start,'through',end,'inclusive')
    return job


def run(args):
    archive=Path(args.archive).resolve();archive.mkdir(parents=True,exist_ok=True)
    client=client_login()
    if args.command=='diagnose':
        return inspect_existing(client,args.job,archive,download=not args.no_download,date_hint=args.date_hint)
    if args.command=='status':
        job_status(client,args.job,archive);return 0
    start=dt.date.fromisoformat(args.start);end=dt.date.fromisoformat(args.end)
    if start>end:raise ValueError('Start must precede end')
    if args.command=='smoke' and (end-start).days>6:raise ValueError('Smoke must not exceed 7 days')
    if args.command=='collect' and (end-start).days>30:raise ValueError('Collect safely supports one <=31-day request at a time')
    # A reported completion belongs to the exact date interval, not to the product historically.
    job=start_job(client,archive,start,end,variables=args.variables)
    if args.submit_only:
        return 0
    # Bounded polling; avoid infinite loops/indefinite server waits.
    for _ in range(args.polls):
        state=client.status(job).get('status')
        print('STATUS:',state)
        if state in TERMINAL:break
        if args.polls>1:time.sleep(args.poll_interval)
    return inspect_existing(client,job,archive,date_hint=start.isoformat() if start==end else None)


def cli():
    ap=argparse.ArgumentParser(description=__doc__)
    sub=ap.add_subparsers(dest='command',required=True)
    for name in ('diagnose','status','smoke','collect'):
        p=sub.add_parser(name);p.add_argument('--archive',default='earthdata_archive')
        if name in ('diagnose','status'):
            p.add_argument('--job',default=DEFAULT_JOB)
            if name=='diagnose':p.add_argument('--no-download',action='store_true');p.add_argument('--date-hint')
        else:
            p.add_argument('--start',default='2015-01-01');p.add_argument('--end',default='2015-01-01')
            p.add_argument('--variables',nargs='+');p.add_argument('--submit-only',action='store_true')
            p.add_argument('--polls',type=int,default=1);p.add_argument('--poll-interval',type=int,default=20)
    args=ap.parse_args()
    try:return run(args)
    except KeyboardInterrupt:print('\nCancelled; previous archive preserved.');return 130
    except Exception as ex:
        print(f'ERROR {type(ex).__name__}: {redact(str(ex))}',file=sys.stderr)
        return 1

if __name__=='__main__':sys.exit(cli())
