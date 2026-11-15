# S² FieldShift V2.0 — Real Evidence & Import Pathways

## Acquired and embedded, not simulated
- **NASA POWER** 4,018 daily climate rows (2015–2025), with source-convention caution from V1.9.
- **NASA POWER UTC + GPM IMERG** 122 matched days Jun–Sep 2024, unchanged.
- **GPM IMERG Final V07B** 250 real georeferenced 0.1° pixels on **10 days only** (1–7 June plus 1–3 August 2024). Seven June daily NetCDF/HDF5 source granules were extracted from the previously provided `imerg.rar`; the three August dates were already integrated in V1.9. No dates in between are interpolated.
- **SMAP L4** nine point samples from the existing evidence archive; NOT continuous.

## New useable data pathways
A standalone **Connect missing evidence** panel in Climate Evidence can import schema-controlled CSV files for (1) IMERG daily spatial pixels; (2) SMAP soil moisture; (3) SoilGrids model estimates or physical laboratory soil measurements; (4) FAO GAEZ scenario yield potential; (5) parcel or survey harvest observations. CSV templates are in `templates/`. Type-specific constraints, physical value ranges, provenance, date validity, duplicate grid/series keys and browser size limits are checked. Imported data are displayed only in a temporary local session and never automatically treated as agronomic superiority.

## Not obtained
Full 11-year IMERG spatial daily archive, 11-year SMAP L4 daily series, local SoilGrids/GAEZ downloads, plot soil lab samples, DAPSA EAA microdata and plot rotation trials. These cannot be magically created from 10 granules and do not become 'integrated' merely because an importer exists.

## Acquisition instructions
- IMERG: NASA GES DISC `GPM_3IMERGDF_07` daily Final, Earthdata account; request subset bbox **-16.5 to -15.6 longitude, 13.8 to 14.5 latitude**, 2015–2025. Ensure daily values are mm/day before converting pixels to CSV.
- SMAP: AppEEARS/NSIDC `SPL4SMGP` 3-hourly surface and root-zone estimates, since Mar 31, 2015. Select point or region, aggregate by UTC day with observed count per day and QA filtering; do not call this satellite model a field sensor.
- SoilGrids: REST query is temporarily suspended (per ISRIC documentation, observed Nov 2026). Prefer ISRIC WCS/WebDAV extracts, or local lab soil results. Report depths, uncertainties and whether measurement is *soilgrids_model* versus *laboratory*.
- FAO GAEZ: choose verified crop, climate, land-use assumptions and pixel resolution. Label output as **potential yield / modelled scenario**.
- DAPSA/ANSD EAA data: obtain under licence; plot/crop/year/sources required and protect confidential farm information; treatment assignment and baseline are needed for causal rotation claims.

## Verification
Use `npm install; npm test; npm run build; npm run preview`. Full build needs npm network modules when absent.
