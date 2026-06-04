---
type: operating_guide
status: active
project: genai
created: 2026-05-01T14:23:11+09:00
updated: 2026-05-01T14:23:11+09:00
---

# Cross-LLM Handoff System

This directory is the shared handoff surface for Claude Code, Codex, Gemini, and future provider adapters.

## Two Records Are Required

Every non-trivial change must leave two kinds of handoff evidence.

1. Provider session handoff

```powershell
node systems/provider-handoff.js write
```

This captures active task state, queue, ADR state, source health, provider recommendation, and recent system handoff summaries.

2. System artifact handoff

```powershell
.\handoff.ps1 "System name" "What changed"
```

This captures what was built or changed, where it lives, what document the next LLM must read, and how it was verified.

The wrapper prompts for paths, docs, verification, next actions, risks, and decisions. For non-interactive use:

```powershell
.\handoff.ps1 "System name" "What changed" -Path "changed/path" -Doc "doc/to/read.md" -Test "command -> exit_code 0" -Next "Next action" -NoPrompt
```

The underlying Node command still exists for automation:

```powershell
node systems/llm-system-handoff.js write --from codex --to claude --title "System name" --summary "What changed" --path "changed/path" --doc "doc/to/read.md" --test "command -> exit_code 0" --next "Next action"
```

## When To Create A System Handoff

Create one when a provider changes any of these:

- new tool, script, launcher, adapter, MCP server, skill, hook, or workflow
- user-facing operations console or remote-control path
- provider routing, Claude/Codex/Gemini compatibility, or model policy
- document standard, ADR, runbook, handoff, or knowledge workflow
- test/build/release pipeline
- security or token handling policy

For tiny typo-only edits, the knowledge workflow session can be enough.

## Required Fields

Each system handoff should answer:

- who made the change and who should read it next
- date and status
- changed paths
- documents to read first
- decisions made
- validation commands and exit codes
- remaining risks
- next actions

## Latest Pointers

- `latest-from-codex-to-claude.md`: latest provider task-state handoff from Codex to Claude.
- `latest-from-claude-to-codex.md`: latest provider task-state handoff from Claude to Codex.
- `latest-system-from-codex-to-claude.md`: latest system artifact handoff from Codex to Claude.
- `handoff-index.json`: provider task-state handoff index.
- `system-handoff-index.json`: system artifact handoff index.

## Continuation Bundles

Use continuation bundles when a task has a detailed future-work queue that should survive provider switches and context compaction.

- [Evidence-First Ops Continuation Bundle - 2026-05-15](EVIDENCE_FIRST_OPS_CONTINUATION_BUNDLE_2026-05-15.ko.md): current status, verification, file map, and EFOPS-NEXT follow-up queue for `scripts/evidence_first_ops.py`.

## Read Order For A New LLM Session

1. Read this README.
2. Read the latest provider handoff for the opposite provider.
3. Read the latest system handoff for the opposite provider.
4. Read any referenced ADR, README, or setup guide before editing.
5. Continue from documented next actions, not from assumed transcript memory.
