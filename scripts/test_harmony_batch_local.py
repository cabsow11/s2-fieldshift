import unittest,tempfile,json
from datetime import date
from pathlib import Path
import collect_harmony_region as m
class TestBatch(unittest.TestCase):
 def test_datecount(self):self.assertEqual(len(m.days(date(2015,1,1),date(2015,1,7))),7)
 def test_leap(self):self.assertEqual(len(m.days(date(2016,1,1),date(2016,12,31))),366)
 def test_total(self):self.assertEqual(len(m.days(date(2015,1,1),date(2025,12,31))),4018)
 def test_month_split(self):
  x=list(m.calendar_months(date(2015,1,15),date(2015,3,3)))
  self.assertEqual([(str(a),str(b)) for a,b in x],[('2015-01-15','2015-01-31'),('2015-02-01','2015-02-28'),('2015-03-01','2015-03-03')])
 def test_coverage(self):
  idx={'daily':{'2015-01-01':{'status':'VALIDATED','validCells':63,'cells':63,'record':'x'}}}
  a=m.audit(idx,date(2015,1,1),date(2015,1,3))
  self.assertEqual(a['validatedDays'],1);self.assertEqual(a['missingDays'],['2015-01-02','2015-01-03'])
 def test_half_open_end_excluded(self):
  s=Path('3B-DAY.MS.MRG.3IMERG.20150108-S000000-E235959.V07B_subsetted.nc4')
  self.assertEqual(m.record_date(s),'2015-01-08')
 def test_included_real_data(self):
  root=Path(__file__).resolve().parent.parent/'earthdata_archive'
  idx=json.loads((root/'harmony_batch'/'index.json').read_text())
  self.assertEqual(len(idx['daily']),7)
  for date,r in idx['daily'].items():
   obj=json.loads((root/r['record']).read_text())
   self.assertEqual(obj['date'],date);self.assertEqual(len(obj['cells']),63)
   self.assertEqual(sum(x['rain'] is not None for x in obj['cells']),63)
if __name__=='__main__':unittest.main()
