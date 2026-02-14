# CLAUDE.md - K드라이브 통합 프로젝트 지침 (Core)

> **모듈화 완료**: 상세 지침은 `.claude/rules/` 폴더에서 자동 로드됩니다.

---

## [최우선] xAI 기반 작업 프로세스 (SUPREME PRIORITY)
**"모든 작업은 반드시 설명 가능해야 하며, 사용자 확인 없이 큰 프로젝트를 진행하지 않는다"**

### 필수 7단계 프로세스 (대형 작업 시 의무)
```
1. [Plan Mode] 플랜모드 진입 → 전체 계획 수립
2. [상세 설명] 플랜 내용을 아주 상세하고 쉽게 설명
3. [태스크 분해] 각 태스크를 아주 자세히 설명
4. [선택 옵션] 최소 3가지 선택지 제시 (범위/비용/기간)
5. [실행 계획] 구체적 실행 계획 제시
6. [사용자 확인] 사용자 선택 및 승인 대기 (필수)
7. [설명형 실행] 모든 단계마다 상세한 해설 부여
```

### xAI 태그 시스템 (모든 도구 호출 시 의무)
- **[작업]**: 무엇을 하는가
- **[목적]**: 왜 하는가
- **[방법]**: 어떻게 하는가
- **[완료]**: 무엇을 완료했는가
- **[영향]**: 어떤 영향이 있는가

### 중요 원칙
1. **"계속 진행" ≠ "확인 없이 큰 프로젝트 시작"**
2. **대형 작업 기준**: 3개+ 파일 생성, 300줄+ 코드, 5개+ 태스크 → Plan Mode 필수
3. **이 규칙은 모든 하위 규칙보다 우선합니다.**

---

## [RIPER+] 개발 워크플로우 (CRITICAL)
**유연한 회귀적 개발 워크플로우** - 선형이 아닌 순환형 모델

### 6단계 프로세스
```
SPECIFY → EXPLORE → PLAN → IMPLEMENT → VERIFY → RELEASE
    ↑         ↑        ↑         │
    └─────────┴────────┴─────────┘ (회귀 가능)
```

| 단계 | 목표 | 산출물 |
|------|------|--------|
| **SPECIFY** | 요구사항 명확화 | PRD, Goal, Scope |
| **EXPLORE** | 코드베이스 이해 | 패턴 분석, 리스크 |
| **PLAN** | 계획 수립 | 아키텍처, 태스크 분해 |
| **IMPLEMENT** | 코드 작성 | 코드, 테스트 |
| **VERIFY** | 품질 검증 | QA 결과, 리뷰 |
| **RELEASE** | 배포 | PR, 배포 |

### Phase Gate (품질 관문)
- 각 단계 전환 시 Gate Check 수행
- Gate 미통과 시 이전 단계로 회귀

- **상세 규칙**: `.claude/rules/development-workflow.md`

---

## [WS] 워크스페이스 구조 (CRITICAL)
**목적별 워크스페이스 분리**

### 3-Tier 계층
| 레벨 | 위치 | 역할 |
|------|------|------|
| **L0** | 루트 CLAUDE.md | 글로벌 공통 규칙 |
| **L1** | workspaces/*/CLAUDE.md | 목적별 규칙 |
| **L2** | projects/*/CLAUDE.md | 프로젝트 특화 |

### 워크스페이스 목록
| 워크스페이스 | 용도 |
|-------------|------|
| `research/` | 논문/연구 |
| `app-dev/` | 앱 개발 |
| `web-services/` | 웹서비스/API |
| `automation/` | 자동화/도구 |

- **상세 규칙**: `.claude/rules/workspace-structure.md`

---

## [KR] 한국어 표시 프로토콜 (ULTRA CRITICAL)
**모든 작업을 한국어로 병기하여 사용자 이해도 극대화**
- 도구 호출 전: [작업], [목적] 태그로 설명
- 도구 호출 후: [완료], [영향] 태그로 요약
- 복잡한 작업: 단계별 한국어 가이드 제공
- 상세 규칙: documentation/core-modules/@korean-display-protocol.md

---

## [*] ASCII 문자 사용 원칙 (CRITICAL)
**모든 출력에서 이모지 사용 금지. ASCII 문자만 사용.**
- 매핑: [+] 성공, [-] 실패, [*] 진행, [!] 경고, [?] 정보
- 이유: 호환성 100% 보장, 포터블 환경 필수

---

## [BAT] 배치 파일 작성 규칙 (CRITICAL)
```batch
@echo off
chcp 65001 >nul 2>&1
:: English comments only - 한글 사용 금지
```

---

## [DC] Desktop Commander 우선 사용 (CRITICAL)
**파일 작업 시 Desktop Commander 도구 우선 사용**
- filesystem MCP 대신 DC 사용 (출력 깔끔, 성능 우수)
- write_file: 30줄 단위로 청크 분할 작성
- edit_block: 정밀한 수정 작업

---

## [TOOL] 도구 우선순위 시스템 (CRITICAL)
**모든 코드 작업 시 필수 도구 우선순위**

