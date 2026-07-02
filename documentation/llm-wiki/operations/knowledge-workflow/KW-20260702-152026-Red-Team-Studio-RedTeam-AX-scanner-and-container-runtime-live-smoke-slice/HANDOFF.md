---
type: handoff
status: active
project: Red-Team-Studio
updated: 2026-07-02T15:20:26+09:00
---

# Handoff

## 현재 상태

## 완료된 것

## 검증된 것

## 아직 위험한 것

## 열린 질문

## 다음 액션

## 반드시 읽을 문서

## 관련 도구와 스크립트

## 다시 논의하지 않아도 되는 결정



## Autofill Handoff

Current state: RedTeam AX scanner CLI live smoke slice: installed checksum-verified portable official Nuclei v3.10.0 and Trivy v0.72.0 under tools/redteam-ax, ran both through ToolActionCard, ExecutionPlan, wrapper pin, execution token, shell=false governed runner, sanitizer, agent normalization, and Evidence Card creation; accepted gate manifest now passes 10/10. OpenVAS/ZAP CLI or service and Docker daemon remain runtime blockers.

Next action: Provide or start OpenVAS/ZAP service endpoints and restore Docker Desktop daemon, then run remaining live smokes.

Required artifacts:
- J:/PortableApps/genai/projects/ai-agentic-soc/Red Team Studio/고도화/sanity/redteam_ax_scanner_cli_live_smoke.py
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-scanner-cli-live-smoke/latest_scanner_cli_live_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-runtime-smoke/latest_container_runtime_smoke.json
- J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json

Required command evidence:
- ../.venv/Scripts/python.exe 고도화/sanity/redteam_ax_scanner_cli_live_smoke.py => exit 0, Nuclei/Trivy passed
- ../.venv/Scripts/python.exe 고도화/sanity/redteam_ax_container_runtime_smoke.py --require-real => exit 1, Docker daemon unavailable blocker artifact
- ../.venv/Scripts/python.exe 고도화/sanity/redteam_ax_accepted_gate_manifest.py => exit 0, 10/10 gates passed
- ../.venv/Scripts/python.exe 고도화/sanity/test_completion_audit_matrix.py => exit 0
- ../.venv/Scripts/python.exe 고도화/sanity/test_plan_contract.py => exit 0

Remaining risks:
- Large portable binaries are installed locally but should not be committed to GitHub; the smoke script re-downloads and verifies them from official release checksums.

Future agent rule: start from this session directory and the project-specific source-of-truth ledgers before using chat history.
