#!/usr/bin/env python3
"""Resumable, date-audited NASA GPM IMERG V07 Kaolack Harmony acquisition.

python scripts/collect_harmony_region.py plan --start 2015-01-01 --end 2025-12-31
python scripts/collect_harmony_region.py run --start 2015-01-01 --end 2015-01-07 --max-jobs 1
python scripts/collect_harmony_region.py run --start 2015-01-01 --end 2025-12-31 --max-jobs 1
python scripts/collect_harmony_region.py audit --start 2015-01-01 --end 2025-12-31
python scripts/collect_harmony_region.py publish --start 2015-01-01 --end 2025-12-31

The ISO end date is INCLUSIVE. No secrets saved. The output is a spatial time-series
of extracted NASA gridded estimates, not a calibrated farm yield model.
"""
from __future__ import annotations
import argparse, calendar, datetime as dt, hashlib, json, os, re, sys, time
from pathlib import Path
from harmony_recovery import BOX,COLLECTION,TERMINAL,atomic_json,client_login,extract_daily,redact,safe_download

DATE_RE=re.compile(r'(20\d{6})')


def days(start,end):
    return [(start+dt.timedelta(days=i)).isoformat() for i in range((end-start).days+1)]


def calendar_months(start,end):
    cursor=dt.date(start.year,start.month,1)
    while cursor<=end:
        last=dt.date(cursor.year,cursor.month,calendar.monthrange(cursor.year,cursor.month)[1])
        yield max(start,cursor),min(end,last)
        cursor=dt.date(cursor.year+1,1,1) if cursor.month==12 else dt.date(cursor.year,cursor.month+1,1)


def record_date(p):
    m=DATE_RE.search(Path(p).name)
    if m:
        try:return dt.datetime.strptime(m.group(1),'%Y%m%d').date().isoformat()
        except ValueError:return None
    return None


def load_index(root):
    p=root/'harmony_batch'/'index.json'
    if p.exists():
        data=json.loads(p.read_text(encoding='utf-8'))
        if data.get('collection')!=COLLECTION or list(data.get('bbox',[]))!=list(BOX):
            raise ValueError('Archive index collection or bounding box differs; use another --archive directory')
        return data
    return {'schema':'fieldshift.harmony.batch.v1','collection':COLLECTION,'bbox':list(BOX),'jobs':{},'daily':{}}


def save_index(root, idx):atomic_json(root/'harmony_batch'/'index.json',idx)


def audit(idx,start,end):
    expected=days(start,end)
    present=[];missing=[];invalid=[]
    for d in expected:
        r=idx['daily'].get(d)
        if r is None:missing.append(d)
        elif r.get('status')=='VALIDATED' and r.get('validCells',0)>0 and r.get('cells',0)>0 and r.get('record'):
            present.append(d)
        else:invalid.append(d)
    return {'collection':COLLECTION,'bbox':list(BOX),'start':str(start),'endInclusive':str(end),'expectedDays':len(expected),'validatedDays':len(present),'missingDays':missing,'invalidDays':invalid,
       'status':'COMPLETE_DATE_COVERAGE' if not missing and not invalid else 'INCOMPLETE',
       'caveat':'Validated dates/pixels and units are not ground station accuracy or crop response. At most one processed regional daily layer per day.'}


def consistent_date(name,rows):
    date=record_date(name)
    if not date or not rows or any(r['date']!=date for r in rows):raise ValueError('Source date missing or inconsistent with extracted records')
    return date


def ingest(root,idx,file,job,allowed):
    """Reject wrong dates; validate cells; store a deterministic per-date JSON."""
    rows,meta=extract_daily(file)
    date=consistent_date(file.name,rows)
    if date not in allowed:return ('OUTSIDE_REQUEST',date)
    if meta['cells']!=len(rows) or len({(r['lat'],r['lon']) for r in rows})!=len(rows):raise ValueError('Grid coordinates not unique')
    finite=[r for r in rows if r['rain'] is not None]
    if not finite:raise ValueError('No valid precipitation values in subset')
    keyhash=hashlib.sha256(Path(file).read_bytes()).hexdigest()
    target=root/'harmony_batch'/'daily'/f'{date}.json'
    previous=idx['daily'].get(date)
    if previous and previous.get('status')=='VALIDATED' and (root/previous['record']).exists():
        return ('SKIPPED_VALIDATED',date)
    atomic_json(target,{'date':date,'source':'NASA GPM IMERG Final Daily V07B via Harmony',
                        'collection':COLLECTION,'bbox':list(BOX),'sourceFile':Path(file).name,'sourceSHA256':keyhash,
                        'units':'mm/day','cells':rows,'qa':meta,'harmonyJob':job})
    idx['daily'][date]={'status':'VALIDATED','record':str(target.relative_to(root)).replace('\\','/'),
                        'cells':len(rows),'validCells':len(finite),'sourceSHA256':keyhash,'harmonyJob':job}
    save_index(root,idx)
    return ('VALIDATED',date)


