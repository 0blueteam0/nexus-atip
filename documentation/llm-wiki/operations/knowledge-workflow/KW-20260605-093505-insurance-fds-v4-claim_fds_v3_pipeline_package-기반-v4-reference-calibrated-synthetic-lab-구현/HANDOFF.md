# Handoff

## What changed

- Added v4 reference-calibrated synthetic lab modules and tests.
- Updated run_demo.py to generate v4 outputs automatically.
- Updated README and added V4_REFERENCE_CALIBRATION_NOTES.md.

## Verify

```bash
cd J:/PortableApps/genai/A3Work/FDSWork/GPTWork_FDS/claim_fds_v3_pipeline_package/claim_fds_v3_pipeline
PYTHONPATH=. pytest -q
PYTHONPATH=. python run_demo.py
```

Expected: 6 tests pass; run_demo prints `v4_lab.ok: true` and `quality_gate.pass: true`.

## Next

- Generate multiple claim_pair/provider/template/device groups so train/validation/test are non-empty.
- Add pharmacy receipt and prescription renderers.
- Extend reference profiler with table density, line thickness, stamp/crop/perspective/blur statistics.
