---
type: evidence_unit
status: complete
id: RTA-WSL-20260703
project: Red Team Studio
created: 2026-07-03T11:57:17+09:00
---

# Evidence Unit

## Claim

WSL runtime readiness is now proved through an alternate non-internal distribution, while the broken default distribution remains recorded as failed probe evidence. The overall RedTeam AX goal remains incomplete.

## Source

- source_type: command
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-wsl-runtime-readiness/latest_wsl_runtime_readiness.json`
- command: `.venv\Scripts\python.exe "Red Team Studio/고도화/sanity/redteam_ax_wsl_runtime_readiness.py" --allow-start --require-ready --timeout 30`
- exit_code: 0
- collected_at: 2026-07-03T12:00:00+09:00

- source_type: command
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-strict-live-readiness-promotion/latest_strict_live_readiness_promotion.json`
- command: `.venv\Scripts\python.exe "Red Team Studio/고도화/sanity/redteam_ax_strict_live_readiness_promotion.py" --allow-container --timeout 90`
- exit_code: 0
- collected_at: 2026-07-03T12:01:00+09:00

- source_type: command
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
- command: `.venv\Scripts\python.exe "Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py"`
- exit_code: 0
- collected_at: 2026-07-03T12:31:00+09:00

## Evidence

- `latest_wsl_runtime_readiness.json` records `status=ready`, `selected_distro=Ubuntu-22.04-AISOC-Rebuild`, `failed_probe_count_before_selection=1`, and npm/docker paths.
- The failed default `Ubuntu-22.04` probe remains in `wsl_tool_probe_results` with VHDX mount blocker classification.
- Strict promotion records Docker and WSL gates passed, external scanner readiness/import gates blocked.
- Accepted gate manifest records 27/27 passed after adding WSL fallback unit gate.

## Confidence

High for WSL runtime fallback readiness. Low for full goal completion because external scanner and real operating closure evidence remain missing.

## Limits

- Does not repair the broken default WSL VHDX.
- Does not configure OpenVAS/ZAP organization endpoints or vault references.
- Does not provide real six-tool operating closure evidence.

## Related Decisions

- Treat a usable alternate non-internal distro as WSL runtime ready while preserving default distro failure evidence.
