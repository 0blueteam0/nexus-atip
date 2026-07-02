---
type: evidence_unit
status: draft
id: EU-REDTEAM-AX-SCA-CYCLONEDX-20260703
project: Red Team Studio
created: 2026-07-03T04:15:22+09:00
---

# Evidence Unit

## Claim

RedTeam AX SCA collection now preserves CycloneDX component inventory evidence and vulnerability affected-component links before any report claim is allowed.

## Source

- source_type: source_code_and_regression
- path_or_url: J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py
- command: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py -q`
- exit_code: 0
- collected_at: 2026-07-03T04:15:22+09:00

## Evidence

- `_normalize_sca_output` emits `sca_component_inventory_evidence`.
- SCA vulnerabilities include `affected_component_refs`, `affected_components`, `requires_component_match_review`.
- Regression imports SCA CycloneDX plus npm audit through governed toolchain and verifies SCA agent summary, parser, component evidence, vulnerability evidence, and affects linkage.

## Confidence

High for source/test coverage of SCA/SBOM normalization.

## Limits

This does not prove a real organization SBOM was approved or completed through report/export gates.

## Related Decisions

- Keep component inventory and vulnerability applicability separate until human review.
