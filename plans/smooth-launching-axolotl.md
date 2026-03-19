# Plan: Incerto Antifragile + Code Mode + CA-MCP Integration

## Context
Two shared conversations revealed key evolution opportunities:
1. **Taleb's Incerto** -> 10 AGI design principles (antifragile, no-op, irreversibility, trust scores, barbell)
2. **MCP Bottleneck Analysis** -> Code Mode (97% token reduction), CA-MCP distributed orchestration

`antifragile.js` is already written but NOT connected. NEXUS Gateway exists but loads all tool schemas. Task Decomposer exists but doesn't scope tool context per subtask.

## Implementation (3 workstreams, 8 steps)

### Workstream A: Antifragile Integration (Steps 1-3)

**Step 1: Wire antifragile into index.js**
- File: `command-center/server/index.js`
- Create `AntifragileEngine` instance, pass to modules that need it
- Add 4 API endpoints: `GET /antifragile/status`, `GET /antifragile/trust/:tool`, `POST /antifragile/assess`, `GET /antifragile/failures`
- Agent: direct (Claude)
- Validation: `curl /antifragile/status`

**Step 2: Connect antifragile to control-plane + event-collector**
- Files: `control-plane.js`, `event-collector.js`
- control-plane: call `antifragile.scoreIrreversibility()` before execute, gate on result
- event-collector `/hook`: use `antifragile.evaluateNoOp()` for iatrogenics check, `recordFailure()` on PostToolUseFailure
- Validation: test destructive command -> graduated scoring (not just binary)

**Step 3: Connect antifragile to router + learning engine**
- Files: `autonomous-router.js`, `self-learning-engine.js`
- router: `antifragile.applyBarbell()` on tool candidates before returning
- learning: call `antifragile.recordFailure()` alongside existing learn(), update trust scores
- Validation: `POST /route` returns barbell-influenced recommendations

### Workstream B: NEXUS Code Mode (Steps 4-5)

**Step 4: Add Code Mode endpoints to Observer**
- File: `command-center/server/index.js` (new endpoints)
- Create lightweight proxy: `POST /code-mode/search` -> queries NEXUS `nexus_discover` + filters
- Create: `POST /code-mode/execute` -> calls `nexus_call` with specific tool
- No new module needed - thin wrapper over existing NEXUS gateway
- Validation: `POST /code-mode/search {"query":"file"}` returns relevant tools

**Step 5: Router uses Code Mode for JIT discovery**
- File: `autonomous-router.js`
- For intents with low confidence: call Code Mode search instead of static DEFAULT_TOOLS
- Feature flag: `ENABLE_CODE_MODE_ROUTING`
- Validation: route with unknown intent uses dynamic discovery

### Workstream C: CA-MCP Distributed Dispatch (Steps 6-7)

**Step 6: Scoped tool context in Task Decomposer**
- File: `task-decomposer.js`
- When creating subtasks, run Code Mode search per subtask to determine `tool_scope`
- Store tool_scope in `decomposition_runs.tool_scope_json`
- Bridge dispatch includes `--allowedTools` from scope

**Step 7: Bridge scoped execution**
- File: `claude-remote-bridge.js`
- When dispatching, pass `allowedTools` from subtask's tool_scope
- This limits each sub-agent's context to only relevant tools (CA-MCP pattern)
- Validation: dispatched subtask has scoped tool list, not all 500 tools

### Step 8: Integration tests + Obsidian report
- File: `__tests__/integration.test.js`
- Add tests for antifragile, code-mode, scoped dispatch
- Push evolution report to Obsidian

## Files to Modify
1. `command-center/server/index.js` - wire antifragile + code-mode endpoints
2. `command-center/server/control-plane.js` - irreversibility gate
3. `command-center/server/event-collector.js` - failure recording + no-op
4. `command-center/server/autonomous-router.js` - barbell + code-mode JIT
5. `command-center/server/self-learning-engine.js` - trust score updates
6. `command-center/server/task-decomposer.js` - scoped tool context
7. `command-center/server/claude-remote-bridge.js` - scoped allowedTools
8. `command-center/server/__tests__/integration.test.js` - new tests

## Files Already Existing (reuse)
- `command-center/server/antifragile.js` - complete, just needs wiring
- `command-center/server/db.js` - no new tables needed (antifragile uses events table)
- `nexus/gateway/mcp-gateway/` - already has nexus_discover + nexus_call

## Feature Flags
- `ENABLE_ANTIFRAGILE_GATE=1` (default OFF initially)
- `ENABLE_CODE_MODE_ROUTING=1` (default OFF initially)
- `ENABLE_SCOPED_DISPATCH=1` (default OFF initially)

## Verification
1. `node --test __tests__/integration.test.js` - all pass
2. `curl /antifragile/status` - shows principles active
3. `curl /antifragile/trust/desktop-commander` - returns trust score
4. `POST /code-mode/search {"query":"file editing"}` - returns tools
5. `POST /route {"task":"..."}` - shows barbell strategy applied
6. Observer health OK, alerts 0
7. Obsidian report published

## Codex Review Summary
Codex agreed on 4 integration points for antifragile, Code Mode search+execute pattern, and scoped dispatch. Implementation order: safety first (antifragile), then efficiency (code-mode), then distribution (CA-MCP).
