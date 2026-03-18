# Observer Operations Runbook

## Quick Checks
```bash
# Health
curl -s http://localhost:3847/health
# Alerts
curl -s http://localhost:3847/alerts
# Scheduler
curl -s http://localhost:3847/scheduler/status
# Metrics
curl -s http://localhost:3847/metrics
```

---

## Incident: Observer Not Running
**Symptoms**: Hook errors, /health unreachable
```bash
# Check port
netstat -ano | grep ":3847"
# Start Observer
bash K:/PortableApps/genai/start-scripts/ensure-observer.sh
# Or manual start
cd K:/PortableApps/genai/command-center/server
"K:/PortableApps/tools/nodejs/node.exe" index.js
```

## Incident: Scheduler Lease Lost
**Symptoms**: `alert.raised` with id `lease_lost`, no tier runs executing
```bash
# Check lease
curl -s http://localhost:3847/scheduler/status | jq .hasLease
# If false, Observer restart acquires new lease automatically
# Force restart if needed
PID=$(netstat -ano | grep ":3847" | grep LISTENING | awk '{print $5}' | head -1)
taskkill //PID $PID //F
sleep 2
bash K:/PortableApps/genai/start-scripts/ensure-observer.sh
```

## Incident: Scheduler Consecutive Failures
**Symptoms**: `alert.raised` with id `scheduler_failures`
```bash
# Check which schedule is failing
curl -s "http://localhost:3847/scheduler/runs?status=failed&limit=5"
# Common cause: SQL syntax error in a tier handler
# Fix: check server logs or restart with --verbose
cd K:/PortableApps/genai/command-center/server
"K:/PortableApps/tools/nodejs/node.exe" index.js --verbose
```

## Incident: Queue Backlog
**Symptoms**: `alert.raised` with id `queue_backlog`, many pending commands
```bash
# Check queue
curl -s "http://localhost:3847/control/queue?status=pending"
# Manual tick to process
curl -s -X POST http://localhost:3847/scheduler/tick
# Cancel stale commands
curl -s -X POST http://localhost:3847/control/command/{ID}/cancel \
  -H "Content-Type: application/json" -d '{"reason":"manual cleanup"}'
```

## Incident: Memory Sync Failures
**Symptoms**: `alert.raised` with id `memory_sync_failures`
```bash
# Check sync status
curl -s http://localhost:3847/memory/status
# Manual sync
curl -s -X POST http://localhost:3847/memory/sync -H "Content-Type: application/json" -d '{}'
# Check memory directory exists
ls K:/PortableApps/genai/projects/K--PortableApps-genai/memory/
```

## Incident: Claude Bridge Task Stuck
**Symptoms**: Task in `running` state for > 10 minutes
```bash
# Check tasks
curl -s "http://localhost:3847/claude/tasks?status=running"
# Cancel stuck task
curl -s -X POST http://localhost:3847/claude/tasks/{TASK_ID}/cancel \
  -H "Content-Type: application/json" -d '{"reason":"stuck"}'
# Check Windows processes
tasklist | grep node
```

## Incident: Evolution Auto-Apply Blocked
**Symptoms**: Health guard blocking, evolution_apply_failures alert
```bash
# Check guard stats
curl -s http://localhost:3847/autonomy/stats
# Check recent failures
curl -s http://localhost:3847/evolution/history
# Recommendations still proposed but not applied
curl -s "http://localhost:3847/evolution/recommendations?status=proposed"
# Manual approve + apply if safe
curl -s -X POST http://localhost:3847/evolution/recommendations/{ID}/approve \
  -H "Content-Type: application/json" -d '{"approver":"operator"}'
curl -s -X POST http://localhost:3847/evolution/recommendations/{ID}/apply \
  -H "Content-Type: application/json" -d '{"actor":"operator"}'
```

## Incident: Obsidian Sync Issues
```bash
# Check vault exists
ls K:/Obsidian/
# Check bridge status
curl -s http://localhost:3847/obsidian/status
# Manual sync
curl -s -X POST http://localhost:3847/obsidian/sync -H "Content-Type: application/json" -d '{}'
```

---

## Database Maintenance
```bash
# Check DB size
ls -la K:/PortableApps/genai/command-center/data/observer.db*
# Cleanup old data (Tier4 does this automatically)
curl -s -X POST http://localhost:3847/scheduler/run/sched-tier4_lock_cleanup
# Manual WAL checkpoint
sqlite3 K:/PortableApps/genai/command-center/data/observer.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

## Full Test Suite
```bash
"K:/PortableApps/tools/nodejs/node.exe" --test K:/PortableApps/genai/command-center/server/__tests__/integration.test.js
```
