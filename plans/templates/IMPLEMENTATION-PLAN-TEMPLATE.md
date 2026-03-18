# Implementation Plan: [TITLE]

## Goal
[1-2 sentences]

## Observer Route Analysis
```bash
curl -s -X POST http://localhost:3847/route -H "Content-Type: application/json" -d '{"task":"[GOAL]"}'
```
Result: intent=[], tools=[], agents=[]

## Execution Map (REQUIRED)

| Step | What | Agent | Tool/MCP | Skill/Command | Validation | Rollback |
|------|------|-------|----------|---------------|------------|----------|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |

## External Tools Needed
- [ ] Already installed: [list]
- [ ] Need to install: [list]
- [ ] Need to search: GitHub/HuggingFace for [topic]

## Codex Review
- [ ] Sent to Codex for independent design
- [ ] Compared both designs
- [ ] Merged best approach

## Task Decomposition
```bash
curl -s -X POST http://localhost:3847/decompose/plan -H "Content-Type: application/json" -d '{
  "description": "[GOAL]",
  "subtasks": [
    {"description": "step 1", "agentType": "..."},
    {"description": "step 2", "dependsOn": [0]}
  ]
}'
```

## Success Criteria
- [ ] Tests pass
- [ ] Observer health OK
- [ ] Obsidian report published

## Documentation
- Obsidian note: _Observer/[folder]/[title].md
- Memory update: [if applicable]
