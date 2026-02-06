---
description: Claude Code v2.1.x 새 기능 (2026-02)
alwaysApply: false
---

# Claude Code v2.1.x 새 기능

## 버전 정보
- **현재 버전**: v2.1.34 (2026-02-07 업데이트)
- **이전 버전**: v2.1.29
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

버전: 4.0.0
최종 업데이트: 2026-02-07
업데이트 기록: 2.1.29 → 2.1.34
