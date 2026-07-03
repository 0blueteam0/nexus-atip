---
type: work_command_record
task_id: KW-20260703-115717-Red-Team-Studio-RedTeam-AX-WSL-readiness-blocker-narrowing
project: Red Team Studio
task: RedTeam AX WSL readiness blocker narrowing
created: 2026-07-03T11:57:17+09:00
source_package: K:/wiki/work command
---

# TOOLING

## Tool Need

Prove whether WSL readiness is genuinely blocked or only blocked by the broken default distro, then preserve evidence for the RedTeam AX completion audit.

## Candidates

| candidate | type | benefit | risk | decision |
|---|---|---|---|---|
| `wsl.exe` | local runtime CLI | Directly validates distro startup and installed tool paths | Host-specific and can expose broken local distros | selected for live probe |
| `redteam_ax_wsl_runtime_readiness.py` | project sanity script | Produces canonical readiness artifact | Needed fallback logic update | selected and modified |
| pytest | regression test runner | Proves fallback behavior deterministically | Full capture mode can hang in this environment | selected with targeted `-s` where needed |
| accepted gate manifest | project quality gate | Confirms slice is wired into accepted gates | Can be slow due broad subprocess set | selected |

## Build vs Adopt

Adopted existing project sanity scripts and tests. Built only the missing fallback selection/classification behavior and one focused unit regression.

## Selected Tool

Primary selected tools were the existing Python readiness script, WSL CLI live probes, and accepted gate manifest.

## Verification

- Live WSL readiness: exit 0, `status=ready`.
- Targeted pytest: 2 passed.
- Accepted gate manifest: 27/27 passed.
