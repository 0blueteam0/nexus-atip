---
description: Claude Code v2.1.x 새 기능 (2026-03)
alwaysApply: false
---

# Claude Code v2.1.x 새 기능

## 버전 정보
- **현재 버전**: v2.1.71 (2026-03-09 업데이트)
- **이전 버전**: v2.1.34
- **적용 대상**: v2.1.0 이후 주요 변경사항

---

## [HOT] Skill Hot-reload (v2.1.0)
**스킬 실시간 재로딩**

### 기능
- 스킬 파일 수정 시 재시작 없이 자동 반영
- `.claude/skills/` 폴더 변경 감지
- 개발 생산성 향상

### 활용
- 스킬 개발/디버깅 시 즉시 테스트 가능
- SKILL.md 수정 후 바로 적용 확인

---

## [LSP] Language Server Protocol Tool (v2.0.74)
**코드 인텔리전스 네이티브 지원**

### 사용 가능한 작업
| 작업 | 설명 | 용도 |
|------|------|------|
| `goToDefinition` | 심볼 정의 위치 찾기 | 함수/클래스 원본 탐색 |
| `findReferences` | 모든 참조 찾기 | 영향 범위 분석 |
| `hover` | 호버 정보 조회 | 타입/문서 확인 |
| `documentSymbol` | 문서 내 심볼 목록 | 파일 구조 파악 |
| `workspaceSymbol` | 워크스페이스 심볼 검색 | 전역 심볼 탐색 |
| `goToImplementation` | 구현체 찾기 | 인터페이스 구현 확인 |
| `prepareCallHierarchy` | 호출 계층 준비 | 함수 호출 관계 |
| `incomingCalls` | 호출하는 함수들 | 역방향 호출 추적 |
| `outgoingCalls` | 호출되는 함수들 | 순방향 호출 추적 |

### 사용 예시
```
LSP(operation="goToDefinition", filePath="src/app.ts", line=42, character=15)
LSP(operation="findReferences", filePath="src/utils.ts", line=10, character=8)
```

### 활용 시나리오
- 리팩토링 전 영향 범위 분석
- 코드 탐색 시 Grep 대체
- 타입 정보 빠른 확인

---

## [MCP] MCP Wildcard 패턴 (v2.0.70)
**3배 메모리 효율 향상**

### 패턴 문법
```
mcp__[server]__*  # 서버의 모든 도구 허용
```

### 적용 예시 (allowedTools)
| 패턴 | 효과 |
|------|------|
| `mcp__desktop-commander__*` | DC 모든 도구 허용 |
| `mcp__github__*` | GitHub 모든 도구 허용 |
| `mcp__firecrawl__*` | Firecrawl 모든 도구 허용 |

### 장점
- 개별 도구 나열 불필요
- 설정 파일 크기 감소
- 새 도구 자동 포함

---

## [THINK] Extended Thinking (확장 사고)
**깊은 분석을 위한 사고 모드**

### 활성화 방법
| 방법 | 설명 |
|------|------|
| `Alt+T` | 토글 단축키 |
| `ultrathink` | 키워드 트리거 |
| `/think` | 슬래시 명령어 |

### 모드 종류
| 모드 | 토큰 예산 | 용도 |
|------|----------|------|
| `think` | 기본 | 일반 분석 |
| `ultrathink` | 확장 | 복잡한 문제 해결 |

### 적용 시나리오
- 아키텍처 설계
- 복잡한 버그 분석
- 다중 옵션 비교

---

## [REWIND] 상태 롤백 (v2.0.69)
**실수 복구를 위한 체크포인트**

### 사용 방법
```
Double ESC (ESC 두 번 빠르게)
```

### 기능
- 이전 상태로 롤백
- 실행 취소 (Undo)
- 체크포인트 복원

### 주의사항
- 파일 시스템 변경은 별도 복원 필요
- Git 커밋으로 백업 권장

---

## [AGENT] Background Agents
**비동기 작업 처리**

### 특징
- 백그라운드에서 에이전트 실행
- 메인 작업과 병렬 처리
- 결과 비동기 수집

### 사용 예시
```javascript
Task(subagent_type="Explore", run_in_background=true)
TaskOutput(task_id="...", block=false)  // 논블로킹 확인
```

---

## [STATUS] Statusline 설정
**상태 표시줄 커스터마이징**

