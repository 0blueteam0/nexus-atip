# F: Self-Evolving Autonomous Swarm Architecture

## Status: ACTIVE
## Created: 2026-03-16

---

## Architecture Overview (7 Layers)

```
L7: Self-Evolution Loop (/loop + Cron)
L6: Skill Factory (autonomous skill generation)
L5: Command Center UI (Pixel Agent Desk + Mission Control)
L4: Swarm Commander (Custom Observer - the brain)
L3: Claude Code + Agent Teams (execution layer)
L2: Learning Store (SQLite)
L1: MCP Gateway (NEXUS - already implemented)
```

## External Projects Installed

| Project | Location | Role |
|---------|----------|------|
| Pixel Agent Desk | command-center/pixel-agent-desk/ | Electron visualization |
| Mission Control | command-center/mission-control/ | Dashboard + Pixel Office |
| Agent Monitor | command-center/agent-monitor/ | React monitoring |
| Anthropic Skills | command-center/anthropic-skills/ | Official skill-creator |

---

## Phase 1: Context Elimination + Foundation [COMPLETE]
- [x] Backup current files
- [x] CLAUDE.md 85KB -> ~5KB
- [x] Hooks 30 -> 3 (observer-notify, session-start, session-end)
- [x] Rules 19 -> 2 (minimal + nexus-gateway)
- [x] Agent Team definitions (6+ agents)
- [x] Observer server scaffold (index.js, 8 modules)
- [x] Git cleanup: 7,574 -> 8 lines, tools/ untracked, archived-F moved

## Phase 2: Observer Core + Intelligence [COMPLETE]
- [x] transcript-watcher.js (multi-session JSONL)
- [x] event-collector.js (HTTP Hook receiver)
- [x] db.js (SQLite 13 tables: 6 base + 7 learning)
- [x] autonomous-router.js (3-Tier Bayesian routing)
- [x] self-learning-engine.js (Bayesian weights, epsilon-greedy, cross-intent, decay)
- [x] team-coordinator.js (file locking, conflict detection, task queue)
- [x] index.js v2.0.0-F (integrated learning + coordinator, 10 new API endpoints)
- [x] Pattern detection in autonomous-router (chain_patterns, pattern_candidates)

## Phase 3: Backend Core + Automation [COMPLETE]
- [x] Preflight bug fixes (3 bugs: getLastTool, double weight update, observer-client contract)
- [x] Control Plane (command queue, idempotency, auth, lifecycle management)
- [x] 5-Tier Scheduler (1m/5m/30m/2h/daily, lease lock, auto-tick)
- [x] Evolution Agent (propose/approve/apply/rollback, health-guarded auto-apply)
- [x] Memory Sync (MD->SQLite, frontmatter parsing, hybrid delete detection)
- [x] Prometheus /metrics endpoint (15 metrics)
- [x] Observer Skills (observer-ops, evolution-governor)
- [x] Agent Updates (routing-agent, code-agent, review-agent -> Observer integration)
- [x] Double decay fix (Scheduler Tier2 only)
- [ ] UI wiring: Mission Control panels for control/scheduler/evolution (Phase 4)
- [ ] Security hardening: auth/CORS/WS (Phase 4)

## Phase 4: UI Integration + Security + Testing [COMPLETE]
- [x] Auth module (2-tier read/write, CORS restriction, WS token validation)
- [x] Event contract (versioned schema, 20+ canonical event types)
- [x] Alerts engine (5 rules: queue backlog, scheduler failures, lease loss, memory sync, evolution)
- [x] Observer dashboard (Mission Control /observer page: overview, queue, scheduler, evolution, memory tabs)
- [x] observer-client.ts extended (15+ new API methods for Phase 3/4 endpoints)
- [x] WorkspaceDashboard header -> Observer link
- [x] Integration test suite (23 tests, 8 suites, node:test, 302ms)
- [x] Prometheus /metrics endpoint (15 metrics)
- [ ] Pixel Agent Desk WS event overlays (deferred)
- [ ] WS auth enforcement (deferred - localhost only for now)
- [ ] Documentation/Runbooks

## Phase 5: Remote Control + Polish [IN PROGRESS]
- [x] Claude Remote Bridge (claude-remote-bridge.js)
  - child_process.spawn + stream-json output parsing
  - PID tracking, exit code, stderr tail, output size cap
  - Session registry + task lifecycle management
  - Startup reconciliation for stale tasks
  - Platform-specific cancel (Windows taskkill /T)
  - Max concurrent: 3, timeout: 10min default
- [x] Control Plane integration (dispatch_claude_task command type)
- [x] 5 new API endpoints (/claude/sessions, /dispatch, /tasks, /tasks/:id/cancel, /stats)
- [x] 2 new DB tables (claude_sessions, claude_tasks)
- [x] Integration tests: 26/26 pass
- [x] Live test: dispatch + completion verified (exit 0, 28KB output)
- [ ] Pixel Agent Desk overlays
- [ ] Full event contract adoption
- [ ] Docs/Runbooks

## Phase 5 (continued): Startup + Polish [COMPLETE]
- [x] Pixel Agent Desk WS event overlays (alert, claude-task, scheduler, evolution events -> IPC)
- [x] Observer auto-start (ensure-observer.sh + SessionStart hook)
- [x] F Architecture rules (.claude/rules/f-architecture.md)
- [x] API Reference documentation (command-center/server/API-REFERENCE.md)
- [x] Frontend packages installed (recharts, react-query, react-use-websocket)
- [x] Mission Control dashboard upgrade (real-time WS + charts - agent in progress)

## Phase 6: Self-Evolution + Autonomy [COMPLETE]
- [x] Skill Factory (skill-factory.js): pattern -> generate -> evaluate -> stage -> deploy pipeline
- [x] Task Decomposer (task-decomposer.js): DAG-based subtask decomposition + dependency ordering
- [x] Autonomy Guard (autonomy-guard.js): blast-radius limits, approval gates, audit trail
- [x] 5 new DB tables (generated_skills, skill_eval_runs, decomposition_plans, decomposition_runs, autonomy_audit)
- [x] 11 new API endpoints (/skills/factory/*, /decompose/*, /autonomy/*)
- [x] Integration tests: 34/34 pass, 264ms
- [x] Observer: 69 endpoints total, 29 DB tables

---

## Key Decisions
- Platform: Electron (Pixel Agent Desk) + Next.js (Mission Control)
- DB: SQLite (better-sqlite3, shared with Mission Control)
- Observer: Custom Node.js (NOT pixel-agents fork - custom brain)
- Agent Teams: 6 specialized agents
- Skill Factory: Anthropic official skill-creator pattern
