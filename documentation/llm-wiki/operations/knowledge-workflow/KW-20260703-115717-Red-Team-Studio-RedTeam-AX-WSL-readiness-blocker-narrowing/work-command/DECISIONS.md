---
type: work_command_record
task_id: KW-20260703-115717-Red-Team-Studio-RedTeam-AX-WSL-readiness-blocker-narrowing
project: Red Team Studio
task: RedTeam AX WSL readiness blocker narrowing
created: 2026-07-03T11:57:17+09:00
source_package: K:/wiki/work command
---

# DECISIONS

## Ledger

| id | decision | alternatives | reason | impact |
|---|---|---|---|---|
| WSL-001 | Probe alternate non-internal distros when no distro is explicitly requested | Fail immediately on the default distro | Default `Ubuntu-22.04` can be broken while another distro is usable | WSL readiness can pass without hiding the failed default probe |
| WSL-002 | Push `docker-desktop` to the end of fallback order | Select any running distro first | `docker-desktop` is an internal support distro, not the preferred operator runtime | Prevents accidental readiness proof from relying on Docker internals |
| WSL-003 | Preserve all failed probe evidence and blocker classifications | Record only selected distro | Audit needs to explain why default failed and why fallback was valid | Completion audit can distinguish repaired blocker from unresolved default VHDX repair |
| WSL-004 | Keep goal incomplete after WSL readiness passes | Mark goal complete after accepted gates pass | Accepted gates are sanity gates, not real operating closure | Avoids unsupported completion claim |

## Entries

The main decision is that runtime readiness is satisfied by a usable alternate non-internal WSL distro, provided the artifact preserves failed default distro evidence. This changes the blocker classification from "WSL unavailable" to "default distro broken; alternate ready".
