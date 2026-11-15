#!/usr/bin/env python3
"""Real Earthdata short smoke: download/extract 7 dates, fail on missing/invalid NASA results."""
import json,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
output=root/'earthdata_archive'
cmd=[sys.executable,str(root/'scripts/sync_earthdata.py'),'--product','imerg','--start','2015-01-01','--end','2015-01-07','--output',str(output),'--max-errors','3']
print('Running:', ' '.join(cmd),flush=True)
r=subprocess.run(cmd,cwd=root)
if r.returncode:
 print('Smoke FAILED. Collector exited',r.returncode)
 sys.exit(r.returncode)
cov=json.loads((output/'imerg_coverage.json').read_text(encoding='utf-8'))
manifest=json.loads((output/'imerg_manifest.json').read_text(encoding='utf-8'))
assert cov['expectedDailyDates']==7 and cov['observedDailyDates']>=7 and not cov['missingDailyDates'],cov
processed=[x for x in manifest['files'].values() if x.get('status')=='ok' and '2015-01-01'<=x.get('date','')<='2015-01-07']
assert len(set(x['date'] for x in processed))==7,'Date coverage failed'
for x in processed:
 rec=json.loads((output/x['recordFile']).read_text(encoding='utf-8'))
 assert rec['collection']=='GPM_3IMERGDF' and rec['date']==x['date']
 vals=rec['values']
 assert vals and all(13.79<=r['lat']<=14.51 and -16.51<=r['lon']<=-15.59 for r in vals)
 assert all(r['rain'] is None or 0<=r['rain']<2000 for r in vals)
 assert any(r['rain'] is not None for r in vals),'All pixels missing'
print('PASS: 7 distinct NASA dates with georeferenced valid rainfall values, persisted.',flush=True)
