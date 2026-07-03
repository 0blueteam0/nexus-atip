---
type: handoff
status: complete
project: Red Team Studio
updated: 2026-07-03T12:36:00+09:00
---

# Handoff

## 현재 상태

RedTeam AX WSL runtime readiness blocker was narrowed and resolved for runtime readiness by selecting an alternate usable non-internal distro. The persistent `/goal` remains active and incomplete because OpenVAS/ZAP organization endpoints, vault references, and real six-tool operating closure are still missing.

## 완료된 것

- `redteam_ax_wsl_runtime_readiness.py` now probes fallback WSL distros when no distro is explicitly requested.
- The broken default `Ubuntu-22.04` probe is preserved with `0x80070570` VHDX mount failure classification.
- `Ubuntu-22.04-AISOC-Rebuild` is selected as ready because it starts and exposes relevant tool paths.
- Accepted gate manifest now includes a deterministic WSL fallback unit gate.
- OpenVAS/ZAP CLI smoke no longer repeats network pip install when isolated CLI executables already exist.
- Plans, completion audit, and LLM Wiki were updated to remove WSL from remaining blockers while keeping external scanner and real closure blockers.

## 검증된 것

- WSL readiness live command exited 0 with `status=ready` and `selected_distro=Ubuntu-22.04-AISOC-Rebuild`.
- Strict live readiness promotion exited 0 with Docker and WSL gates passed, and external OpenVAS/ZAP gates blocked.
- `pytest -s` targeted API completion review plus WSL readiness tests: 2 passed.
- Accepted gate manifest: 27/27 passed.
- Development byproduct exclusion review: passed with 193 excluded byproduct refs.
- Goal completion review: `goal_completion_blocked`, unresolved item count 1, remaining gap count 3.

## 아직 위험한 것

- Default `Ubuntu-22.04` VHDX remains broken and is not repaired.
- No approved organization OpenVAS read-only report endpoint or vault ref is configured.
- No approved OWASP ZAP passive alert endpoint or vault ref is configured.
- Real non-byproduct Nuclei/OpenVAS/Trivy/SCA/npm audit/ZAP operating outputs have not completed Evidence/Finding/Matrix/Report/export closure.

## 열린 질문

- Which organization OpenVAS/ZAP endpoints and vault references should be used for the approved live import gates?
- Who will provide two-person approval for final real Findings and report export?

## 다음 액션

1. Configure approved OpenVAS/ZAP endpoint and vault environment variables.
2. Run strict promotion with `--allow-container --allow-network --require-promotion`.
3. Submit real six-tool outputs through governed Evidence Card import.
4. Promote Findings only when Claim-Evidence Matrix has zero unsupported claims.
5. Run final completion gate and keep `/goal` incomplete until it reports `complete=true`.

## 반드시 읽을 문서

- `projects/ai-agentic-soc/Red Team Studio/고도화/completion-audit/REDTEAM_AX_COMPLETION_AUDIT_MATRIX.md`
- `projects/ai-agentic-soc/Red Team Studio/고도화/llm-wiki/LLM_WIKI_HOME.md`
- `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-wsl-runtime-readiness/latest_wsl_runtime_readiness.json`
- `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-strict-live-readiness-promotion/latest_strict_live_readiness_promotion.json`
- `projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`

## 관련 도구와 스크립트

- `projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_wsl_runtime_readiness.py`
- `projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py`
- `projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_openvas_zap_cli_live_smoke.py`
- `projects/ai-agentic-soc/tests/test_redteam_ax_wsl_runtime_readiness.py`

## 다시 논의하지 않아도 되는 결정

- A usable alternate non-internal WSL distro is sufficient for WSL runtime readiness when the failed default probe is still preserved as evidence.
- Docker and WSL readiness do not satisfy external OpenVAS/ZAP endpoint/vault readiness.
- The RedTeam AX goal must remain incomplete until real operating scanner evidence and final report closure gates pass.