def create_request(start,end):
    from harmony import BBox,Collection,Request
    # Bound the last day at 23:59:59, rather than next day at midnight.
    stop=dt.datetime.combine(end,dt.time(23,59,59))
    request=Request(collection=Collection(id=COLLECTION),spatial=BBox(*BOX),
                    temporal={'start':dt.datetime.combine(start,dt.time.min),'stop':stop})
    if not request.is_valid():raise ValueError('Harmony request schema invalid')
    return request


def handle(client,root,idx,key,a,b,args):
    j=idx['jobs'].get(key)
    if j and j.get('state')=='DONE' and all(idx['daily'].get(d,{}).get('status')=='VALIDATED' for d in days(a,b)):
        print('SKIP validated interval',key,flush=True);return 'DONE'
    if j and j.get('id'):
        job=j['id'];print('RESUME existing Harmony job',key,job,flush=True)
    else:
        job=client.submit(create_request(a,b))
        idx['jobs'][key]={'id':str(job),'start':str(a),'endInclusive':str(b),'state':'SUBMITTED','attempts':1}
        save_index(root,idx)
        print('SUBMITTED',key,job,flush=True)
    # Poll for a bounded period; leave resumable job ID on timeout.
    state=''
    for poll in range(args.polls):
        s=client.status(job);state=s.get('status','unknown')
        print('STATUS',key,state,'progress',s.get('progress'),flush=True)
        if state in TERMINAL:break
        if poll<args.polls-1:time.sleep(args.poll_interval)
    idx['jobs'][key]['harmonyStatus']=state
    if state not in TERMINAL:
        idx['jobs'][key]['state']='PENDING';save_index(root,idx)
        return 'PENDING'
    s=client.status(job)
    idx['jobs'][key]['errors']=redact(s.get('errors',[]))
    idx['jobs'][key]['warnings']=redact(s.get('warnings',[]))
    idx['jobs'][key]['state']='RETRIEVING';save_index(root,idx)
    if state not in ('successful','complete_with_errors'):
        idx['jobs'][key]['state']='FAILED';save_index(root,idx);return 'FAILED'
    files,dlerrors=safe_download(client,str(job),root)
    idx['jobs'][key]['downloadErrors']=dlerrors
    allowed=set(days(a,b));counts={}
    for fname in files:
        try:
            outcome,date=ingest(root,idx,Path(fname),str(job),allowed)
            counts[outcome]=counts.get(outcome,0)+1
            print(outcome,date,flush=True)
        except Exception as ex:
            print('INVALID FILE',Path(fname).name,type(ex).__name__,redact(str(ex)),flush=True)
            counts['INVALID']=counts.get('INVALID',0)+1
    missing=[d for d in allowed if idx['daily'].get(d,{}).get('status')!='VALIDATED']
    idx['jobs'][key]['results']=counts
    idx['jobs'][key]['missingDates']=sorted(missing)
    idx['jobs'][key]['state']='DONE' if not missing else 'PARTIAL'
    save_index(root,idx)
    print('INTERVAL',key,'validated',len(allowed)-len(missing),'/',len(allowed),
          'NASA status',state,'unresolved',sorted(missing)[:10],flush=True)
    return idx['jobs'][key]['state']


