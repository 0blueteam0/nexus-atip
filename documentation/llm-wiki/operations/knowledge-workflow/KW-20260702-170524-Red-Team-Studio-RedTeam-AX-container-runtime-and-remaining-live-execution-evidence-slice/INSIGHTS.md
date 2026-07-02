---
type: insight
status: updated
project: Red Team Studio
created: 2026-07-02T17:05:24+09:00
---

# Insight

## 관찰

Docker Desktop daemon is unavailable, Podman is not installed, and WSL lists distributions but cannot start the selected Ubuntu distro.

## 통찰

Runtime readiness needs separate lanes for Docker/container runtime, WSL Linux runtime, and external scanner endpoints. Combining them into a single generic blocker hides the next operational repair step.

## 제안

Keep `/api/redteam/v2/runtime-readiness` as a read-only projection of artifacts. Real Docker, WSL, or scanner network execution should remain in explicit sanity scripts with `--allow-*` and `--require-*` flags.

## 적용 가능 범위

RedTeam AX runtime readiness UI, accepted gate manifest, completion audit, and future deployment readiness checks.

## 후속 작업

Repair Docker Desktop and WSL VHDX/distro state, then run the real readiness gates with strict `--require-ready` or `--require-real` flags.
