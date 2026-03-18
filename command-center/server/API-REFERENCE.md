# Observer Server API Reference

## Base URL: http://localhost:3847
## WebSocket: ws://localhost:3847/ws
## Version: 2.0.0-F (69 endpoints, 29 tables)

---

## Health & Status
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | - | Server health check |
| GET | / | - | Server info + endpoint list |
| GET | /metrics | read | Prometheus-compatible metrics |
| GET | /state | - | Current agent states |

## Routing (Autonomous Router)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /route | - | Analyze task intent -> routing recommendation |
| POST | /route/outcome | - | Record tool outcome for learning |
| GET | /route/hint | - | Get proactive routing hint |
| GET | /route/weights | - | Get Bayesian weights for intent |

## Learning
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /learning/stats | - | Learning engine statistics |
| GET | /learning/trend | - | Performance trend for a tool |
| GET | /learning/best | - | Best tools for intent (epsilon-greedy) |

## Team Coordinator
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /team/lock | - | Acquire file lock |
| POST | /team/release | - | Release file lock |
| GET | /team/status | - | Team status overview |
| POST | /team/conflicts | - | Detect file conflicts |
| POST | /team/task | - | Enqueue team task |
| POST | /team/task/next | - | Assign next pending task |

## Control Plane
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /control/command | write | Enqueue a command |
| GET | /control/queue | read | View command queue |
| POST | /control/command/:id/ack | write | Mark command completed |
| POST | /control/command/:id/fail | write | Mark command failed |
| POST | /control/command/:id/cancel | write | Cancel command |
| GET | /control/stats | read | Queue statistics |

## Scheduler
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /schedules | - | List all schedules |
| POST | /schedules | write | Register custom schedule |
| PATCH | /schedules/:id | write | Update schedule |
| GET | /scheduler/runs | - | Run history |
| POST | /scheduler/tick | write | Manual tick |
| POST | /scheduler/run/:id | write | Force run schedule |
| GET | /scheduler/status | - | Scheduler status |

## Evolution Agent
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /evolution/propose | write | Run proposal cycle |
| GET | /evolution/recommendations | - | List recommendations |
| POST | /evolution/recommendations/:id/approve | write | Approve |
| POST | /evolution/recommendations/:id/reject | write | Reject |
| POST | /evolution/recommendations/:id/apply | write | Apply with snapshot |
| POST | /evolution/recommendations/:id/rollback | write | Rollback applied |
| GET | /evolution/history | - | Apply/rollback history |

## Memory Sync
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /memory/sync | write | Trigger incremental sync |
| GET | /memory/status | - | Sync status + checkpoint |
| GET | /memory/documents | - | List synced documents |
| GET | /memory/sync/runs | - | Sync run history |

## Claude Remote Bridge
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /claude/sessions | read | List Claude sessions |
| POST | /claude/dispatch | write | Dispatch task to Claude |
| GET | /claude/tasks | read | List Claude tasks |
| POST | /claude/tasks/:id/cancel | write | Cancel Claude task |
| GET | /claude/stats | read | Bridge statistics |

## Skill Factory
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /skills/factory/cycle | write | Run full pipeline |
| GET | /skills/factory/list | read | List generated skills |
| POST | /skills/factory/:id/deploy | write | Deploy staged skill |
| POST | /skills/factory/:id/retire | write | Retire active skill |

## Task Decomposer
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /decompose/plan | write | Create decomposition plan |
| POST | /decompose/plan/:id/execute | write | Execute plan |
| GET | /decompose/plans | read | List plans |
| GET | /decompose/plan/:id/runs | read | Plan run details |

## Autonomy Guard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /autonomy/audit | read | Audit trail |
| GET | /autonomy/limits | read | Current blast-radius limits |
| GET | /autonomy/stats | read | Guard statistics |

## Alerts
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /alerts | read | Active alerts |
| GET | /alerts/rules | read | Alert rules |
| POST | /alerts/test/:ruleId | write | Test specific rule |

## Events & Hooks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /event | - | Receive hook event |
| POST | /session/start | - | Session lifecycle |
| POST | /session/end | - | Session lifecycle |
| POST | /analyze | - | Complexity analysis |
| POST | /tool | - | Tool usage tracking |
| GET | /stats/tools | - | Tool statistics |
| GET | /stats/events | - | Event history |
| GET | /stats/agents | - | Agent states |
| GET | /stats/swarm | - | Swarm statistics |
| GET | /skills/candidates | - | Skill candidates from patterns |

---

## Auth Model
- **No token**: All endpoints accessible (dev mode)
- **OBSERVER_READ_TOKEN**: Required for read endpoints in prod
- **OBSERVER_WRITE_TOKEN**: Required for write endpoints in prod
- **OBSERVER_ENV=prod**: Enforces token requirement

## WebSocket Events
Connect to `ws://localhost:3847/ws` for real-time events:
- `state_change`, `agent_spawn`, `routing_hint`
- `control.command.*`, `scheduler.*`, `evolution.*`
- `claude.task.*`, `alert.raised`, `alert.cleared`
- `memory.sync.complete`, `skill_factory.*`
