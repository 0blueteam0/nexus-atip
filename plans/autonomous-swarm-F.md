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

## Phase 1: Context Elimination + Foundation
- [x] Backup current files
- [ ] CLAUDE.md 85KB -> ~5KB
- [ ] Hooks 30 -> 3 (observer-notify, session-start, session-end)
- [ ] Rules 19 -> 2 (minimal + nexus-gateway)
- [ ] Agent Team definitions (6 agents)
- [ ] Observer server scaffold

## Phase 2: Observer Core + Intelligence
- [ ] transcript-watcher.js (multi-session JSONL)
- [ ] event-collector.js (HTTP Hook receiver)
- [ ] db.js (SQLite schema + seed)
- [ ] autonomous-router.js (3-Tier routing)
- [ ] self-learning-engine.js (Bayesian weights)
- [ ] team-coordinator.js (conflict prevention)
- [ ] Skill Factory core (pattern detection + auto generation)

## Phase 3: Integration + Evolution
- [ ] Pixel Agent Desk <-> Observer WebSocket
- [ ] Mission Control <-> Observer API
- [ ] /loop schedules (5-tier)
- [ ] Cron permanent schedules
- [ ] Evolution Agent (self-improvement)
- [ ] Remote Control integration
- [ ] Auto Memory + SQLite dual persistence

## Phase 4: Polish + Testing
- [ ] Routing Dashboard panel
- [ ] Skill Health panel
- [ ] End-to-end testing
- [ ] Documentation

---

## Key Decisions
- Platform: Electron (Pixel Agent Desk) + Next.js (Mission Control)
- DB: SQLite (better-sqlite3, shared with Mission Control)
- Observer: Custom Node.js (NOT pixel-agents fork - custom brain)
- Agent Teams: 6 specialized agents
- Skill Factory: Anthropic official skill-creator pattern
