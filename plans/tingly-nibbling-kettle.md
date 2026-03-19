# 3-Brain CLI Integration Plan
## Claude Code + Gemini CLI + Codex CLI (구독 기반)

## Context
사용자가 Claude Code, Gemini CLI, Codex CLI 3개의 구독형 LLM을 동시에 활용하여
작업 품질을 극대화하는 통합 워크플로우를 구축하려 합니다.
핵심: API 키가 아닌 CLI 구독 토큰을 사용. PAL MCP의 clink 도구를 중심축으로 활용.

## 현재 상태 (검증 완료)

| CLI | 버전 | 경로 | PATH | 상태 |
|-----|-------|------|------|------|
| Claude Code | v2.1.78 | 현재 환경 | O | 정상 |
| Gemini CLI | v0.33.0 | npm global | O | 정상 |
| Codex CLI | v0.113.0 | K:/PortableApps/tools/nodejs/npm-global/codex | X | PATH 필요 |

**PAL clink**: 이미 gemini/codex/claude CLI 프록시 구현 완료
- `shutil.which()`로 PATH에서 바이너리 탐색
- `asyncio.create_subprocess_exec()` + stdin 파이프로 프롬프트 전달
- CLI별 파서: gemini_json, codex_jsonl, claude_json

---

## Phase 1: 인프라 수정 (3개 파일 수정)

### 1-1. Codex PATH 수정
**파일**: `K:/PortableApps/genai/claude.bat` (또는 환경 설정)
**변경**: npm-global 디렉토리를 PATH에 추가
**방법**: `.claude/settings.local.json`의 env에 PATH 추가 또는 claude.bat 수정
```
set PATH=K:\PortableApps\tools\nodejs\npm-global;%PATH%
```
**검증**: `codex --version` 실행 확인

### 1-2. gemini-bridge.js 경로 수정
**파일**: `K:/PortableApps/genai/multi-ai-orchestration/gemini-bridge.js`
**변경**: 15행 geminiCliPath
```javascript
// Before:
geminiCliPath: 'K:/PortableApps/Gemini-CLI/gemini.bat',
// After:
geminiCliPath: 'gemini',
```
**변경**: 89-100행 - .bat 체크 제거, 직접 실행으로 변경
```javascript
// Before: Windows .bat 분기 로직
// After: 직접 command = cliPath; args = ['-p', prompt] 사용
```
**파일**: 77-79행 - `-p` 플래그로 비대화 모드 사용
```javascript
// spawn에 -p 플래그 추가하여 stdin 대신 인자로 프롬프트 전달
```

### 1-3. config.json 경로 수정
**파일**: `K:/PortableApps/genai/multi-ai-orchestration/config.json`
**변경**: 9행
```json
// Before:
"geminiCliPath": "K:/PortableApps/Gemini-CLI/gemini.bat"
// After:
"geminiCliPath": "gemini"
```

---

## Phase 2: Codex 브릿지 생성 (1개 파일 생성)

### 2-1. codex-bridge.js 생성
**파일**: `K:/PortableApps/genai/multi-ai-orchestration/codex-bridge.js`
**구조**: gemini-bridge.js 인터페이스 패턴 재사용 (약 250줄)
- `queryCodex(prompt, options)`: `codex exec "prompt"` 서브프로세스 실행
- `queryCodexWithRetry(prompt, options)`: 재시도 로직
- `requestReview(code)`: `codex review` 서브커맨드 활용
- `requestAlternative(request, context)`: 대안 생성
- `execute(request)`: ExternalRouter 인터페이스
- `isAvailable()`: 바이너리 존재 확인
- JSON 출력 파싱 (`--json` 플래그 활용)

### 2-2. external-router.js 업데이트
**파일**: `K:/PortableApps/genai/multi-ai-orchestration/external-router.js`
**변경 1**: SERVICE_IDS에 CODEX 추가 (25행 근처)
```javascript
CODEX: 'codex',
```
**변경 2**: SERVICE_CONFIGS에 Codex 구성 추가 (196행 이후)
```javascript
[SERVICE_IDS.CODEX]: {
  name: 'OpenAI Codex CLI',
  bridge: './codex-bridge.js',
  capabilities: ['coding', 'reasoning'],
  strengths: ['code_generation', 'code_review'],
  rateLimit: { requests: 30, window: 60000 },
  timeout: 120000,
  priority: 2,
  enabled: true
}
```
**변경 3**: OPENAI service `enabled: true`로 변경 (207행)
**변경 4**: TASK_SERVICE_MAP 코딩 카테고리에 Codex 추가

---

## Phase 3: 3-Brain 워크플로우 스킬 생성 (1개 파일)

### 3-1. 스킬 생성
**파일**: `K:/PortableApps/genai/.claude/skills/three-brain/SKILL.md`

**5가지 워크플로우 패턴 정의**:

