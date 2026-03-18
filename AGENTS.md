# AGENTS.md - 프로젝트 에이전트 규칙

> **목적**: 디렉토리별 맥락 인식을 통한 AI 일관성 향상
> **표준**: [AGENTS.md Guide](https://www.builder.io/blog/agents-md)
> **적용 범위**: 이 파일이 있는 디렉토리 및 모든 하위 디렉토리

---

## 프로젝트 개요

**프로젝트명**: Claude Code K드라이브 통합 환경
**유형**: AI 개발 도구 및 자동화 시스템
**언어**: JavaScript/Node.js, Python, Batch

---

## 코드 스타일

### JavaScript/TypeScript
- **들여쓰기**: 2 spaces
- **세미콜론**: 생략 (prettier 기본값)
- **따옴표**: single quotes
- **trailing comma**: ES5 호환

### Python
- **들여쓰기**: 4 spaces
- **라인 길이**: 120자
- **docstring**: Google 스타일
- **타입 힌트**: 권장 (3.9+ 문법)

### Batch/Shell
- **인코딩**: UTF-8 (chcp 65001)
- **주석**: 영어만 (한글 깨짐 방지)
- **오류 처리**: `|| exit /b 1` 패턴

---

## 파일 구조 규칙

```
K:/PortableApps/genai/
├── .claude/           # Claude Code 설정
│   ├── rules/         # 자동 로드 규칙
│   ├── skills/        # 스킬 정의
│   ├── agents/        # 에이전트 정의
│   └── commands/      # 커맨드 정의
├── documentation/     # 문서
│   ├── guides/        # 가이드
│   ├── reports/       # 보고서
│   └── analysis/      # 분석 문서
├── plans/             # 플랜 파일 (보호됨)
├── mcp-servers/       # MCP 서버 설정
└── atos/              # 자동화 시스템
```

---

## 테스트 요구사항

### 필수 테스트
- 모든 public 함수에 단위 테스트
- 핵심 워크플로우에 통합 테스트
- 최소 커버리지: 70%

### 테스트 명명
```javascript
// 패턴: should_[expected]_when_[condition]
test('should return empty array when input is null')
test('should throw error when file not found')
```

---

## 금지 사항 (Prohibited)

```
[X] console.log in production code (logger 사용)
[X] any 타입 (TypeScript)
[X] 하드코딩된 경로 (환경 변수 사용)
[X] 동기 파일 I/O (fs.readFileSync 등)
[X] 한글 변수명
```

---

## 권장 사항 (Recommended)

```
[O] async/await 패턴
[O] 에러 핸들링 (try-catch)
[O] 타입 명시 (JSDoc 또는 TypeScript)
[O] 환경 변수 분리 (.env)
[O] 의미 있는 커밋 메시지
```

---

## 디렉토리별 특수 규칙

### `.claude/skills/`
- 각 스킬은 독립 폴더로 생성
- `SKILL.md` 필수
- `memory` frontmatter 권장

### `plans/`
- **절대 덮어쓰기 금지**
- 새 플랜은 새 파일로 생성
- 완료 시 `plans/completed/`로 이동

### `mcp-servers/`
- Docker compose 파일 포함 시 `.env.example` 필수
- README.md에 설치 방법 명시

---

## AI 에이전트 행동 규칙

### 파일 작업 시
1. Desktop Commander 우선 사용
2. 30줄 이상 파일은 청크 분할
3. 기존 파일 수정 전 백업 고려

### 코드 생성 시
1. 기존 패턴 따르기
2. 불필요한 주석 생략
3. 이모지 사용 금지

### 태스크 관리 시
1. Shrimp Task Manager 사용
2. TodoWrite 사용 금지
3. 작업 완료 시 상태 업데이트

---

## NEXUS Multi-AI Orchestration

### Overview
NEXUS (Network of Evolving eXtensible Unified Services) - 자기진화형 멀티 AI 오케스트레이션 시스템.
377개 사례 기반으로 Claude Code, Gemini CLI, Codex CLI를 통합 관리.

### Architecture (7 Layers)
```
Layer 1: Architect.md (Single Source of Truth)
Layer 2: Provider Adapters (claude/gemini/codex)
Layer 3: Workflow Templates (8 YAML patterns)
Layer 4: Evolution Engine (Bayesian weights)
Layer 5: Knowledge Accumulator (cross-session)
Layer 6: Self-Evolution Loop (7-step cycle)
Layer 7: Auto-Research (every 5 sessions)
```

### Key Files
| File | Purpose |
|------|---------|
| `nexus/Architect.md` | Central config (providers, routing, evolution) |
| `nexus/core/orchestrator.js` | Main entry: init -> route -> learn |
| `nexus/core/cli.js` | CLI interface |
| `nexus/evolution/evolution-state.json` | Persisted weights and patterns |
| `nexus/knowledge/best-practices.json` | Growing best practices DB |

### Provider Roles
| Provider | Role | Context | Cost |
|----------|------|---------|------|
| Claude Code | primary_orchestrator | 200K | included |
| Gemini CLI | collaborator | 1M | free |
| Codex CLI | specialist | 128K | api_usage |

### CLI Commands
```bash
node nexus/core/cli.js init          # Initialize
node nexus/core/cli.js status        # Full status
node nexus/core/cli.js route "task"  # Route task
node nexus/core/cli.js evolve        # Evolution state
node nexus/core/cli.js workflows     # List workflows
node nexus/core/cli.js knowledge     # Knowledge stats
node nexus/core/cli.js research      # Auto-research status
node nexus/core/cli.js check         # Improvement checklist
```

### Coordination Protocol (for Codex CLI)
When receiving tasks from NEXUS:
1. Check Architect.md for your role and routing rules
2. Execute in sandboxed mode (`--approval-mode full-auto`)
3. Return structured JSON results
4. Flag issues for Claude Code review

---

## xAI Tag System (All CLIs)

Every tool call and significant action must include explanatory tags:
- **[work]**: What is being done
- **[purpose]**: Why it is being done
- **[method]**: How it is being done
- **[done]**: What was completed
- **[impact]**: What effect it has

---

## Korean Display Protocol (All CLIs)

- Provide Korean explanations alongside technical output
- Use ASCII status markers: `[+]` success, `[-]` failure, `[*]` progress, `[!]` warning, `[?]` info
- No emojis - ASCII characters only

---

## MCP Server Catalog (Shared)

The following MCP servers are available to all CLIs:

| Server | Purpose | Priority |
|--------|---------|----------|
| desktop-commander | File operations (read/write/edit/search) | P1 |
| github | GitHub API (issues, PRs, repos) | - |
| memory | Persistent key-value memory | - |
| sqlite-mcp | SQLite database operations | - |
| sequential-thinking | Deep structured reasoning | - |

Docker-dependent servers (firecrawl, searxng-crawl4ai) require Docker running.

---

## Tool Priority (All CLIs)

| Priority | Tool | Use Case |
|----------|------|----------|
| P1 | desktop-commander | All file operations (90% coverage) |
| P2 | edit-file-lines | Precise line edits (when P1 fails) |
| P3 | shrimp-task | Task management (never TodoWrite) |
| P4 | Built-in tools | Fallback only |

---

## Config Sync

Run `node nexus/sync/config-sync.js` to synchronize MCP server configs across all CLIs.
Source of truth: `.claude.json` -> `.gemini/settings.json` + `.codex/config.toml`

---

## References

- **CLAUDE.md**: Claude Code global rules
- **GEMINI.md**: Gemini CLI NEXUS context
- **CODEX.md**: Codex CLI NEXUS context
- **RIPER+ Workflow**: `.claude/rules/development-workflow.md`
- **Tool Priority**: `.claude/rules/tool-priority.md`
- **NEXUS Config**: `nexus/Architect.md`

---

**Version**: 3.0.0
**Date**: 2026-03-09
**Compatible**: Claude Code v2.1.71+, Gemini CLI, Codex CLI
