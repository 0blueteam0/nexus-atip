---
type: evidence_unit
status: complete
id: EU-REDTEAM-AX-PARSER-NORMALIZERS-20260701
project: Red Team Studio
created: 2026-07-01T16:04:49+09:00
updated: 2026-07-01T16:18:00+09:00
---

# Evidence Unit

## Claim

RedTeam AX v2 can normalize representative Nuclei, Trivy, npm audit, OWASP ZAP, OpenVAS, and generic SCA outputs into untrusted, analyst-review-required structured evidence candidate items.

## Source

- source_type: code
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/runtime/redteam_v2_models.py`
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- command: `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`
- exit_code: 0
- command: live 8765 parser smoke
- exit_code: 0
- collected_at: 2026-07-01T16:18:00+09:00

## Evidence

- 28 v2 router tests OK.
- Parser fixture test covers all 6 required tools.
- Live API smoke produced normalized artifacts for Nuclei and Trivy with parser reports and `trusted=false`.

## Confidence

High for representative parser contract behavior. Medium for production parser completeness because real-world output variants still need broader fixture coverage.

## Limits

No actual scanner execution, file upload, or sandbox runner is implemented in this slice.

## Related Decisions

- DEC-PARSER-CANDIDATE-ONLY
- DEC-RAW-OUTPUT-UNTRUSTED
