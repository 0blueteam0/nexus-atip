# Phase 1 Removed Features -> Migration Map

All features removed from Claude context are migrated to external systems.
Backup: `command-center/backup-pre-F/`

## CLAUDE.md Removed Features

| Removed Feature | Was | Now Handled By | Status |
|----------------|-----|----------------|--------|
| xAI 7-step process | Context rule | Observer complexity-detector -> auto Plan Mode trigger | Migrated |
| xAI tags ([work],[purpose]...) | Context rule | Kept in minimal CLAUDE.md (2 lines) | Retained |
| RIPER+ workflow (6 phases) | Context rule (218 lines) | Observer state-machine.js (agent states) | Migrated |
| Auto Plan Mode | Context rule + ATOS | Observer complexity-detector.js + HTTP hint | Migrated |
| FIC Compaction | Context rule | Not needed (context now 1.4K tokens) | Deprecated |
| STL Self-Trigger | Context rule + ATOS | Observer transcript-watcher.js (pattern detect) | Migrated |
| ATOS system | Context rule + hooks | Observer autonomous-router.js (full replacement) | Migrated |
| Bottom-up paradigm | Context rule | Evolution Agent (.claude/agents/evolution-agent.md) | Migrated |
| Docker workflow | Context rule + hook | Observer can check Docker via /health endpoint | TODO |
| Update workflow | Context rule | Evolution Agent overnight scan | Migrated |
| Workspace structure | Context rule (103 lines) | Not needed (single workspace) | Deprecated |
| Command registry | Context rule | Observer routing + NEXUS Gateway discovery | Migrated |
| Display settings (2560x1330) | Context rule | Pixel Agent Desk config | TODO |
| MCP inventory (38 servers) | Context rule (large) | NEXUS Gateway nexus_catalog (on-demand) | Migrated |
| SuperClaude framework | Context rule | Deprecated (not actively used) | Deprecated |
| Tiered code review | Context rule | Review Agent (.claude/agents/review-agent.md) | Migrated |
| Plan protection | Context rule + hooks | Observer DB sessions/tasks tables | Migrated |
| Design anti-homogenization | Context rule (292 lines) | On-demand skill (can be auto-generated) | TODO |
| New features v2 (471 lines) | Context rule | Not needed as context (Claude knows its features) | Deprecated |
| Agentic learning | Context rule | Evolution Agent periodic improvement | Migrated |

## Hooks Removed (27 hooks)

| Removed Hook | Trigger | Now Handled By | Status |
|-------------|---------|----------------|--------|
| startup-orchestrator | session-start | Observer auto-start (start.bat) | TODO |
| session-start (unified-task) | session-start | Observer /session/start endpoint | Migrated |
| atos-init | session-start | Observer auto-init on startup | Migrated |
| nexus-init | session-start | NEXUS Gateway MCP (always connected) | Migrated |
| planning-restore | session-start | Observer DB sessions table | Migrated |
| planning-workflow-start | session-start | Observer state-machine.js | Migrated |
| hub-sync | session-start | Observer DB (single source of truth) | Migrated |
| atos-recommend | before-response | Observer autonomous-router.js (proactive hints) | Migrated |
| atos-track | after-tool-call | observer-tool-track hook (POST /tool) | Migrated |
| atos-learn | session-end | Observer self-learning-engine (Bayesian) | Migrated |
| nexus-learn | session-end | Observer evolution_log table | Migrated |
| bidirectional-sync | task-complete | Observer DB (unified store) | Migrated |
| self-trigger | before-response | Observer transcript-watcher.js | Migrated |
| context-detection | various | Observer autonomous-router.js | Migrated |
| important-detection | keywords | Observer pattern_candidates table | Migrated |
| periodic-save | 1h interval | /loop 30m + Observer DB | Migrated |
| session-end (unified-task) | session-end | observer-session-end hook | Migrated |
| planning-persist | session-end | Observer DB auto-persist | Migrated |
| planning-workflow-end | session-end | Observer /session/end | Migrated |
| auto-cleanup | session-end | Evolution Agent (stale cleanup) | Migrated |
| date-validation | file-save | Not critical (removed) | Deprecated |
| design-lint | PostToolResult | On-demand skill (design review) | TODO |
| dashboard-tool-track | after-tool-call | observer-tool-track replaces this | Migrated |
| dashboard-agent-start | agent-spawn | Observer transcript-watcher (agent_spawn detect) | Migrated |
| dashboard-agent-complete | agent-complete | Observer transcript-watcher (agent_complete detect) | Migrated |
| dashboard-prompt-record | after-response | Observer event recording | Migrated |
| lifecycle-sync | plan-complete | Observer DB + Mission Control | Migrated |
| nexus-subagent-track | SubagentStart | Observer transcript-watcher | Migrated |
| nexus-task-complete | TaskCompleted | Observer DB tasks table | Migrated |
| nexus-teammate-idle | TeammateIdle | Team Coordinator (to be implemented) | TODO |

## Rules Removed (17 files)

| Removed Rule | Lines | Now Handled By | Status |
|-------------|-------|----------------|--------|
| auto-plan-mode.md | 164 | Observer complexity-detector.js | Migrated |
| design-anti-homogenization.md | 292 | On-demand skill (TODO) | TODO |
| development-workflow.md | 218 | Observer state-machine.js | Migrated |
| memory-system.md | 73 | Observer DB + Auto Memory | Migrated |
| new-features-v2.md | 471 | Not needed (Claude knows features) | Deprecated |
| planning-context.md | 42 | Observer DB sessions | Migrated |
| plan-protection.md | 137 | Observer DB + git backup | Migrated |
| tiered-review.md | 132 | review-agent.md | Migrated |
| tool-priority.md | 103 | Minimal in CLAUDE.md (10 lines) | Retained |
| workspace-structure.md | 103 | Not needed (single workspace) | Deprecated |
| archive/agentic-learning.md | 57 | Evolution Agent | Migrated |
| archive/bottom-up-paradigm.md | 85 | Evolution Agent | Migrated |
| archive/docker-workflow.md | 73 | Observer health check | TODO |
| archive/update-workflow.md | 83 | Evolution Agent overnight | Migrated |
| deprecated/atos-system.md | 34 | Observer (full replacement) | Migrated |
| deprecated/fic-compaction.md | 42 | Not needed (small context now) | Deprecated |
| deprecated/self-trigger.md | 52 | Observer transcript-watcher | Migrated |

## TODO Items (5 remaining)

1. **Docker health check**: Observer should check Docker status on session start
2. **Display settings**: Configure in Pixel Agent Desk (2560x1330)
3. **Design anti-homogenization**: Create as on-demand auto skill
4. **Design lint**: Create as on-demand auto skill
5. **TeammateIdle handling**: Implement in Team Coordinator
