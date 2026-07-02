---
type: evidence_unit
status: completed
id: EU-REDTEAM-AX-TOOLCHAIN-COLLECT-001
project: Red Team Studio
created: 2026-07-02T23:08:47+09:00
---

# Evidence Unit

## Claim

`/api/redteam/v2/toolchains/{toolchain_id}/collect-results` provides a governed collection lane for multi-tool runner outputs: it reads stored artifacts, sanitizes them, runs tool-specific normalizers, and creates only candidate Evidence Cards.

## Source

- source_type: source_and_test
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_api_router.py`
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- command: `pytest tests/test_redteam_v2_api_router.py -q`
- exit_code: 0
- collected_at: 2026-07-02T23:00:00+09:00

## Evidence

- Full v2 API regression completed with 59 passed.
- Accepted gate manifest completed with status passed, 24/24 gates.
- Frontend contract and Korean copy sanity passed after adding visible collection API anchors.

## Confidence

- High for the implemented API contract and regression-tested mock toolchain path.

## Limits

- This does not prove real operating outputs from all required tools have been collected and approved.
- Evidence Cards created by collection remain candidates until human review/approval.

## Related Decisions

- Keep scanner execution and result collection separated; collection does not run new commands.
- Keep Finding/Claim/Report promotion behind existing Evidence approval and Matrix/report gates.
