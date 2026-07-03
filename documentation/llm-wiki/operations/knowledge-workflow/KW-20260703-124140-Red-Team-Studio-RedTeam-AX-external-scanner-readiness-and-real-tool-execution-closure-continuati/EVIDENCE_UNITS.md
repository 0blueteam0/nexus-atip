---
type: evidence_unit
status: draft
id:
project: Red Team Studio
created: 2026-07-03T12:41:40+09:00
---

# Evidence Unit

## Claim

OpenVAS/ZAP credential authorization rejects unsafe endpoint refs before live service import and returns Korean operator setup guidance without storing secret material.

## Evidence

- source_path: `runtime/redteam_v2_models.py`; change: `endpoint_ref_diagnostics` and `operator_setup_guidance_ko`.
- source_path: `tests/test_redteam_v2_api_router.py`; change: valid OpenVAS endpoint and unsafe ZAP ascan URL regression.
- command: targeted pytest; exit_code: 0; result: 2 passed, 1 warning.
- artifact_path: `latest_external_scanner_service_readiness.json`; status: blocked endpoint env missing.
- artifact_path: `latest_external_scanner_service_import_live_smoke.json`; status: blocked endpoint/vault env missing.

## Limits

No organization endpoint/vault is configured and no live external service import succeeded.

## Claim

## Source

- source_type:
- path_or_url:
- command:
- exit_code:
- collected_at:

## Evidence

## Confidence

## Limits

## Related Decisions
