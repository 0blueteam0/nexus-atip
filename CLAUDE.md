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
- Python: K:\PortableApps\tools\python\python.exe

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

## [SKILL] Skills
- skill-creator: `.claude/skills/skill-creator/` (Anthropic official)
- Auto-generated: `.claude/skills/auto/` (Skill Factory)
