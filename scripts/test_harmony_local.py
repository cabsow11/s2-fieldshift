"""Local offline test for Harmony client-independent components."""
import importlib.util, json, tempfile, unittest
from pathlib import Path
import numpy as np
import xarray as xr
spec=importlib.util.spec_from_file_location('harmony_recovery',Path(__file__).with_name('harmony_recovery.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
 def test_units(self):
  self.assertEqual(m.normalize_unit('mm/day'),1)
  self.assertEqual(m.normalize_unit('mm/hr'),24)
  with self.assertRaises(ValueError):m.normalize_unit('unknown')
 def test_redact(self):
  self.assertNotIn('123456',str(m.redact({'access_token':'123456','message':'token=abc'})))
 def test_extract(self):
  with tempfile.TemporaryDirectory() as folder:
   p=Path(folder)/'harmony_20150101.nc'
   d=xr.Dataset({'precipitation':(('time','lat','lon'),np.array([[[2.0,3.0],[4.0,5.0]]]))},coords={'time':np.array(['2015-01-01'],dtype='datetime64[ns]'),'lat':[14.1,14.2],'lon':[-16.1,-16.0]})
   d['precipitation'].attrs['units']='mm/day'
   d.to_netcdf(p,engine='scipy')
   rows,info=m.extract_daily(p)
   self.assertEqual(len(rows),4)
   self.assertEqual(sum(x['rain'] for x in rows),14)
   self.assertEqual(rows[0]['date'],'2015-01-01')
 def test_no_silent_missing(self):
  with tempfile.TemporaryDirectory() as folder:
   p=Path(folder)/'harmony_20150101.nc'
   d=xr.Dataset({'precipitation':(('lat','lon'),np.array([[2.0]]))},coords={'lat':[14.1],'lon':[-16.1]})
   d['precipitation'].attrs['units']='unrecognized'
   d.to_netcdf(p,engine='scipy')
   with self.assertRaises(ValueError):m.extract_daily(p)
 def test_atomic(self):
  with tempfile.TemporaryDirectory() as folder:
   p=Path(folder)/'q.json';m.atomic_json(p,{'a':1});self.assertEqual(json.loads(p.read_text())['a'],1)
if __name__=='__main__':unittest.main()
