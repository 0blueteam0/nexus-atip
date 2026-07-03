---
type: evidence_unit
status: complete
id: RTA-RUNTIME-20260703
project: Red Team Studio
created: 2026-07-03T11:36:25+09:00
---

# Evidence Unit

## Claim

Docker/container runtime smoke is now proved for RedTeam AX governed ephemeral container execution, but the overall goal remains incomplete because WSL, organization OpenVAS/ZAP endpoints, and real six-tool operating closure are still missing.

## Source

- source_type: command
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-runtime-smoke/latest_container_runtime_smoke.json`
- command: `.venv\Scripts\python.exe "Red Team Studio/고도화/sanity/redteam_ax_container_runtime_smoke.py" --allow-real --require-real --timeout 90`
- exit_code: 0
- collected_at: 2026-07-03T11:38:00+09:00

- source_type: command
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-strict-live-readiness-promotion/latest_strict_live_readiness_promotion.json`
- command: `.venv\Scripts\python.exe "Red Team Studio/고도화/sanity/redteam_ax_strict_live_readiness_promotion.py" --allow-container --timeout 90`
- exit_code: 0
- collected_at: 2026-07-03T11:40:00+09:00

- source_type: command
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
- command: `.venv\Scripts\python.exe "Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py"`
- exit_code: 0
- collected_at: 2026-07-03T11:48:00+09:00

## Evidence

- `latest_container_runtime_smoke.json` has `status=passed`, Docker Desktop server ready, pinned local `aquasec/trivy` digest, `commands_executed_by_api=true`, `runner_attempt_status=executed`, and `runner_exit_code=0`.
- The launcher records network none, read-only rootfs, dropped capabilities, no-new-privileges, and ENTRYPOINT clearing.
- `latest_strict_live_readiness_promotion.json` has `passed_gate_count=1`, `failed_gate_count=3`, proving Docker passed while WSL and external scanner readiness remain blocked.
- Accepted gate manifest reports 26/26 passed after the code and audit updates.

## Confidence

High for Docker/container runtime readiness. Low for full goal completion because the remaining blockers are explicitly recorded.

## Limits

- Does not prove WSL distribution start/tool paths.
- Does not prove real organization OpenVAS/ZAP read-only endpoint imports.
- Does not prove real six-tool operating Evidence/Finding/Matrix/Report/export closure.
- Smoke/gate artifacts are runtime/control evidence, not final report claim evidence.

## Related Decisions

- Clear container image ENTRYPOINT to ensure only approved runner argv is executed.
- Keep RTA-COMP-015 partial and goal_status active_incomplete.