| 우선순위 | 도구 | 용도 |
|---------|------|------|
| P1 | Desktop Commander | 모든 파일 작업 (90% 커버리지) |
| P2 | Edit File Lines | 정밀 라인 편집 (DC 실패 시) |
| P3 | Shrimp Task Manager | 작업 관리 (**TodoWrite 절대 금지**) |
| P4 | Built-in Tools | 폴백 전용 (Read, Write, Edit) |

- **상세 규칙**: `.claude/rules/tool-priority.md`

---

## [NEW] Claude Code v2.0.70+ 기능 (2025-12)
**최신 기능 활용**

| 기능 | 버전 | 설명 |
|------|------|------|
| LSP Tool | v2.0.74 | goToDefinition, findReferences, hover |
| MCP Wildcard | v2.0.70 | `mcp__server__*` 패턴 (3배 메모리 효율) |
| Extended Thinking | v2.0.72 | Alt+T 토글, ultrathink 모드 |
| Rewind | v2.0.69 | Double ESC 상태 롤백 |

- **상세 규칙**: `.claude/rules/new-features-v2.md`

---

## [!!] MCP 출력 간결화 규칙 (ULTRA CRITICAL)
**MCP 도구 사용 시 raw JSON 파라미터 출력 금지**
- 결과만 간단히 요약하여 표시
- 예시: "[FS] 파일 작성 완료: file.md"

---

## [!] 간결한 출력 원칙 (OUTPUT MINIMIZATION)
- 긴 파일 내용 표시 금지
- 상태만 간단히 표시
- 불필요한 설명 생략
- 핵심만 한 줄로

---

## [EXPLORE] Explore 에이전트 자동 호출 (CRITICAL)
**코드베이스 탐색 시 Explore 에이전트 우선 사용**

### 자동 호출 조건
- 코드베이스 질문: "어디서", "where is", "찾아줘"
- 아키텍처 이해: "구조", "architecture", "어떻게 동작"
- 다중 파일 패턴: "모든 파일", "across files"

### 호출 패턴
```
Task(subagent_type=Explore, prompt="[탐색 목적]", thoroughness="medium")
```

---

## [TASK] Task Management (CRITICAL)
- **ALWAYS use Shrimp Task Manager**
- **Path**: K:/PortableApps/genai/ShrimpData/tasks/current-tasks.json
- **Shrimp 우선**: plan_task → split_tasks → execute_task → verify_task

---

## [CMD] 커맨드 레지스트리 시스템 (CRITICAL)
**키워드 감지 → 자동 발견 → 온디맨드 로딩**

### 구조
| 위치 | 로딩 방식 | 용도 |
|------|----------|------|
| `_registry.md` | 항상 로드 | 키워드-커맨드 매핑 인덱스 |
| `core/` (10개) | 항상 로드 | 필수 커맨드 (commit, debug, test 등) |
| `library/` (30개) | 온디맨드 | 확장 커맨드 (배포, CI/CD, 워크플로우 등) |

### 자동 발견 로직
```
사용자 입력 분석 → _registry.md 키워드 매칭
    ↓
[core/] → 즉시 실행
[library/] → Read 도구로 로드 후 실행
```

### 사용 예시
- "배포해줘" → `/blue-green-deployment` (library/) 자동 로드
- "커밋" → `/commit` (core/) 즉시 실행
- "CI 설정" → `/ci-pipeline` (library/) 자동 로드

### 효과
- 초기 로드: 185KB → 20KB (89% 감소)
- 컨텍스트 효율: 40개 → 11개 상시 로드

---

## [DISPLAY] 화면 표시 기본 설정
- **기본 해상도: 2560x1330** (최대화면)
- Playwright: 모든 navigate 시 width=2560, height=1330

---

## [>>] 자동 로드 모듈 (.claude/rules/)

다음 파일들은 CLAUDE.md와 동일한 효과로 자동 로드됩니다:

| 파일 | 설명 |
|------|------|
| `development-workflow.md` | **RIPER+ 개발 워크플로우** |
| `workspace-structure.md` | **워크스페이스 계층 구조** |
| `tiered-review.md` | **단계별 코드 리뷰 (PR)** |

### 에이전트 설정 (.claude/agents/)
| 파일 | 설명 |
|------|------|
| `parallel-workflow.md` | 병렬 에이전트 워크플로우 |
| `native-binding-expert.md` | Python-C/C++ 바인딩 전문가 |

### 템플릿 (.claude/templates/)
| 파일 | 설명 |
|------|------|
| `specs/spec-template.md` | PRD 템플릿 |
| `specs/plan-template.md` | 구현 계획 템플릿 |
| `specs/tasks-template.md` | 태스크 템플릿 |
| `phase-gate-checklist.md` | 품질 관문 체크리스트 |
| `complexity-assessment.md` | 복잡도 평가 기준 |
| `pr/pull-request-template.md` | PR 템플릿 |
| `update-workflow.md` | Claude Code 업데이트 프로세스 |
| `agentic-learning.md` | 에이전틱 자기학습 워크플로우 |
| `docker-workflow.md` | Docker 시작 확인 (MCP 서버 작업 시) |
| `environment.md` | K드라이브 환경 정보 |
| `bottom-up-paradigm.md` | 자율성 원칙, 선제적 제안 |
| `memory-system.md` | 메모리 시스템, 세션 연속성 |
| `atos-system.md` | ATOS 도구 오케스트레이션 |
| `fic-compaction.md` | FIC 컨텍스트 압축 규칙 |

