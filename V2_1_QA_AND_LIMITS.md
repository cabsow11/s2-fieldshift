# V2.1 — QA and honest completeness statement

Implemented:
- Cloudflare Pages Function live NASA POWER with UTC, bounds/date validation, missing-value handling, NASA source URL, edge caching.
- NASA CMR first-page discovery for IMERG and SMAP.
- Earthdata-authenticated resumable archive sync and extraction, dates coverage ledger and publication helper.
- User-facing controls and publication coverage status.
- Preserved existing V2.0 scientific bundle: 4018 POWER historical rows (original export time convention not established UTC), 122 UTC paired dates, 9 SMAP dates, 250 IMERG spatial samples.

Verified in container:
- JavaScript syntax for both functions.
- Mocked NASA POWER HTTP gateway: two response days with null missing-value handling and UTC query PASS.
- Invalid latitude blocked PASS.
- Archive publication script with fake test record PASS.
- `py_compile` of both Python scripts PASS.
- TypeScript **syntax-only** across application (not complete typecheck) PASS.

Not verified:
- Live remote NASA response: container's outbound internet connections blocked.
- NASA Earthdata user authorization and multi-year sync: no Earthdata credentials or outbound network.
- Full React TS typechecking, Vitest and Vite build: npm dependency installation unavailable in this runtime.
- Cloudflare production deploy: user account/project not connected to this execution environment.

**CRITICAL**: This V2.1 archive DOES NOT contain a newly acquired full IMERG/SMAP dataset. Do not say that it does. Its network gateway and authenticated collectors are delivered, but actual 2015–2025 full satellite archives require executing sync with Earthdata authorization, then publishing its outputs, and ensuring all missing-date coverage checks pass. Farm plot soils and counterfactual yield effects require on-site evidence and controlled agricultural studies.
