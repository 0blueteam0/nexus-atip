# Claude Code Skills Guide 2026

> **Version**: 2.0.0
> **Last Updated**: 2026-02-04
> **Total Skills**: 22

---

## Table of Contents

1. [Overview](#overview)
2. [Trigger System](#trigger-system)
3. [Skills by Category](#skills-by-category)
4. [Detailed Skill Reference](#detailed-skill-reference)
5. [Usage Examples](#usage-examples)

---

## Overview

Claude Code의 스킬(Skill)은 특정 작업을 자동화하는 워크플로우입니다.
트리거 키워드가 감지되면 해당 스킬이 자동으로 활성화됩니다.

### Skill Location
- **Path**: `.claude/skills/[skill-name]/SKILL.md`
- **Auto-load**: 키워드 감지 시 자동 로드


---

## Trigger System

### How Triggers Work
1. 사용자 입력에서 키워드 감지
2. 매칭된 스킬 자동 로드
3. 워크플로우 실행
4. 결과 반환

### Trigger Types
| Type | Example | Detection |
|------|---------|-----------|
| Korean | "논문 검증", "코드 분석" | 정확 매칭 |
| English | "verify paper", "analyze code" | 정확/부분 매칭 |
| Slash Command | `/bmad analyst` | 명시적 호출 |

---

## Skills by Category

### Academic/Research
| Skill | Purpose | Triggers |
|-------|---------|----------|
| academic-paper-verifier | 학술 논문 검증 | 논문 검증, paper verification |
| research-workflow | 종합 리서치 | 연구, research, 조사 |
| fic-research | ACE-FCA 리서치 | 리서치, investigate |


### Development
| Skill | Purpose | Triggers |
|-------|---------|----------|
| code-analysis | 코드 심층 분석 | 코드 분석, analyze code |
| code-reviewer | 코드 리뷰/보안 검사 | PR review, find bugs |
| debugger | 디버깅/RCA | debug, fix error, crash |
| refactorer | 코드 개선 | refactor, clean up |
| test-writer | 테스트 작성 | write tests, unit test |

### Planning/Workflow
| Skill | Purpose | Triggers |
|-------|---------|----------|
| fic-plan | ACE-FCA 계획 수립 | 계획 세워줘, plan, design |
| fic-implement | ACE-FCA 구현 | 구현해줘, implement, build |
| multi-agent-workflow | CoT/ToT/ReAct 협업 | 멀티에이전트, dual llm |
| multi-ai-deliberation | Claude-Gemini 협의 | 협의해서, deliberate |

### System/Maintenance
| Skill | Purpose | Triggers |
|-------|---------|----------|
| update-optimizer | 업데이트 후 최적화 | 업데이트, post-update |
| cleanup-advisor | 폴더 정리 | suggest cleanup, 정리 추천 |
| mcp-health-checker | MCP 서버 진단 | MCP 상태, mcp diagnostics |
| doc-researcher | 공식 문서 리서치 | research docs, changelog |


### Project/Workspace
| Skill | Purpose | Triggers |
|-------|---------|----------|
| project-init | 프로젝트 초기화 | 프로젝트 생성, project init |
| workspace-switcher | 워크스페이스 전환 | workspace, 워크스페이스 |
| bmad-agents | BMAD 에이전트 역할 | 분석가 모드, architect mode |

### Documentation
| Skill | Purpose | Triggers |
|-------|---------|----------|
| documentation-writer | 문서 작성 | 문서 작성, README 생성 |

### Vision/PDF
| Skill | Purpose | Triggers |
|-------|---------|----------|
| pdf-vision | PDF/이미지 분석 | PDF 분석, OCR, 테이블 추출 |

### Template
| Skill | Purpose | Triggers |
|-------|---------|----------|
| base-skill | 스킬 템플릿 | (개발용) |

---

## Detailed Skill Reference

---

### 1. academic-paper-verifier

**Version**: 1.1.0
**Category**: Academic/Research
**Description**: 학술 논문의 인용, 통계, 데이터 테이블의 학술적 엄밀성을 체계적으로 검증

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 논문 검증 | paper verification |
| 학술 검증 | academic rigor |
| 인용 확인 | citation check |
| 데이터 검증 | verify claims |
| 통계 검증 | reference check |

#### Workflow (5 Steps)
1. **검증 대상 식별**: Grep으로 수치(%), 인용, 테이블 추출
2. **딥리서치 검증**: firecrawl_search, paper-search-mcp로 원본 검색
3. **원본 대조**: firecrawl_scrape, WebFetch로 직접 비교
4. **심층 분석**: sequential_thinking으로 심각도 평가
5. **보고서 생성**: verification-report.md 출력

#### Example
```
User: "ai-security-sci-2025 논문 검증해줘"
-> Step 1: sections/*.tex, references.bib 분석
-> Step 5: verification-report.md 생성
```

---

### 2. update-optimizer

**Version**: 1.0.0
**Category**: System/Maintenance
**Description**: Claude Code 업데이트 후 자동 최적화 워크플로우

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 업데이트 최적화 | optimize after update |
| 업데이트 후 | post-update, after update |
| 새 버전 | new version |
| CHANGELOG | release notes |
| 버전 업 | just updated |

#### Workflow (6 Phases)
- **Phase 0**: Resource Discovery (firecrawl_map)
- **Phase 1**: Deep Research (CHANGELOG, 핵심 문서)
- **Phase 2**: MCP Discovery (GitHub trending)
- **Phase 2.5**: Deep Improvement Thinking (sequential_thinking)
- **Phase 3**: Auto-Apply (CLAUDE.md 패치, 스킬 생성)
- **Phase 5**: Cleanup (임시 파일 정리)

#### Example
```
User: "Claude Code 업데이트 최적화해줘"
-> Phase 0-5 순차 실행
-> 업데이트 완료 보고서 생성
```

---

### 3. pdf-vision

**Version**: 1.0.0
**Category**: Vision/PDF
**Description**: PDF 문서와 이미지 분석 통합 워크플로우

#### Trigger Keywords
| Korean | English |
|--------|---------|
| PDF 분석 | analyze pdf |
| 문서 분석 | document analysis |
| 이미지 분석 | analyze image |
| OCR | extract text |
| 테이블 추출 | table extraction |
| 스크린샷 분석 | analyze screenshot |

#### Available Tools
| MCP Server | Tool | Purpose |
|------------|------|---------|
| marker-mcp | convert_pdf | PDF to Markdown |
| marker-mcp | analyze_structure | PDF 구조 분석 |
| paddleocr-mcp | ocr_image | 이미지 OCR (80+ 언어) |
| paddleocr-mcp | extract_table | 테이블 추출 |
| image-recognition | describe_image_from_file | AI 이미지 설명 |

#### Example
```
User: "이 PDF 문서 분석해줘"
-> marker-mcp.convert_pdf
-> marker-mcp.analyze_structure
-> 결과 문서화
```

---

### 4. project-init

**Version**: 1.0.0
**Category**: Project/Workspace
**Description**: 새 프로젝트 초기화 자동화 스킬

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 프로젝트 생성 | create project |
| 새 프로젝트 | new project |
| 프로젝트 초기화 | project init |

#### Project Types
| Type | Workspace | Description |
|------|-----------|-------------|
| research | research | 논문/연구 프로젝트 |
| paper | research | 논문 분석 |
| mobile-app | app-dev | 모바일 앱 |
| desktop-app | app-dev | 데스크톱 앱 |
| api | web-services | REST API |
| web | web-services | 웹 애플리케이션 |
| cli | automation | CLI 도구 |
| mcp | automation | MCP 서버 |

#### Command Format
```
/project-init --type=<type> --name=<name> [--workspace=<workspace>]
```

#### Example
```
User: "/project-init --type=research --name=ai-security-analysis"
-> workspaces/research/projects/ai-security-analysis/ 생성
```

---

### 5. bmad-agents

**Version**: 1.0.0
**Category**: Project/Workspace
**Description**: Boris Cherny BMAD Method 기반 에이전트 역할 시스템

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 분석가 모드 | analyst mode |
| 아키텍트 모드 | architect mode |
| QA 모드 | qa mode |
| 보안 모드 | developer mode |

#### Agent Roles
| Role | Stage | Purpose |
|------|-------|---------|
| Analyst | SPECIFY | 요구사항 분석, PRD 작성 |
| Architect | EXPLORE, PLAN | 아키텍처 설계, 기술 스택 선정 |
| Developer | IMPLEMENT | 코드 작성, TDD 실천 |
| QA Engineer | VERIFY | 테스트 계획, 버그 탐지 |
| Security Expert | VERIFY | 보안 취약점 분석, OWASP 검사 |

#### Commands
```
/bmad analyst   # 분석가 모드
/bmad architect # 아키텍트 모드
/bmad developer # 개발자 모드
/bmad qa        # QA 모드
/bmad security  # 보안 모드
```

---

### 6. workspace-switcher

**Version**: 1.0.0
**Category**: Project/Workspace
**Description**: 워크스페이스 전환 및 컨텍스트 관리

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 워크스페이스 | workspace |
| 작업공간 | ws |

#### Commands
| Command | Description |
|---------|-------------|
| `/workspace list` | 모든 워크스페이스 목록 |
| `/workspace <name>` | 워크스페이스 전환 |
| `/workspace status` | 현재 상태 표시 |

#### Available Workspaces
| Name | Purpose |
|------|---------|
| research | 논문/연구 |
| app-dev | 앱 개발 |
| web-services | 웹서비스/API |
| automation | 자동화/도구 |
| blog | 콘텐츠 |

#### Example
```
User: "/ws research"
-> workspaces/research/CLAUDE.md 로드
-> 프로젝트 목록 표시
```

---

### 7. cleanup-advisor

**Version**: 1.0.0
**Category**: System/Maintenance
**Description**: 폴더 정리 추천 및 디스크 공간 분석

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 정리 추천 | suggest cleanup |
| 디스크 분석 | disk analysis |
| 불필요한 파일 | cleanup |
| 폴더 정리 | folder cleanup |
| 용량 확인 | check space |

#### Safety Levels
| Level | Target | Action |
|-------|--------|--------|
| High (Safe) | *.tmp, .corrupted.*, __pycache__ | 자동 삭제 가능 |
| Medium | 완료 프로젝트, 30일+ 백업 | ARCHIVE/로 이동 |
| Low (Caution) | 설정 파일, 문서 | 검토 후 결정 |

#### Example
```
User: "폴더 정리 추천해줘"
-> Phase 1: 디스크 분석
-> Phase 2: 정리 대상 분류
-> Phase 3: 용량 회수 예측
-> Phase 4: 보고서 생성
```

---

### 8. code-analysis

**Version**: 1.0.0
**Category**: Development
**Description**: 코드베이스 심층 분석 워크플로우

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 코드 분석 | analyze code |
| 코드 리뷰 | code review |
| 버그 찾기 | find bugs |
| 구조 분석 | architecture analysis |

#### Workflow (5 Steps)
1. **Codebase Exploration**: Explore 에이전트로 구조 파악
2. **Pattern Detection**: 코드 패턴, 안티패턴 탐지
3. **Deep Analysis**: 아키텍처 일관성, SOLID 원칙, 보안 취약점 분석
4. **Report Generation**: 심각도별 이슈 보고서 생성
5. **Memory Persistence**: 발견된 패턴 kiro-memory 저장

#### Example
```
User: "이 프로젝트 코드 분석해줘"
-> Explore 에이전트 실행
-> 분석 보고서 생성
-> 패턴 메모리 저장
```

---

### 9. code-reviewer

**Version**: 1.0.0
**Category**: Development
**Description**: 코드 품질, 보안, 성능, 베스트 프랙티스 리뷰

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 코드 리뷰 | review code |
| 품질 검사 | check quality |
| 보안 리뷰 | security review |
| PR 리뷰 | PR review |
| 버그 찾기 | find bugs |

#### Review Process
1. **Scan Structure**: 파일, 의존성, 아키텍처 파악
2. **Security Check**: OWASP Top 10, Injection, 인증/인가
3. **Quality Analysis**: 복잡도, 중복, 명명 규칙, 디자인 패턴
4. **Performance Review**: N+1, 메모리 누수, 비효율 알고리즘
5. **Best Practices**: 언어 관용구, 프레임워크 규칙, 에러 처리

#### Severity Levels
| Level | Description | Action |
|-------|-------------|--------|
| CRITICAL | 보안 취약점, 데이터 손실 | 즉시 수정 필요 |
| HIGH | 버그, 로직 오류, 성능 | 머지 전 수정 |
| MEDIUM | 코드 스멜, 유지보수성 | 수정 권장 |
| LOW | 스타일, 사소한 개선 | 선택적 |

---

### 10. debugger

**Version**: 1.0.0
**Category**: Development
**Description**: 근본 원인 분석(RCA) 기반 체계적 디버깅

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 디버그 | debug |
| 에러 수정 | fix error |
| 스택 트레이스 | stack trace |
| 크래시 | crash |
| 문제 해결 | troubleshoot |

#### Debugging Process
1. **Reproduce**: 문제 이해, 에러 재현, 트리거 문서화
2. **Gather Data**: 에러 메시지, 로그, 환경 정보 수집
3. **Hypothesize**: 근본 원인 가설 수립, 가능성 순 정렬
4. **Test Hypotheses**: 체계적 검증, 이진 검색, 임시 로깅
5. **Fix**: 최소 수정 적용, 부작용 확인
6. **Prevent**: 회귀 테스트 추가, 문서화

#### Common Error Patterns
| Error | Common Cause | Investigation |
|-------|--------------|---------------|
| TypeError | null/undefined access | 데이터 흐름 추적 |
| ReferenceError | 미정의 변수 | 스코프, import 확인 |
| NetworkError | 타임아웃, CORS, 인증 | 네트워크 탭 확인 |

---

### 11. doc-researcher

**Version**: 1.0.0
**Category**: System/Maintenance
**Description**: Claude Code 및 Anthropic 공식 문서 자동 리서치

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 문서 리서치 | research docs |
| changelog 확인 | changelog |
| 공식 문서 검색 | anthropic docs |
| 새 기능 확인 | claude code documentation |

#### Primary Sources (50+)
- code.claude.com/docs (메인 문서)
- GitHub CHANGELOG.md
- anthropic.com/engineering (베스트 프랙티스)
- Context7 라이브러리 문서

#### Deep Research Tool Chain
1. **firecrawl_map**: 전체 문서 구조 파악
2. **firecrawl_search**: 버전별 변경사항 검색
3. **context7**: 코드 예제 조회
4. **WebSearch**: 커뮤니티 정보 보완
5. **sequential_thinking**: 변경사항 분석

#### Example
```
User: "Claude Code 2.1 변경사항 확인해줘"
-> firecrawl_map으로 문서 구조 파악
-> 변경사항 분석 보고서 생성
```

---

### 12. fic-research

**Version**: 1.0.0
**Category**: Academic/Research
**Description**: ACE-FCA Research Phase - 마크다운 아티팩트 기반 딥리서치

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 조사 | research |
| 리서치 | investigate |
| 분석해줘 | find out |
| 찾아봐 | - |

#### Human Leverage Score: 0.9 (Highest)
**연구 단계에서 인간 리뷰의 레버리지가 가장 높습니다.**

#### Workflow (5 Stages)
1. **Scope Definition**: Goal, Scope, Success Criteria 정의
2. **Multi-Source Search**: firecrawl, one_search, context7, paper-search 병렬 검색
3. **Content Extraction**: 상위 5개 소스 상세 추출
4. **Synthesis**: sequential_thinking으로 정보 통합
5. **Artifact Generation**: plans/[task-id]-research.md 생성

#### Context Budget: 25%

#### Output
```
plans/[task-id]-research.md
- Context (Goal, Scope, Criteria)
- Findings (Source Summary, Detailed Analysis)
- Options Analysis
- Recommendation
```

---

### 13. fic-plan

**Version**: 1.0.0
**Category**: Planning/Workflow
**Description**: ACE-FCA Plan Phase - Human Review 집중 단계

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 계획 세워줘 | plan |
| 플랜 | design |
| 설계해줘 | architect |
| 구조 잡아줘 | - |

#### Human Leverage Score: 0.8 (Critical)
**계획 단계에서 방향 수정이 구현 후 수정보다 10배 저렴합니다.**

#### Workflow (6 Stages)
1. **Research Artifact Load**: fic-research 결과 로드
2. **Architecture Decision**: 기술 스택, 패턴, 구조 결정
3. **Task Breakdown**: Shrimp Task Manager로 태스크 분해
4. **Interface Definition**: 함수, 클래스, API 사전 정의
5. **Risk Assessment**: 리스크 평가 및 완화 전략
6. **Human Review Request**: 승인 요청

#### Context Budget: 20%

#### Output
```
plans/[task-id]-plan.md
- Architecture Decision
- Task Breakdown (1-2시간 단위)
- Interface Definitions
- Risk Assessment
- Approval Required
```

---

### 14. fic-implement

**Version**: 1.0.0
**Category**: Planning/Workflow
**Description**: ACE-FCA Implement Phase - Focused Context 순차 실행

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 구현해줘 | implement |
| 코드 작성 | build |
| 만들어줘 | create |
| 개발해줘 | code |

#### Human Leverage Score: 0.3 (Lowest)
**구현 단계에서는 리뷰 효과가 가장 낮습니다.**

#### Core Principles
1. **Focused Context**: 현재 태스크만 컨텍스트에 로드
2. **Chunk Writing**: 30줄 단위로 파일 작성
3. **Immediate Verification**: 각 태스크 완료 즉시 검증
4. **Auto Rollback**: 실패 시 자동 복구

#### Prerequisites
- Plan 승인 완료 (`proceed` 명령)
- Git checkpoint 생성

#### Context Budget: 40%

#### Workflow
1. Plan Load & Validation
2. Sequential Task Execution
3. Implementation Patterns (새 파일, 수정, 테스트)
4. Verification (Acceptance Criteria)
5. Context Compaction

---

### 15. base-skill

**Version**: 1.0.0
**Category**: Template
**Description**: 스킬 생성을 위한 템플릿

#### Purpose
새 스킬을 만들 때 이 디렉토리 전체를 복사하여 사용

#### YAML Frontmatter Fields
| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | 스킬 식별자 (폴더명과 일치) |
| description | Yes | 기능 + 사용 시점 (max 1024 chars) |
| allowed-tools | No | 사용 가능한 도구 제한 |
| license | No | 라이선스 |
| metadata | No | 커스텀 key-value |

#### Creating New Skill
1. **Copy**: base-skill/ 폴더 복사
2. **Rename**: lowercase with hyphens (e.g., my-new-skill)
3. **Update**: name, description 수정
4. **Write**: 스킬별 지침 작성
5. **Examples**: 입력/출력 예제 추가
6. **Scripts**: scripts/ 폴더에 자동화 스크립트 (선택)
7. **Templates**: templates/ 폴더에 출력 템플릿 (선택)

---

### 16. mcp-health-checker

**Version**: 1.0.0
**Category**: System/Maintenance
**Description**: MCP 서버 상태 종합 검사 및 문제 진단

#### Trigger Keywords
| Korean | English |
|--------|---------|
| MCP 상태 확인 | check mcp health |
| MCP 진단 | mcp diagnostics |
| MCP 서버 점검 | mcp server status |

#### Health Check Process
1. **Status Check**: `claude.bat mcp list`로 서버 목록 조회
2. **Failure Analysis**: `--mcp-debug`로 실패 원인 분석
3. **Recommendations**: 대안 서버 제안, 최적화 권고

#### Common Failure Causes
| Cause | Symptom | Solution |
|-------|---------|----------|
| 경로 오류 | ENOENT | node.exe 경로 확인 |
| 포트 충돌 | EADDRINUSE | 포트 변경 |
| API 키 만료 | 401/403 | .env 키 갱신 |
| 의존성 누락 | MODULE_NOT_FOUND | npm install |

#### Example
```
User: "MCP 상태 확인해줘"
-> Total: 23 servers
-> Connected: 22 (95.6%)
-> Failed: 1 (zen-mcp - Python path issue)
-> Action Items 제시
```

---

### 17. multi-agent-workflow

**Version**: 1.0.0
**Category**: Planning/Workflow
**Description**: CoT + ToT + ReAct 통합 프레임워크 기반 멀티에이전트 협업

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 멀티에이전트 | multi-agent |
| 다중 에이전트 | agent collaboration |
| 협업 워크플로우 | dual llm |
| CoT 실행 | chain of thought |
| ToT 분석 | tree of thought |
| ReAct 루프 | reasoning action |
| 합의 프로토콜 | consensus protocol |

#### 5 Core Components
| Component | Purpose |
|-----------|---------|
| Dual LLM Collaboration | Claude-Gemini 병렬 처리 및 합의 |
| Stagnation Detector | 정체 감지 및 자동 에스컬레이션 |
| External Service Router | 통합 외부 서비스 라우팅 |
| Quality Gate | 3단계 품질 검증 |
| Output Handler | 5가지 출력 포맷 템플릿 |

#### 3 Reasoning Frameworks
- **CoT (Chain-of-Thought)**: 4 Chains - 순차적 단계별 추론
- **ToT (Tree-of-Thought)**: 6 Branches - 다중 분기 의사결정
- **ReAct**: 5 Cycles - 추론-행동-관찰 반복 루프

#### CLI Usage
```bash
node multi-ai-orchestration/index.js orchestrate "분석 요청"
node multi-ai-orchestration/cot-chains.js run "문제 분해"
```

---

### 18. refactorer

**Version**: 1.0.0
**Category**: Development
**Description**: 검증된 리팩토링 기법과 디자인 패턴을 사용한 코드 개선

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 리팩토링 | refactor |
| 코드 정리 | clean up |
| 코드 개선 | improve code |
| 함수 추출 | extract |
| 단순화 | simplify |

#### Refactoring Principles
1. **Small Steps**: 점진적 변경, 하나씩 리팩토링
2. **Test First**: 테스트 먼저 확인, 변경 후 테스트
3. **One Thing**: 각 리팩토링은 하나의 관심사만 다룸

#### Common Refactorings
| Refactoring | When to Use |
|-------------|-------------|
| Extract Function | 긴 함수, 반복 코드 |
| Rename | 불명확한 이름 |
| Inline | 과도한 추상화 |
| Move | 잘못된 위치 |
| Replace Temp | 복잡한 표현식 |
| Replace Conditional | 타입 스위칭 |

#### Code Smells
| Smell | Indicator | Solution |
|-------|-----------|----------|
| Long Method | >20 lines | Extract Function |
| Large Class | >200 lines | Extract Class |
| Long Parameter | >3 params | Parameter Object |
| Magic Numbers | Hardcoded | Named Constants |

---

### 19. test-writer

**Version**: 1.0.0
**Category**: Development
**Description**: 단위, 통합, E2E 테스트를 포함한 종합 테스트 생성

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 테스트 작성 | write tests |
| 단위 테스트 | unit test |
| 커버리지 | coverage |
| 목 생성 | mock |
| 테스트 추가 | test this |

#### Test Strategy
1. **Understand Code**: 함수/클래스 목적, 입출력, 부작용 분석
2. **Identify Test Cases**: Happy path, Edge cases, Error cases
3. **Structure Tests**: Arrange-Act-Assert 패턴
4. **Mock Dependencies**: 외부 서비스, DB 모킹
5. **Verify Coverage**: Line, Branch, Path coverage

#### Test Types
| Type | Scope | Speed | When to Use |
|------|-------|-------|-------------|
| Unit | Single function | Fast | Core logic |
| Integration | Components | Medium | API, DB |
| E2E | Full system | Slow | Critical paths |

#### Naming Convention
```javascript
describe('[Unit/Module Name]', () => {
  describe('[method]', () => {
    it('should [expected] when [condition]', () => {});
  });
});
```

---

### 20. documentation-writer

**Version**: 1.0.0
**Category**: Documentation
**Description**: 프로젝트 문서 자동 생성 및 유지보수

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 문서 작성 | documentation |
| README 생성 | generate docs |
| 가이드 작성 | write guide |
| API 문서 | api docs |

#### Document Types
| Type | Template | Description |
|------|----------|-------------|
| README | templates/readme.md | 프로젝트 개요 |
| API Docs | templates/api-docs.md | 엔드포인트 문서 |
| Guide | templates/guide.md | 단계별 가이드 |
| Changelog | templates/changelog.md | 버전 히스토리 |

#### Writing Process
1. **Analyze**: 코드베이스 구조 스캔
2. **Extract**: 주요 컴포넌트 및 API 식별
3. **Generate**: 문서 초안 생성
4. **Validate**: 완전성/정확성 검증
5. **Format**: CLAUDE.md 규칙 적용

#### Output Rules
- ASCII 문자만 (이모지 금지)
- 이중 언어: English + Korean
- xAI 태그 사용: [작업], [목적], [완료], [영향]

---

### 21. research-workflow

**Version**: 1.0.0
**Category**: Academic/Research
**Description**: 다중 소스 병렬 검색을 통한 종합 리서치 자동화

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 연구 | research |
| 조사 | comprehensive search |
| 분석해줘 | deep research |
| 찾아줘 | - |

#### Workflow (5 Steps)
1. **Multi-Source Search**: firecrawl_search, one_search, github_search 병렬 실행
2. **Content Extraction**: 상위 5개 URL에서 전체 콘텐츠 추출
3. **Pattern Analysis**: sequential_thinking으로 패턴 분석, 소스 비교
4. **Memory Persistence**: kiro_memory에 리서치 결과 저장
5. **Report Generation**: 종합 리서치 보고서 생성

#### Output Format
```markdown
# Research Report: [Topic]
## Executive Summary
## Key Findings (with sources)
## Comparison Table
## Recommendations
## References
```

#### Example
```
User: "AI 보안 최신 동향 연구해줘"
-> 5단계 프로세스 실행
-> 종합 보고서 반환
```

---

### 22. multi-ai-deliberation

**Version**: 1.0.0
**Category**: Planning/Workflow
**Description**: Claude-Gemini 협력적 사고 시스템. 복잡한 결정에서 두 AI가 토론하고 합의 도출

#### Trigger Keywords
| Korean | English |
|--------|---------|
| 협의해서 | deliberate |
| 같이 생각 | consensus |
| 토론 후 | with gemini |
| 합의로 | collaborative |
| gemini랑 | debate this |

#### Auto-Trigger Conditions
1. **High Complexity** (>= 0.7): 복잡한 요청 자동 감지
2. **Architecture Tasks**: 아키텍처 설계 언급
3. **Security Decisions**: 보안 관련 결정
4. **Critical Operations**: 중요 작업

#### 4-Phase Deliberative Consensus
1. **Independent Analysis**: Claude/Gemini 병렬 분석
2. **Cross Review**: 교차 검토 및 피드백
3. **Consensus Building**: 공통점 추출, 차이점 조율
4. **Tool Execution**: 합의된 계획 실행

#### Tool Domains
| Domain | Primary Owner |
|--------|--------------|
| File Operations | Claude (MCP) |
| Web Search | Gemini (Google) |
| Code Generation | Collaborative |
| Image Generation | Gemini (Nano Banana) |

#### Example
```
User: "gemini랑 같이 API 설계 좀 해줘"
-> Phase 1-4 실행
-> 합의 도달 (agreement=0.85)
-> 최종 설계안 출력
```

---


## Usage Examples

### Example 1: Academic Paper Verification
```
User: "이 논문 검증해줘"

[*] academic-paper-verifier 스킬 활성화
[작업] 검증 대상 식별 중...
-> Step 1: 수치, 인용, 테이블 추출 (15개 항목)
-> Step 2: firecrawl_search로 원본 검색
-> Step 3: 원본과 직접 비교
-> Step 4: 심각도 분석 (Critical: 2, High: 3)
-> Step 5: verification-report.md 생성

[완료] 검증 완료: 15개 중 12개 통과 (80%)
```

### Example 2: Code Review
```
User: "이 PR 리뷰해줘"

[*] code-reviewer 스킬 활성화
[작업] 보안, 품질, 성능 검사 중...
-> Security Check: OWASP Top 10 검사
-> Quality Analysis: 복잡도, 중복 탐지
-> Performance Review: N+1 문제 발견

[완료] 이슈 발견: Critical: 1, High: 2, Medium: 5
```

### Example 3: FIC Pipeline (Research -> Plan -> Implement)
```
User: "새 MCP 서버 만들어줘"

Phase 1: fic-research (Human Leverage: 0.9)
-> plans/mcp-server-research.md 생성
-> Options Analysis, Recommendation 포함

Phase 2: fic-plan (Human Leverage: 0.8)
-> plans/mcp-server-plan.md 생성
-> Architecture, Task Breakdown 포함
-> [!!] Human Review Required

User: "proceed"

Phase 3: fic-implement (Human Leverage: 0.3)
-> Sequential Task Execution
-> 30줄 청크 단위 파일 작성
-> Git commit per task

[완료] MCP 서버 구현 완료
```

### Example 4: Multi-AI Deliberation
```
User: "gemini랑 같이 아키텍처 설계해줘"

[*] multi-ai-deliberation 스킬 활성화
-> Phase 1: Claude 분석 / Gemini 병렬 분석
-> Phase 2: 교차 검토 및 피드백
-> Phase 3: 합의 도출 (agreement: 0.87)
-> Phase 4: 최종 설계안 출력

[완료] Claude + Gemini 협의 완료
```

### Example 5: Project Initialization
```
User: "/project-init --type=api --name=user-service"

[*] project-init 스킬 활성화
[작업] 프로젝트 구조 생성 중...

[+] 프로젝트 생성 완료!
    경로: workspaces/web-services/projects/user-service/
    유형: api

[*] 다음 단계:
    1. specs/spec.md 작성 (PRD)
    2. RIPER+ 워크플로우 시작
```

---

## Quick Reference: Trigger Keywords

| Skill | Primary Korean | Primary English |
|-------|---------------|-----------------|
| academic-paper-verifier | 논문 검증 | paper verification |
| update-optimizer | 업데이트 최적화 | post-update |
| pdf-vision | PDF 분석 | analyze pdf |
| project-init | 프로젝트 생성 | project init |
| bmad-agents | 분석가 모드 | analyst mode |
| workspace-switcher | 워크스페이스 | workspace |
| cleanup-advisor | 정리 추천 | suggest cleanup |
| code-analysis | 코드 분석 | analyze code |
| code-reviewer | 코드 리뷰 | review code |
| debugger | 디버그 | debug |
| doc-researcher | 문서 리서치 | research docs |
| fic-research | 리서치 | research |
| fic-plan | 계획 세워줘 | plan |
| fic-implement | 구현해줘 | implement |
| mcp-health-checker | MCP 상태 | mcp health |
| multi-agent-workflow | 멀티에이전트 | multi-agent |
| refactorer | 리팩토링 | refactor |
| test-writer | 테스트 작성 | write tests |
| documentation-writer | 문서 작성 | documentation |
| research-workflow | 연구 | research |
| multi-ai-deliberation | 협의해서 | deliberate |


---

## Creating New Skills

새 스킬을 만들려면 `base-skill` 템플릿을 복사하세요:

```bash
# 1. 템플릿 복사
cp -r .claude/skills/base-skill .claude/skills/my-new-skill

# 2. SKILL.md 수정
# - name: my-new-skill
# - description: 기능 설명
# - allowed-tools: 사용 도구
# - Trigger Keywords 정의
# - Workflow 작성
# - Examples 추가
```

### YAML Frontmatter Required Fields
```yaml
---
name: skill-name
description: |
  What it does + when to use (max 1024 chars)
allowed-tools: [Read, Write, Edit, Grep]
---
```

### Best Practices
1. **명확한 트리거**: 사용자가 자연스럽게 말할 키워드 사용
2. **구체적인 예제**: 추상적 설명보다 실제 입력/출력 예제
3. **다양한 표현 테스트**: 여러 표현으로 활성화 테스트
4. **의존성 문서화**: 필요한 MCP 서버, 파일 명시

---

**Document Version**: 2.0.0
**Generated**: 2026-02-04
**Skills Count**: 22
**Location**: K:/PortableApps/genai/documentation/guides/SKILLS-GUIDE-2026.md
