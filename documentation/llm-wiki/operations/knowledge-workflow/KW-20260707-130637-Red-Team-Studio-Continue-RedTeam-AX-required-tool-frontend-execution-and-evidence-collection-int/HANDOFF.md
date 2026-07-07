# Handoff

## What Changed

- Nuclei `v3.11.0` was installed locally under `Red Team Studio/고도화/tools/nuclei/nuclei.exe` from ProjectDiscovery official release.
- `redteam_v2_models.py` now defines `PORTABLE_TOOL_ROOT`, `NUCLEI_EXECUTABLE_PATH`, searches portable tool paths, and pins Nuclei SHA-256.
- API tests now cover portable tool binary discovery and current manifest count.
- Detailed and final plans document slice 105/158.

## Validation

- Python compile: passed.
- Focused pytest: 6 passed.
- Frontend runtime readiness sanity: passed.
- Frontend launch readiness sanity: passed.
- Frontend reports.js syntax check: passed at `soc-frontend-vite-react/soc-frontend/idiomatic-react/src/store/methods/reports.js`.

## Remaining Work

- OpenVAS, Trivy, SCA, npm audit, OWASP ZAP still need full install/run/result/Evidence completion evidence.
- Nuclei active scan remains disallowed until ROE/HITL approval and approved scope/template source are present.
- The downloaded Nuclei binary/archive are local environment artifacts and should remain unstaged.