### 사용 가능한 변수
| 변수 | 표시 내용 |
|------|----------|
| `{model}` | 현재 모델명 |
| `{context}` | 컨텍스트 사용률 |
| `{cost}` | 세션 비용 |
| `{time}` | 경과 시간 |

---

## [COST] 비용 추적 개선
**실시간 비용 모니터링**

### 표시 정보
- 입력 토큰 수
- 출력 토큰 수
- 누적 비용 (USD)
- 세션별 통계

---

## 통합 활용 권장사항

### 코드 탐색 워크플로우
```
1. LSP(documentSymbol) → 파일 구조 파악
2. LSP(goToDefinition) → 심볼 정의 확인
3. LSP(findReferences) → 영향 범위 분석
4. Explore 에이전트 → 컨텍스트 확장 탐색
```

### 복잡한 문제 해결
```
1. ultrathink 모드 활성화
2. sequential_thinking 활용
3. 필요시 Rewind로 롤백
```

---

## [NEW] v2.1.7 ~ v2.1.29 새 기능

### Task Management System (v2.1.16)
**의존성 추적 지원 작업 관리**
- 새로운 내장 작업 관리 시스템
- `CLAUDE_CODE_ENABLE_TASKS=false`로 비활성화 가능
- VSCode 네이티브 플러그인 관리 지원

### Keyboard Shortcuts (v2.1.18)
**키보드 단축키 커스터마이징**
- `/keybindings` 명령어로 설정
- 문서: https://code.claude.com/docs/en/keybindings

### PR Session Linking (v2.1.27)
**GitHub PR과 세션 연결**
- `--from-pr` 플래그로 특정 PR 세션 재개
- `gh pr create` 시 세션 자동 연결

### History Autocomplete (v2.1.14)
**Bash 모드 히스토리 자동완성**
- `!` 접두사 + Tab으로 히스토리 검색
- 플러그인 특정 커밋 SHA 고정 지원

### Setup Hook (v2.1.10)
**저장소 설정/유지보수 훅**
- `--init`, `--init-only`, `--maintenance` CLI 플래그로 트리거
- OAuth URL 복사 단축키 'c' 추가

### 추가 설정 옵션
| 버전 | 설정 | 용도 |
|------|------|------|
| v2.1.23 | `spinnerVerbs` | 스피너 동사 커스터마이징 |
| v2.1.9 | `plansDirectory` | 플랜 파일 저장 위치 |
| v2.1.7 | `showTurnDuration` | 턴 소요 시간 표시 토글 |

### 보안 수정 (CRITICAL)
| 버전 | 내용 |
|------|------|
| v2.1.7 | wildcard permission 규칙 취약점 |
| v2.1.2 | command injection 취약점 |

---

## [NEW] v2.1.30 ~ v2.1.34 새 기능

### Agent Teams (v2.1.32~v2.1.34) - EXPERIMENTAL
**멀티 에이전트 협업 시스템**

#### 활성화 방법
```bash
# 환경변수로 실험적 기능 활성화
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

#### 새 훅 이벤트
| 이벤트 | 설명 | 용도 |
|--------|------|------|
| `TeammateIdle` | 팀원 에이전트 유휴 시 | 작업 분배 최적화 |
| `TaskCompleted` | 태스크 완료 시 | 후속 작업 트리거 |

#### 새 frontmatter 필드
```yaml
# SKILL.md / AGENTS.md에서 사용
memory: user     # 사용자 레벨 영속 메모리
memory: project  # 프로젝트 레벨 메모리
memory: local    # 로컬 세션 메모리 (기본값)
```

#### Swarm 패턴 지원
- 다중 에이전트 자동 조율
- 작업 병렬 분산 처리
- 결과 자동 집계

### PDF 읽기 개선 (v2.1.31)
**페이지 단위 PDF 읽기**

```javascript
// 특정 페이지만 읽기
Read(file_path="document.pdf", pages="1-5")
Read(file_path="document.pdf", pages="3")
Read(file_path="document.pdf", pages="10-20")

