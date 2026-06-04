---
type: llm_system_handoff
id: 2026-06-04T03-36-16-147Z-codex-to-claude-system-hermes-codex-launcher
status: completed
from: codex
to: claude
created_at: 2026-06-04T03:36:16.147Z
title: "Hermes Codex Launcher"
---

# codex -> claude System Handoff: Hermes Codex Launcher

## Summary

Modified hermes-codex.bat to preserve existing IDE/CLI forwarding and add browser chat startup/opening at http://127.0.0.1:9119/chat via hermes dashboard --tui. Verified --where, --help, --chat, and HTTP 200 on /chat. Native Windows embedded PTY remains a Hermes Agent limitation.

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
- hash: d0eefa6

## Receiver Resume Prompt

```text
claude should continue from this system handoff.
Created by: codex
System: Hermes Codex Launcher
Summary: Modified hermes-codex.bat to preserve existing IDE/CLI forwarding and add browser chat startup/opening at http://127.0.0.1:9119/chat via hermes dashboard --tui. Verified --where, --help, --chat, and HTTP 200 on /chat. Native Windows embedded PTY remains a Hermes Agent limitation.
Read these paths first:
Then check the next actions and verification section before editing.
```