### 핵심 모듈 참조 (documentation/)
- `@mcp-selective-usage.md`: MCP 선택적 사용 규칙
- `@deep-think-framework.md`: 필수 사고 프레임워크
- `@portable-philosophy.md`: 포터블 개발 환경 철학
- `@comparison-system.md`: 체계적 비교 분석 시스템

---

## [SKILL] 등록된 스킬

| 스킬 | 트리거 키워드 |
|------|--------------|
| academic-paper-verifier | "논문 검증", "학술 검증", "citation check" |
| update-optimizer | "업데이트", "update", "새 버전" |
| pdf-vision | "PDF 분석", "OCR" |
| **project-init** | "프로젝트 생성", "새 프로젝트", "project init" |
| **bmad-agents** | "분석가 모드", "아키텍트 모드", "QA 모드" |
| **vibe-coding** | "바이브 코딩", "vibe coding", "빠른 개발", "프로토타입" |
| **python-c-binding** | "pybind11", "C 바인딩", "Python C extension", "native module" |
| **ralph-wiggum-loop** | "자율 루프", "autonomous loop", "반복 개선", "ralph wiggum" |

---

## SuperClaude Framework

### 설치 정보
- **경로**: K:/PortableApps/genai/superclaude
- **버전**: 4.0.8

### 주요 명령어
- `/sc:build` - 프로젝트 빌드
- `/sc:analyze` - 코드 분석
- `/sc:secure` - 보안 검사
- `/sc:optimize` - 성능 최적화

---

## [INV] 시스템 현황 참조
- **전체 현황**: SYSTEM-INVENTORY.md
- **활성 플랜**: plans/ACTIVE-PLAN.md (세션 시작 시 필수 확인)
- **플래닝 시스템**: planning-system/
- **상태 복원**: `node planning-system/restore.js --all`
- **상태 저장**: `node planning-system/checkpoint.js --auto-save`

---

## [MCP] MCP 서버 인벤토리 (38개)
**상세 문서**: `documentation/guides/TOOL-CATALOG-2026.md`

### 카테고리별 요약
| 카테고리 | 수량 | 주요 서버 |
|----------|------|----------|
| **File/Code** | 6 | desktop-commander (P1), edit-file-lines (P2), git-mcp, github |
| **Web Crawling** | 6 | firecrawl, one-search, crawl4ai-lite, playwright |
| **Research** | 4 | deep-research-mcp, paper-search-mcp, context7 |
| **AI/LLM** | 5 | multi-ai-orchestration, llm-council, sequential-thinking |
| **Database** | 2 | sqlite-mcp, supabase |
| **Memory** | 2 | memory, kiro-memory |
| **Task Mgmt** | 3 | shrimp-task (P3), vibekanban, task-master-ai |
| **Media** | 5 | image-recognition, paddleocr-mcp, marker-mcp, antv-chart |
| **Automation** | 3 | playwright, n8n, e2b |
| **Other** | 2 | mcp-installer, hfspace |

### 도구 선택 가이드 (P1-P4)
| 우선순위 | 도구 | 용도 |
|---------|------|------|
| **P1** | desktop-commander | 모든 파일 작업 (90% 커버리지) |
| **P2** | edit-file-lines | 정밀 라인 편집 (DC 실패 시) |
| **P3** | shrimp-task | 작업 관리 (**TodoWrite 절대 금지**) |
| **P4** | Built-in Tools | 폴백 전용 (Read, Write, Edit) |

### Docker 필요 서버
| 서버 | 컨테이너 | 자동 시작 |
|------|----------|----------|
| firecrawl (self-hosted) | firecrawl-api-1 | O (Hook) |
| searxng-crawl4ai-mcp | searxng | O (Hook) |

### 참조 문서
- **도구 카탈로그**: `documentation/guides/TOOL-CATALOG-2026.md`
- **MCP 비교**: `documentation/guides/MCP-COMPARISON-2026.md`
- **설치 제안서**: `documentation/reports/MCP-INSTALLATION-PROPOSAL.md`

---

## 환경 정보 (요약)

| 항목 | 경로 |
|------|------|
| Windows Native | K:\PortableApps\genai |
| Node.js | K:\PortableApps\tools\nodejs\node.exe |
| Python | K:\PortableApps\tools\python\python.exe |

### Git 세이브포인트
```bash
git add -A && git commit -m "Savepoint: work in progress" && git push
```

---

버전: 6.0.0 (Production Workflow)
최적화: RIPER+ 워크플로우 + 워크스페이스 계층 구조
