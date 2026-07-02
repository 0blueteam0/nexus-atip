---
type: evidence_unit
status: updated
id: KW-20260702-170524-EU-WSL-RUNTIME
project: Red Team Studio
created: 2026-07-02T17:05:24+09:00
---

# Evidence Units

## EU-001 WSL Runtime Readiness Artifact

### Claim

The current environment has WSL distributions listed, but the selected distro cannot start, so WSL is not ready as a RedTeam AX runtime lane.

### Source

- source_type: command_artifact
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-wsl-runtime-readiness/latest_wsl_runtime_readiness.json`
- command: `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_wsl_runtime_readiness.py" --allow-start`
- exit_code: 0
- collected_at: 2026-07-02

### Evidence

The artifact reports `status=blocked_wsl_distribution_start_failed`, `selected_distro=Ubuntu-22.04`, `active_scan_executed=false`, and `trusted_as_instruction=false`.

### Confidence

High for current local runtime state.

### Limits

This does not prove WSL is impossible to repair. It records the current blocker only.

## EU-002 Runtime Readiness API Projection

### Claim

`/api/redteam/v2/runtime-readiness` now returns the WSL readiness artifact beside Docker and external scanner readiness artifacts.

### Source

- source_type: test
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/tests/test_redteam_v2_api_router.py`
- command: `.venv/Scripts/python.exe -m pytest tests/test_redteam_v2_api_router.py::RedTeamV2ApiRouterTests::test_runtime_readiness_status_is_read_only_artifact_projection -q`
- exit_code: 0
- collected_at: 2026-07-02

### Evidence

The test asserts the response contains `wsl_runtime`, safe read-only flags, and artifact fields.

### Confidence

High for API contract.

### Limits

This is a read-only projection test and does not run Docker, WSL repair, or scanners.

## EU-003 Accepted Gate Manifest

### Claim

The current RedTeam AX accepted gate suite passes with the WSL runtime readiness gate included.

### Source

- source_type: accepted_gate_manifest
- path_or_url: `J:/PortableApps/genai/projects/ai-agentic-soc/archive/runs/redteam-ax-v2-accepted-gates/latest_accepted_gate_manifest.json`
- command: `.venv/Scripts/python.exe "Red Team Studio/고도화/sanity/redteam_ax_accepted_gate_manifest.py"`
- exit_code: 0
- collected_at: 2026-07-02

### Evidence

Manifest result: `accepted_gate_count=17`, `passed_gate_count=17`, `failed_gate_count=0`.

### Confidence

High for regression status.

### Limits

Accepted gates include blocker-preserving readiness checks. They do not claim Docker real container or organization endpoint success.
