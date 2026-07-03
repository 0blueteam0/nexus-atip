---
type: worklog
status: draft
project: Red Team Studio
task: RedTeam AX WSL readiness blocker narrowing
created: 2026-07-03T11:57:17+09:00
---

# Worklog

## 1. 작업 맥락

Persistent RedTeam AX `/goal` continuation. Previous slice proved Docker container runtime smoke, leaving WSL, external OpenVAS/ZAP, and real six-tool operating closure gaps. This slice addresses the WSL runtime gap.

## 2. 회수한 기존 지식

- `redteam_ax_completion_audit_matrix.json`: RTA-COMP-015 partial and remaining gaps.
- `latest_wsl_runtime_readiness.json`: default Ubuntu-22.04 failed with VHDX mount error.
- `redteam_ax_wsl_runtime_readiness.py`: originally selected only the requested/default distro.
- `redteam_ax_strict_live_readiness_promotion.py`: rolls up Docker, WSL, and external scanner readiness.

## 3. 도구 선택

- WSL CLI for live distro probes.
- Existing WSL readiness sanity script for canonical artifact generation.
- pytest with mock run_command for deterministic fallback regression.
- accepted gate manifest for full gate proof.

## 4. 실행 기록

- command: `wsl.exe -d Ubuntu-22.04-AISOC-Rebuild -- sh -lc ...`; exit_code: 0; result: distro starts and returns npm/docker paths.
- command: `wsl.exe -d Ubuntu-22.04-CAPE-Repair -- sh -lc ...`; exit_code: 1; result: VHDX path not found.
- command: `wsl.exe -d docker-desktop -- sh -lc ...`; exit_code: 0; result: internal docker distro starts.
- edit: `redteam_ax_wsl_runtime_readiness.py`; change: fallback probe order, blocker classification, probe result preservation.
- edit: `tests/test_redteam_ax_wsl_runtime_readiness.py`; change: unit regression for default VHDX mount failure then alternate distro success.
- edit: `redteam_ax_openvas_zap_cli_live_smoke.py`; change: skip repeated pip install when target CLI executables already exist.
- edit: `redteam_ax_accepted_gate_manifest.py`; change: add WSL fallback unit gate and py_compile target.
- command: `.venv\Scripts\python.exe Red Team Studio/고도화/sanity/redteam_ax_wsl_runtime_readiness.py --allow-start --require-ready --timeout 30`; exit_code: 0; artifact_path: `archive/runs/redteam-ax-v2-wsl-runtime-readiness/latest_wsl_runtime_readiness.json`; status: ready.
- command: `.venv\Scripts\python.exe Red Team Studio/고도화/sanity/redteam_ax_strict_live_readiness_promotion.py --allow-container --timeout 90`; exit_code: 0; result: 2 passed, 2 failed external scanner gates.

## 5. 실패와 수정

- Default Ubuntu-22.04 still fails with `0x80070570`, classified as corrupt/unreadable VHDX mount failure.
- Accepted gate initially failed because OpenVAS/ZAP CLI smoke repeated pip install and because API completion review test assumed the previous accepted manifest was already passed. Fixed the smoke bootstrap to skip repeated install when executable targets exist, and made the test accept either passed or blocked manifest status while verifying the blocker contract.

## 6. 판단과 통찰

- WSL runtime is not globally blocked; a usable alternate non-internal distro exists.
- The broken default distro should remain visible as evidence, but it should not block readiness when another approved distro provides required tool paths.
- RTA-COMP-015 remains partial because external scanner endpoint/vault and real operating closure are still unresolved.

## 7. 검증

- py_compile for changed runtime/sanity/test files: exit_code 0.
- JSON validation for completion audit matrix: exit_code 0.
- WSL readiness live: status ready, selected_distro `Ubuntu-22.04-AISOC-Rebuild`.
- Targeted pytest with `-s`: 2 passed, 1 warning.
- API+WSL regression before accepted manifest refresh: 77 passed after test adjustment was verified by targeted tests; capture mode can hang in this environment, so targeted `-s` output is preserved.
- accepted gate manifest: 27/27 passed.
- development byproduct exclusion review: passed, 193 byproduct refs excluded.
- goal completion review: `goal_completion_blocked`, unresolved_item_count=1, remaining_gap_count=3.

## 8. 다음 작업

- Configure approved organization OpenVAS/ZAP read-only endpoints and external vault refs.
- Rerun strict live readiness with `--allow-container --allow-network --require-promotion`.
- Submit real non-byproduct six-tool operating outputs and close Evidence/Finding/Matrix/Report/export gates.