**Pattern 1: Pipeline (파이프라인)**
```
Claude: 코드 작성 → clink(gemini, codereviewer): 리뷰
→ clink(codex, codereviewer): 2차 리뷰 → Claude: 종합 반영
→ (품질 미달시 반복)
```

**Pattern 2: CLI Consensus (CLI 합의)**
```
동일 질문 → clink(gemini) + clink(codex) 병렬 호출
→ Claude: 두 응답 비교/종합 → 최종 결정
→ (불일치시 추가 라운드)
```

**Pattern 3: Triangle Review (삼각 검토)**
```
Claude 작성 → Gemini 리뷰 → Codex 리뷰
→ Claude: 두 리뷰 종합/수정 → 만족할 때까지 반복
```

**Pattern 4: Specialist Route (전문가 라우팅)**
```
연구/분석 → clink(gemini, -p, 1M 컨텍스트)
코드 생성 → clink(codex, exec)
통합/오케스트레이션 → Claude (현재 컨텍스트)
```

**Pattern 5: Deep Research + Implement (연구-구현)**
```
Gemini: 대규모 분석 → Claude: 계획 수립
→ Codex: 코드 생성 → Claude: 통합/테스트
→ Gemini: 최종 검토 → (루프)
```

**트리거 키워드**: "3-brain", "세뇌", "삼중", "triple-brain", "3두뇌"

---

## Phase 4: 3-Brain 에이전트 생성 (1개 파일)

### 4-1. 에이전트 생성
**파일**: `K:/PortableApps/genai/.claude/agents/three-brain-orchestrator.md`

**Frontmatter**:
```yaml
name: three-brain-orchestrator
tools: Read, Write, Edit, Bash, Grep, Glob
model: opus
description: 3-Brain orchestrator that coordinates Claude, Gemini CLI, and Codex CLI
  through PAL clink for multi-LLM workflow loops using CLI subscriptions.
```

**역할**:
- clink(gemini), clink(codex) 호출을 통한 다중 LLM 파이프라인 실행
- continuation_id로 대화 컨텍스트 유지
- 품질 게이트: 각 라운드마다 점수 매기고 기준 미달시 재시도
- 최대 3라운드 루프

---

## Phase 5: 기존 시스템 업데이트 (2개 파일 수정)

### 5-1. multi-ai-deliberation 스킬 업데이트
**파일**: `K:/PortableApps/genai/.claude/skills/multi-ai-deliberation/SKILL.md`
**변경**: Codex 추가
- Phase 1에 Codex 독립 분석 추가
- Tool Domains 테이블에 Codex 역할 추가
- 트리거 키워드에 "codex" 추가

### 5-2. config.json 서비스 업데이트
**파일**: `K:/PortableApps/genai/multi-ai-orchestration/config.json`
**변경**: services 섹션에 codex 추가
```json
"codex": {
  "status": "active",
  "role": "code-specialist",
  "connection": "cli",
  "command": "codex exec",
  "description": "OpenAI Codex CLI - Code generation, review, debugging"
}
```

---

## Phase 6: 검증

### 6-1. 개별 CLI 테스트
```bash
# Gemini CLI 비대화 테스트
gemini -p "Say hello in Korean"

# Codex CLI 비대화 테스트
codex exec "Say hello in Korean"

# Claude CLI 비대화 테스트
claude --print "Say hello in Korean"
```

### 6-2. PAL clink 테스트
```
mcp__pal__clink(cli_name="gemini", prompt="Hello test", role="default")
mcp__pal__clink(cli_name="codex", prompt="Hello test", role="default")
```

### 6-3. 파이프라인 워크플로우 테스트
1. Claude로 간단한 함수 작성
2. clink(gemini, codereviewer)로 리뷰
3. clink(codex, codereviewer)로 2차 리뷰
4. 리뷰 결과 반영하여 수정

---

## 수정 파일 요약

| # | 파일 | 작업 | 이유 |
|---|------|------|------|
| 1 | claude.bat (또는 settings) | PATH 수정 | Codex CLI PATH 추가 |
| 2 | multi-ai-orchestration/gemini-bridge.js | 경로 수정 | 잘못된 .bat 경로 |
| 3 | multi-ai-orchestration/config.json | 경로+서비스 수정 | 경로 불일치 + Codex 추가 |
| 4 | multi-ai-orchestration/codex-bridge.js | 신규 생성 | CLI 기반 Codex 브릿지 |
| 5 | multi-ai-orchestration/external-router.js | Codex 추가 | 라우터에 Codex 등록 |
| 6 | .claude/skills/three-brain/SKILL.md | 신규 생성 | 3-Brain 워크플로우 스킬 |
| 7 | .claude/agents/three-brain-orchestrator.md | 신규 생성 | 3-Brain 에이전트 |
| 8 | .claude/skills/multi-ai-deliberation/SKILL.md | 수정 | Codex 통합 |

**총 8개 파일: 5개 수정 + 3개 신규**
