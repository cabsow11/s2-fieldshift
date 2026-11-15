#!/usr/bin/env python3
"""Publish extracted scientific record manifests to Vite static assets with honest coverage.
Run after authenticated sync; files are not manufactured for missing dates.
"""
import argparse,datetime as dt,json,sys
from pathlib import Path

def main():
 p=argparse.ArgumentParser();p.add_argument('--archive',default='earthdata_archive');p.add_argument('--dest',default='public/data/earthdata_connected.json');a=p.parse_args()
 root=Path(a.archive); out={'provenance':'NASA Earthdata source granules processed by scripts/sync_earthdata.py','generatedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'layers':{}}
 for name in ('imerg','smap'):
  manifest=root/f'{name}_manifest.json'; coverage=root/f'{name}_coverage.json'
  if not manifest.exists(): continue
  m=json.loads(manifest.read_text());c=json.loads(coverage.read_text()) if coverage.exists() else {'status':'NOT_ASSESSED'}
  records=[];errors=[]
  for key,v in m['files'].items():
   if v.get('status')!='ok':errors.append(key);continue
   f=root/v['recordFile']
   if not f.exists():errors.append(key);continue
   content=json.loads(f.read_text())
   records.extend(content['values'])
  # Dedupe the same pixel+date or date+time series while retaining source ID inventory in manifest.
  keys=('date','lat','lon') if name=='imerg' else ('date','time')
  unique={tuple(r.get(k) for k in keys):r for r in records}
  records=list(unique.values());records.sort(key=lambda r:(r['date'],r.get('time') or '',r.get('lat',0),r.get('lon',0)))
  out['layers'][name]={'coverage':c,'granulesWithErrors':errors,'records':records,'recordCount':len(records)}
 dest=Path(a.dest);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(out,separators=(',',':'),allow_nan=False))
 print('Published',dest,[(x,y['recordCount'],y['coverage'].get('status')) for x,y in out['layers'].items()]);return 0
if __name__=='__main__':sys.exit(main())