def run(args):
    start=dt.date.fromisoformat(args.start);end=dt.date.fromisoformat(args.end)
    if start>end:raise ValueError('start > end')
    root=Path(args.archive).resolve();root.mkdir(parents=True,exist_ok=True)
    idx=load_index(root)
    if args.command=='plan':
        intervals=list(calendar_months(start,end))
        report=audit(idx,start,end)
        print(json.dumps({'months':len(intervals),'first':str(intervals[0][0]),'last':str(intervals[-1][1]),'expectedDays':report['expectedDays'],'validated':report['validatedDays'],'missing':len(report['missingDays'])},indent=2))
        return 0
    if args.command=='audit':
        report=audit(idx,start,end)
        # Confirm references still exist and are parsable, then recompute audit.
        for date in days(start,end):
            entry=idx['daily'].get(date)
            if entry and entry.get('status')=='VALIDATED':
                p=root/entry['record']
                try:
                    obj=json.loads(p.read_text(encoding='utf-8'))
                    if obj['date']!=date or len(obj['cells'])!=entry['cells'] or not any(x['rain'] is not None for x in obj['cells']):raise ValueError('Record corrupt')
                except Exception:
                    entry['status']='INVALID'
        save_index(root,idx)
        report=audit(idx,start,end)
        atomic_json(root/'harmony_batch'/'coverage_report.json',report)
        print(json.dumps({k:v for k,v in report.items() if k not in ('missingDays','invalidDays')},indent=2))
        print('First missing dates:',report['missingDays'][:30]);print('Invalid dates:',report['invalidDays'][:30])
        return 0 if report['status']=='COMPLETE_DATE_COVERAGE' else 2
    if args.command=='publish':
        return publish(root,idx,start,end,Path(args.dest))
    client=client_login()
    intervals=list(calendar_months(start,end))
    processed=0
    for a,b in intervals:
        if processed>=args.max_jobs:break
        missing=[dt.date.fromisoformat(d) for d in days(a,b) if idx['daily'].get(d,{}).get('status')!='VALIDATED']
        if not missing:continue
        key=f'{a}_{b}'
        outcome=handle(client,root,idx,key,a,b,args);processed+=1
        if outcome in ('FAILED','PENDING'):
            print('STOP: job is failed/pending. Re-run same command for status or recovery.');break
        # Optional per-day fallback ONLY for actually missing days, bounded by max jobs.
        if outcome=='PARTIAL' and args.retry_missing:
            for d in missing:
                if processed>=args.max_jobs:break
                if idx['daily'].get(d,{}).get('status')=='VALIDATED':continue
                handle(client,root,idx,f'{d}_{d}',d,d,args);processed+=1
    report=audit(idx,start,end)
    atomic_json(root/'harmony_batch'/'coverage_report.json',report)
    print('TOTAL validated',report['validatedDays'],'/',report['expectedDays'],
          'missing',len(report['missingDays']),'invalid',len(report['invalidDays']),
          'job budget used',processed)
    return 0 if report['status']=='COMPLETE_DATE_COVERAGE' else 2


def publish(root,idx,start,end,dest):
    report=audit(idx,start,end)
    rows=[]
    for d in days(start,end):
        info=idx['daily'].get(d)
        if info and info.get('status')=='VALIDATED':
            obj=json.loads((root/info['record']).read_text(encoding='utf-8'))
            rows.extend(obj['cells'])
    # Format consumed by PublishedEarthdata React widget; incomplete always shown.
    output={'provenance':'NASA GPM IMERG Final Daily V07B; Harmony spatial subsetting; date-by-date validation',
            'generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),
            'layers':{'imerg':{'recordCount':len(rows),'records':rows,'coverage':{
                  'product':'imerg','status':report['status'],'expectedDailyDates':report['expectedDays'],
                  'observedDailyDates':report['validatedDays'],'missingDailyDates':report['missingDays']},
                  'granulesWithErrors':[key for key,j in idx['jobs'].items() if j.get('state') not in ('DONE',)]}}}
    dest.parent.mkdir(parents=True,exist_ok=True);atomic_json(dest,output)
    print('PUBLISHED',dest,report['validatedDays'],'days',len(rows),'pixels; status',report['status'])
    if report['status']!='COMPLETE_DATE_COVERAGE':print('WARNING: INCOMPLETE coverage correctly shown in application')
    return 0


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('command',choices=('plan','run','audit','publish'))
    p.add_argument('--start',default='2015-01-01');p.add_argument('--end',default='2025-12-31')
    p.add_argument('--archive',default='earthdata_archive')
    p.add_argument('--dest',default='public/data/earthdata_connected.json')
    p.add_argument('--max-jobs',type=int,default=1)
    p.add_argument('--polls',type=int,default=5)
    p.add_argument('--poll-interval',type=int,default=15)
    p.add_argument('--retry-missing',action='store_true')
    args=p.parse_args()
    if args.max_jobs<0 or args.polls<1 or args.poll_interval<0:p.error('Invalid numeric argument')
    try:return run(args)
    except KeyboardInterrupt:print('Interrupted; index and files preserved.');return 130
    except Exception as ex:print('ERROR:',type(ex).__name__,redact(str(ex)),file=sys.stderr);return 1

if __name__=='__main__':sys.exit(main())