// 제한 사항
// - 10페이지 초과 PDF는 pages 파라미터 필수
// - 요청당 최대 20페이지
// - 대용량 PDF는 lightweight reference로 자동 전환
```

### 디버그 명령어 (v2.1.30)
```
/debug  # 세션 트러블슈팅 모드 진입
```

| 기능 | 설명 |
|------|------|
| 세션 상태 덤프 | 현재 컨텍스트, 도구 상태 출력 |
| MCP 연결 진단 | 서버 연결 상태 확인 |
| 메모리 사용량 | 토큰 사용 현황 |

### 추가 v2.1.30+ 설정
| 버전 | 설정/플래그 | 용도 |
|------|------------|------|
| v2.1.34 | `memory` frontmatter | 메모리 범위 지정 |
| v2.1.32 | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | 팀 기능 활성화 |
| v2.1.31 | `pages` 파라미터 | PDF 페이지 지정 |
| v2.1.30 | `/debug` | 디버그 모드 |

---

## [NEW] v2.1.35 ~ v2.1.71 새 기능 (2026-02-07 ~ 2026-03-07)

> 37개 릴리스, 주요 신기능 요약

### Auto Memory (v2.1.59)
**Claude가 유용한 컨텍스트를 자동 저장**

| 버전 | 기능 |
|------|------|
| v2.1.59 | Auto Memory 도입, `/memory` 명령어 |
| v2.1.63 | Worktree 간 auto memory 공유 |
| v2.1.69 | Agent Memory Scopes: `memory` frontmatter (`user`/`project`/`local`) |

```
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1  # 비활성화 시
```

### Remote Control (v2.1.51)
**외부 시스템에서 Claude Code 원격 제어**

```bash
claude remote-control [name]  # 원격 제어 서버 시작
```

| 버전 | 기능 |
|------|------|
| v2.1.51 | `claude remote-control` 서브커맨드 도입 |
| v2.1.58 | 더 많은 사용자에게 롤아웃 |
| v2.1.69 | optional `name` 인수 추가 |
| v2.1.70 | 폴링 주기 최적화 (1-2초 → 10분) |

### Agent Teams (v2.1.40+) - EXPERIMENTAL
**멀티 에이전트 협업 시스템**

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

| 버전 | 기능 |
|------|------|
| v2.1.49 | Background agents (`background: true`), Ctrl+F로 종료 |
| v2.1.50 | `isolation: worktree`, `claude agents` CLI |
| v2.1.69 | TeammateIdle/TaskCompleted hook stop 지원, 토큰 절감 |
| v2.1.71 | `--print` + team agents 행 걸림 수정 |

Agent 정의 frontmatter:
```yaml
memory: user     # 사용자 레벨 영속
memory: project  # 프로젝트 레벨
memory: local    # 세션 내 (기본)
background: true # 백그라운드 실행
isolation: worktree  # git worktree 격리
permissionMode: plan  # 권한 모드
```

### Voice Mode (v2.1.59+)
**Push-to-Talk 음성 입력**

```
/voice  # 활성화
```

- Spacebar 길게 눌러서 말하기 (push-to-talk)
- 20개 언어 지원 (한국어 포함)
- 토큰 사용 미카운트
- `voice:pushToTalk` 키바인딩 커스텀 (v2.1.71)

### HTTP Hooks (v2.1.63)
**URL로 JSON POST + JSON 응답 수신**

기존 shell hooks 외에 HTTP endpoint hooks 지원.

### New Slash Commands

| 버전 | 명령어 | 설명 |
|------|--------|------|
| v2.1.59 | `/copy` | 코드 블록 인터랙티브 복사 |
| v2.1.59 | `/memory` | Auto Memory 관리 |
| v2.1.63 | `/simplify` | 코드 품질 리뷰 (3 에이전트 병렬) |
| v2.1.63 | `/batch` | 대규모 변경 병렬 오케스트레이션 |
| v2.1.69 | `/claude-api` | Claude API 앱 빌드 스킬 |
| v2.1.69 | `/reload-plugins` | 플러그인 재로드 |
| v2.1.71 | `/loop` | 반복 실행 (예: `/loop 5m check deploy`) |

### New Hook Events

| 이벤트 | 도입 | 설명 |
|--------|------|------|
| `ConfigChange` | v2.1.49 | 설정 파일 변경 시 |
| `WorktreeCreate` | v2.1.50 | worktree 생성 시 |
| `WorktreeRemove` | v2.1.50 | worktree 삭제 시 |
| `InstructionsLoaded` | v2.1.69 | 인스트럭션 로드 완료 시 |
| `SubagentStart` | 기존 | 서브에이전트 시작 |
| `TaskCompleted` | 기존 | 태스크 완료 |
| `TeammateIdle` | 기존 | 팀원 유휴 |

Hook에 추가된 필드: `agent_id`, `agent_type`, `worktree`, `last_assistant_message`

### New CLI Flags

| 플래그 | 버전 | 설명 |
|--------|------|------|
| `--tools` | v2.1.35 | 빌트인 도구 제한 |
| `--worktree` (`-w`) | v2.1.49 | git worktree 격리 실행 |
| `--effort <level>` | v2.1.49 | low/medium/high |
| `--fallback-model` | - | 과부하 시 자동 폴백 |
| `--agent <agent>` | - | 세션 에이전트 지정 |
| `--agents <json>` | - | 커스텀 에이전트 JSON |
| `--chrome` / `--no-chrome` | - | Chrome 통합 |
| `--plugin-dir <paths>` | - | 플러그인 디렉토리 |
| `--tmux` | - | worktree tmux 세션 |

### New Environment Variables

| 환경변수 | 설명 |
|----------|------|
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 자동 압축 비율 오버라이드 |
| `CLAUDE_CODE_SUBAGENT_MODEL` | 서브에이전트 모델 지정 |
| `CLAUDE_AUTO_BACKGROUND_TASKS` | 자동 백그라운드 태스크 |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Agent Teams 활성화 |
| `CLAUDE_SKILL_DIR` | 스킬 디렉토리 경로 |
| `CLAUDE_CODE_REMOTE` | 원격 모드 |
| `CLAUDE_CODE_REMOTE_MEMORY_DIR` | 원격 메모리 디렉토리 |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | Auto Memory 비활성화 |
| `ENABLE_CLAUDEAI_MCP_SERVERS` | claude.ai MCP 서버 옵트아웃 |
| `CLAUDE_CODE_SIMPLE` | 단순 모드 (MCP/hooks/CLAUDE.md 비활성화) |
| `CLAUDE_CODE_TEAMMATE_COMMAND` | 팀 에이전트 명령어 |

### New Settings

| 설정 | 버전 | 설명 |
|------|------|------|
| `spinnerTipsOverride` | v2.1.45 | 커스텀 스피너 메시지 |
| `disableAllHooks` | v2.1.49 | 전체 hook 비활성화 |
| `startupTimeout` | v2.1.50 | LSP 시작 타임아웃 |
| `includeGitInstructions` | v2.1.69 | git 인스트럭션 포함 여부 |
| `${CLAUDE_SKILL_DIR}` | v2.1.69 | 스킬 디렉토리 변수 |
| `oauth.authServerMetadataUrl` | v2.1.69 | MCP OAuth 설정 |

### Permission Modes (7종)

| 모드 | 설명 |
|------|------|
| `default` | 매번 확인 |
| `acceptEdits` | 편집 자동 승인 |
| `plan` | Plan Mode |
| `dontAsk` | 묻지 않음 |
| `bypassPermissions` | 모든 권한 우회 |
| `auto` | 자동 판단 |
| `bubble` | 상위 에이전트로 전달 |

### 성능 개선 하이라이트

| 버전 | 개선 |
|------|------|
| v2.1.63 | 메모리 누수 15건 수정 |
| v2.1.69 | 메모리 ~16MB 감소, React Compiler 적용 |
| v2.1.70 | 프롬프트 입력 렌더 ~74% 감소, 시작 메모리 ~426KB 감소 |
| v2.1.71 | bridge 재연결 개선 (10분 → 수 초) |

### 모델 변경

| 버전 | 변경 |
|------|------|
| v2.1.45 | Sonnet 4.6 도입 |
| v2.1.68 | Opus 4.6 기본, Opus 4/4.1 제거, `ultrathink` 재도입 |
| v2.1.69 | Sonnet 4.5 → 4.6 자동 이동 |

### 보안 수정

| 버전 | 수정 |
|------|------|
| v2.1.38 | heredoc 명령 주입 방지 |
| v2.1.40 | sandbox 우회 수정 |
| v2.1.51 | Hook workspace trust 취약점 |
| v2.1.69 | node_modules 스킬 로딩 방지, symlink 우회 수정 |

---

버전: 5.0.0
최종 업데이트: 2026-03-09
업데이트 기록: 2.1.29 → 2.1.34 → 2.1.71
