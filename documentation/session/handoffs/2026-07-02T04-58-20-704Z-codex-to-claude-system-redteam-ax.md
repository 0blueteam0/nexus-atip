---
type: llm_system_handoff
id: 2026-07-02T04-58-20-704Z-codex-to-claude-system-redteam-ax
status: completed
from: codex
to: claude
created_at: 2026-07-02T04:58:20.704Z
title: "RedTeam AX"
---

# codex -> claude System Handoff: RedTeam AX

## Summary

Codex added OpenVAS/ZAP credential vault contract. New v2 APIs expose credential policies and external-vault-reference authorizations; secret material is denied, scopes must be read-only, red_team_lead/control_team actor binding is enforced, and RedTeam2 has a Korean read-only credential panel. RTA-COMP-014 is proved; remaining gaps are scanner/container live smokes and accepted gate manifest.

## Artifact Paths

- none

## Documents To Read

- none

## Decisions

- none

## Verification

- none

## Risks And Limits

- none

## Next Actions

- none

## Git Context

- branch: main
- hash: 873482ee

## Receiver Resume Prompt

```text
claude should continue from this system handoff.
Created by: codex
System: RedTeam AX
Summary: Codex added OpenVAS/ZAP credential vault contract. New v2 APIs expose credential policies and external-vault-reference authorizations; secret material is denied, scopes must be read-only, red_team_lead/control_team actor binding is enforced, and RedTeam2 has a Korean read-only credential panel. RTA-COMP-014 is proved; remaining gaps are scanner/container live smokes and accepted gate manifest.
Read these paths first:
Then check the next actions and verification section before editing.
```
