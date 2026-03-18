# Planning Log Hybrid System Implementation

## Meta
- **Plan ID**: wobbly-wandering-honey
- **Base**: compiled-crafting-whisper v3.0.0 (Log Format Optimization)
- **Version**: 1.0.0
- **Date**: 2026-02-04

---

## Overview

Markdown(Human) + JSON(Machine) hybrid logging system implementation.

### Goal
- Markdown: Readability, Git diff, context for Claude
- JSON: Automation, queries, statistics, session restore

---

## Architecture

```
planning-log/
├── daily/
│   ├── 2026-02-04.md        # [KEEP] Human-readable
│   └── 2026-02-04.json      # [NEW] Machine-parseable
├── schema.json              # [NEW] JSON schema definition
└── index.json               # [NEW] Log index (optional)
```

---

## Implementation Tasks

### Phase 1: Schema Definition
- [ ] Create `planning-log/schema.json`
- Fields: date, sessions[], actions[], status, plan, phase

**File**: `planning-log/schema.json`

### Phase 2: Log Writer Module
- [ ] Create `planning-system/log-writer.js`
  - `writeMarkdown(date, data)`
  - `writeJson(date, data)`
  - `writeBoth(date, data)`

**File**: `planning-system/log-writer.js`

### Phase 3: Hook Integration
- [ ] Update `.claude-hooks.json`
  - `planning-workflow-start`: Init JSON log
  - `planning-workflow-end`: Save JSON log

**File**: `.claude-hooks.json`

### Phase 4: Test with Today's Log
- [ ] Generate `planning-log/daily/2026-02-04.json`
- [ ] Verify sync with existing MD content

**File**: `planning-log/daily/2026-02-04.json`

---

## Files to Create/Modify

| File | Action | Risk |
|------|--------|------|
| `planning-log/schema.json` | CREATE | LOW |
| `planning-system/log-writer.js` | CREATE | LOW |
| `.claude-hooks.json` | MODIFY (add script path) | MEDIUM |
| `planning-log/daily/2026-02-04.json` | CREATE (test) | LOW |

---

## JSON Schema Design

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["date", "sessions"],
  "properties": {
    "date": { "type": "string", "format": "date" },
    "sessions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "start"],
        "properties": {
          "id": { "type": "string" },
          "start": { "type": "string", "format": "date-time" },
          "end": { "type": "string", "format": "date-time" },
          "plan": { "type": "string" },
          "phase": { "type": "string" },
          "actions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "time": { "type": "string" },
                "type": { "type": "string" },
                "target": { "type": "string" },
                "status": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## Verification Plan

1. **Schema Validation**: JSON Schema validity check
2. **Sync Test**: MD and JSON content consistency
3. **Hook Test**: Auto-logging on session start/end
4. **Query Test**: `jq` queries on JSON files

---

## Decision Points

### Q1: Index File Necessity
- **Option A**: Skip index.json (simpler, query daily files directly)
- **Option B**: Create index.json (faster lookups, cross-day queries)
- **Recommendation**: Option A for initial implementation

### Q2: Hook Trigger Timing
- **Option A**: On every action (real-time, higher overhead)
- **Option B**: On session end only (batch, lower overhead)
- **Recommendation**: Option B for initial implementation

---

## Version History
- v1.0.0 (2026-02-04): Initial plan based on compiled-crafting-whisper v3.0.0

