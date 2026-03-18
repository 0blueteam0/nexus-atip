# CLAUDE.md - K Drive Project (F Architecture)

## [KR] Korean Display Protocol
- All explanations in Korean, code in English
- Tool calls: [work], [purpose] before / [done], [impact] after

## [*] ASCII Only
- No emojis. Use: [+] success, [-] fail, [*] progress, [!] warning

## [BAT] Batch File Rules
```batch
@echo off
chcp 65001 >nul 2>&1
:: English comments only
```

## [ENV] Portable Paths
- Windows: K:\PortableApps\genai
- Node.js: K:\PortableApps\tools\nodejs\node.exe
- Python: K:\PortableApps\tools\python-portable\python.exe

## [TOOL] Tool Priority
| P | Tool | Use |
|---|------|-----|
| 1 | Desktop Commander | All file ops (read/write/edit/search) |
| 2 | Edit File Lines | Precise line editing (DC fallback) |
| 3 | Shrimp Task Manager | Task management (never TodoWrite) |
| 4 | Built-in (Read/Write/Edit) | Last resort only |

## [OBS] Swarm Commander (Observer)
- Server: http://localhost:3847 (auto-start)
- WebSocket: ws://localhost:3847/ws
- Routing: POST /route (autonomous 3-Tier intent routing)
- Learning: Bayesian weight adjustment per tool/intent

## [AGENT] Agent Teams (.claude/agents/)
| Agent | Role | Isolation |
|-------|------|-----------|
| code-agent | Code writing/refactoring | worktree |
| research-agent | Web/doc research | independent context |
| review-agent | Security/quality review | background |
| routing-agent | Observer hint receiver | local |
| skill-factory-agent | Auto skill generation | worktree |
| evolution-agent | Self-improvement | worktree |

## [MCP] NEXUS Gateway
- 40 MCP servers via 8 meta-tools (nexus-gateway)
- Direct: desktop-commander, edit-file-lines, shrimp-task, sequential-thinking
- Discover: `nexus_discover(query="keyword")`
- Route: `nexus_smart_route(task="description")`

## [WORKFLOW] Always-On Protocol (see .claude/rules/workflow-protocol.md)
- EVERY task: POST /route first -> get tool/agent recommendations
- EVERY plan: include Execution Map (step/agent/tool/validation)
- EVERY multi-step: track via Observer /control/command or /decompose/plan
- EVERY completion: POST /obsidian/push + sync

## [3LLM] Triple-LLM Collaboration (strengths, NOT rigid roles)
| LLM | Call | Known Strengths (but not limits) |
|-----|------|----------------------------------|
| Claude Opus 4.6 | Direct | Implementation, tools, long context |
| Codex GPT-5.3 | mcp__codex__codex | Code review, bug detection, architecture |
| Gemini 3 Flash | mcp__pal__clink(gemini) | Research, planning, multi-source analysis |

Any LLM can contribute to ANY area. Best argument wins, not role assignment.
- **2-LLM**: routine tasks. **3-LLM**: complex/ambiguous. **4-LLM (Council)**: critical policy.

## [SKILL] Skills
- skill-creator: `.claude/skills/skill-creator/` (Anthropic official)
- evolution-package: `.claude/skills/evolution-package/` (진화 패키지)
- observer-ops: `.claude/skills/observer-ops/` (Observer 운영)
- evolution-governor: `.claude/skills/evolution-governor/` (진화 안전)
- Auto-generated: `.claude/skills/auto/` (Skill Factory)
