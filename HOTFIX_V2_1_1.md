# V2.1.1 — NASA IMERG extraction hotfix

Corrects `only 0-dimensional arrays can be converted to Python scalars` caused by assuming fixed NetCDF/HDF axis layout or scalar metadata attributes. Handles daily precipitation stored in 2D (lon,lat), 3D (time,lon,lat), 3D (time,lat,lon) and other unambiguous singleton-time layouts. Reads only the Kaolack ROI; checks units, preserves missing-value nulls, supports longitude conventions, and reads scale/offset scalar metadata defensively.

From the project root, replace `scripts/sync_earthdata.py` (this archive contains the full replacement project), then resume:

```cmd
python scripts\sync_earthdata.py --product imerg --start 2015-01-01 --end 2025-12-31
```

Previously completed granules are skipped through `earthdata_archive/imerg_manifest.json`. Failed records are retried. No guarantee of all historical dates before running and examining `earthdata_archive/imerg_coverage.json`.

**If errors persist**, inspect actual file dimensions on a granule before repeating thousands of downloads:

```cmd
python -c "import h5py,glob; p=glob.glob('earthdata_archive/granules/imerg/*')[0]; f=h5py.File(p); print(p); print(list(f.keys())); print(f['precipitation'].shape,dict(f['precipitation'].attrs))"
```

Do not share Earthdata passwords or tokens in chat.
