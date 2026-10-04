# Public covers: production verification, 2026-10-04

Production: https://bibliesi-public.75.119.140.201.nip.io/

## Before / after

Fresh browser contexts, desktop 1280x800 and mobile-sized 390x844; no artificial
network throttling. This is not a physical iPhone benchmark.

| Measurement | Before | After |
| --- | --- | --- |
| First visible desktop cover requests | 846–1856 ms | 58–87 ms |
| First visible mobile cover request | 2162 ms | 35 ms |
| Repeated visit, first visible covers | Up to 1725 ms | 0–6 ms |
| First cover, elapsed from navigation | About 2.8 s | About 0.6 s |
| Same eight original/optimized files | 336140 bytes | 220194 bytes |
| Same eight URLs, server benchmark median | 1521 ms | 148 ms |

The cache was warmed before the after measurements. A newly encountered cover
still needs its initial provider download and conversion; Internet conditions
and device performance affect timings. Source files are not rewritten.

69 unique source URLs checked: 43 available, 26 unavailable even with configured
provider fallback. Unavailable URLs render a placeholder, not an invented cover.
Prepared WebP data: 857746 bytes; persistent cache approximately 1 MiB.

## Checks

- Grid, list, detail dialog, pagination: passed at mobile viewport.
- Offline reload: cached catalogue and visited cover rendered, warning shown.
- No JavaScript page errors in these browser checks.
- Three restricted-provider/redirect tests passed.
- Production Nginx configuration valid; image service healthy, private port.
- Arbitrary URL injection rejected with HTTP 404.
- Image service approximately 30 MiB RAM, limited to 256 MiB / one CPU.
- Runtime dependency audits: no reported vulnerabilities at verification time.

Re-run browser probes with the Playwright CLI `run-code --filename` option:
`scripts/browser-cover-metrics.js` and `scripts/browser-cover-regression.js`.
For raw/optimized HTTP comparison use `scripts/benchmark-covers.mjs`.
