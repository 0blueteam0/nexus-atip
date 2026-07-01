---
type: handoff
status: complete
project: Red Team Studio
updated: 2026-07-01T16:03:00+09:00
---

# Handoff

## 현재 상태

Slice 15 Analysis ToolHub / LLM Agent Registry foundation is implemented and verified locally. The broader RedTeam AX objective remains active.

## 완료된 것

- ToolProfile registry for Nuclei, OpenVAS, Trivy, SCA, npm audit, OWASP ZAP.
- LLM analysis agent registry for each tool.
- v2 APIs for registry, governed execution, and agent analysis normalization.
- Active scanner approval gate and untrusted output envelope.
- `레드팀 분석2` ToolHub/LLM Agents panel and tool selection for Action Card planning.
- `FINAL_PLAN.md` updated with slice 15.

## 검증된 것

- 27 v2 router tests OK.
- 1 sample E2E OK.
- `node --check` OK.
- `npm.cmd run build` OK.
- live 8765 smoke OK.
- live 5177 Playwright smoke OK, screenshot at `Red Team Studio/고도화/live-smoke/redteam2-toolhub-agent-registry.png`.
- plan sanity OK.

## 아직 위험한 것

- Real CLI/container installation and version pin/hash verification are not implemented.
- Tool-specific JSON/XML parser normalizers are foundation-level, not production-depth.
- ZAP/OpenVAS credential vault and API adapters are not implemented.
- Sandbox/container network allowlist enforcement is not implemented.

## 열린 질문

- Which execution backend should be first-class for Windows local dev: Docker containers, WSL wrappers, or remote runner?
- Should OpenVAS be import-only until Greenbone service credentials are configured?

## 다음 액션

1. Add installation/probe runbook and version pin/hash verification.
2. Implement parser-specific normalizers for Nuclei JSONL, Trivy JSON, npm audit JSON, ZAP JSON, OpenVAS XML.
3. Add sandbox runner with network allowlist and max runtime/output enforcement.
4. Extend UI from registry visibility to run import/normalize/evidence workflow controls.

## 반드시 읽을 문서

- `Red Team Studio/SPEC/24_OPEN_SOURCE_TOOL_INTEGRATION_CATALOG.md`
- `Red Team Studio/SPEC/26_TOOL_EXECUTION_SANDBOX_AND_APPROVAL_SPEC.md`
- `Red Team Studio/SPEC/28_TOOL_RESULT_EVIDENCE_AND_REPORTING_SPEC.md`
- `Red Team Studio/SPEC/31_TOOLING_SECURITY_POLICY_SPEC.md`
- `Red Team Studio/FINAL_PLAN.md`

## 관련 도구와 스크립트

- `.venv/Scripts/python.exe -m unittest discover -s tests -p "test_redteam_v2_api_router.py"`
- `npm.cmd run build`
- Playwright smoke for `redteam2-toolhub-agent-registry.png`

## 다시 논의하지 않아도 되는 결정

Active scanners remain approval-gated. Tool output remains untrusted data and cannot directly support report claims without EvidenceCard review.
