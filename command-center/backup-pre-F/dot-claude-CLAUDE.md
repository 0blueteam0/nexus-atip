# SuperClaude Framework Configuration

## [SKILL] 논문 작업 파이프라인 스킬 (7종 + 1 에이전트)

### academic-paper-verifier v2.0.0 (학술 논문 검증)
- **트리거**: "논문 검증", "학술 검증", "인용 확인", "데이터 검증", "통계 검증"
- **위치**: `.claude/skills/academic-paper-verifier/SKILL.md`
- **v2.0 추가**: 매핑 점수 교차검증, 법률 조항 검증, 병렬 에이전트 4종

### paper-build (논문 빌드)
- **트리거**: "DOCX 생성", "PDF 변환", "논문 빌드", "paper build"
- **위치**: `.claude/skills/paper-build/SKILL.md`
- **스크립트**: `scripts/build_docx_template.py` (1368줄), `scripts/convert_to_pdf.py`

### chart-builder (차트 빌더)
- **트리거**: "차트 생성", "그래프", "figure", "chart build", "흑백 차트"
- **위치**: `.claude/skills/chart-builder/SKILL.md`
- **스크립트**: `scripts/chart_template.py` (489줄), `scripts/chart_bw_template.py` (270줄)

### reviewer-response (심사의견 대응)
- **트리거**: "심사의견", "리뷰어", "수정", "reviewer", "revision", "심사 반영"
- **위치**: `.claude/skills/reviewer-response/SKILL.md`
- **템플릿**: `templates/revision-plan.md`, `templates/response-letter.md`

### submission-prep (투고 준비)
- **트리거**: "투고", "제출", "submission", "투고 준비", "제출 패키지"
- **위치**: `.claude/skills/submission-prep/SKILL.md`
- **템플릿**: `templates/submission-email-kr.md`, `templates/checklist.md`

### governance-mapper (거버넌스 매핑)
- **트리거**: "거버넌스 매핑", "governance mapping", "매핑 DB", "3축 매핑", "갭 분석", "gap analysis", "보충자료 빌드"
- **위치**: `.claude/skills/governance-mapper/SKILL.md`
- **스크립트**: `governance_mapper.py` (CLI), `build_supplementary_docx_v2.py` (DOCX)

### ai-industry-law-journal (인공지능산업법학회 학술지 패키지)
- **트리거**: "인공지능산업법학회", "산업법학회", "AI산업법학회", "산업법학회 학술지"
- **위치**: `.claude/skills/ai-industry-law-journal/SKILL.md`
- **역할**: 기존 6종 스킬 + 1 에이전트를 하나의 패키지로 그룹핑 (진입점)

### paper-pipeline (에이전트)
- **트리거**: "논문 파이프라인", "전체 빌드", "paper pipeline"
- **위치**: `.claude/agents/paper-pipeline.md`
- **모드**: full / verify-only / build-only / revision / submit / governance

---

## 🚀 SuperClaude v4.0.8 - K드라이브 설치

### 설치 정보
- **설치 경로**: K:/PortableApps/genai/superclaude
- **프레임워크 버전**: 4.0.8
- **설치 날짜**: 2025-09-02

### 주요 기능
- 19개 특수 명령어 (/sc: prefix)
- 9개 AI 페르소나 (전문가 역할)
- 6개 MCP 서버 통합

### 명령어 목록
- `/sc:build` - 프로젝트 빌드
- `/sc:analyze` - 코드 분석
- `/sc:secure` - 보안 검사
- `/sc:optimize` - 성능 최적화

### AI 페르소나
- System Architect
- Frontend Expert
- Backend Expert
- Security Expert
- Code Analyst

---

## [FIC] Frequent Intentional Compaction (ACE-FCA 기반)
**컨텍스트 40-60% 활용률 유지를 위한 전략적 압축**

### 자동 트리거
- 컨텍스트 60% 초과 시 자동 compaction
- 단계 전환 시 이전 단계 정보 압축

### Compaction 대상
| # | 대상 | 압축 방법 |
|---|------|----------|
| 1 | 파일 검색 결과 | 경로만 유지 (상위 20개) |
| 2 | 코드 흐름 | 핵심 함수 시그니처만 유지 |
| 3 | 편집 기록 | 최종 상태만 유지 (최근 5개) |
| 4 | 테스트 로그 | 실패/경고만 유지 |
| 5 | JSON blob | 스키마만 추출 |

### 4-Stage Pipeline
```
Specify → Explore → Plan → Implement
```
1. **Specify**: 요구사항 명확화 (Goal, Scope, Success Criteria)
2. **Explore**: Sub-agent 컨텍스트 격리 탐색
3. **Plan**: Human Review (레버리지 0.8)
4. **Implement**: Focused Context 순차 실행

### Human Leverage 원칙
| 단계 | Leverage | 설명 |
|------|----------|------|
| Research | 0.9 | 최고 레버리지 - 방향 결정 |
| Plan | 0.8 | 높음 - 아키텍처 결정 |
| Implement | 0.3 | 낮음 - 코드 리뷰 |

### FIC Skills
| 스킬 | 트리거 | Context Budget |
|------|--------|----------------|
| fic-research | 조사, 리서치, research | 25% |
| fic-plan | 계획, 플랜, plan | 20% |
| fic-implement | 구현, 만들어줘, implement | 40% |

### Sub-agent 컨텍스트 격리
| 프로필 | 용도 | Budget |
|--------|------|--------|
| file_explorer | 파일 검색 | 15% |
| code_analyzer | 코드 분석 | 20% |
| reference_lookup | 외부 참조 검색 | 15% |
| test_runner | 테스트 실행 | 10% |
| research_agent | 딥 리서치 | 25% |

### 관련 파일
- `atos/fic-manager.js` - FIC 코어 로직
- `atos/pipeline-manager.js` - 4-Stage 파이프라인
- `atos/subagent-config.js` - Sub-agent 프로필
- `.claude/skills/fic-*/SKILL.md` - FIC 스킬 3종

---

## [STL] Self-Triggered Loading (자동 트리거 로딩)
**키워드 감지 -> 리소스 자동 로드 (세션 내 중복 방지)**

### 작동 원리
1. **입력 분석**: 사용자/Claude 출력에서 키워드 감지
2. **중복 확인**: LoadTracker로 세션 내 이미 로드된 리소스 스킵
3. **자동 로드**: 매칭된 리소스 자동 로드 (스킬, 명령어, 워크플로우)

### 구성 요소
| 파일 | 역할 |
|------|------|
| `atos/load-tracker.js` | 세션 내 중복 로드 방지 (Singleton) |
| `atos/unified-triggers.json` | 키워드 -> 리소스 매핑 정의 |
| `atos/context-analyzer.js` | analyzeAnyText() STL 핵심 함수 |

### 트리거 소스
| 소스 | 설명 |
|------|------|
| `user` | 사용자 입력 |
| `claude_plan` | Claude 계획 출력 |
| `claude_impl` | Claude 구현 출력 |
| `file` | 파일 내용 분석 |

### LoadTracker API
```javascript
const { tracker } = require('./atos/load-tracker');

tracker.isLoaded('skill:update-optimizer');  // 이미 로드 여부
tracker.markLoaded('skill:update-optimizer', 'skill', 'user');  // 로드 마킹
tracker.getSessionStats();  // 세션 통계
tracker.reset();  // 세션 리셋
```

### 관련 파일
- `atos/load-tracker.js` - LoadTracker 코어
- `atos/context-analyzer.js` - STL 통합 분석기
- `.claude-update-system/agentic-learning.js` - 에이전틱 자기학습

### Self-Trigger Pipeline (2025-12-25 추가)
**Claude 자체 출력에서 키워드 감지 -> 리소스 자동 로드**

| 구성요소 | 설명 |
|----------|------|
| `atos/self-trigger/index.js` | 오케스트레이터 |
| `atos/self-trigger/loop-guard.js` | 3-Layer 무한루프 방지 |
| `atos/self-trigger/phase-detector.js` | Plan/Implement/Execute 페이즈 감지 |
| `atos/self-trigger/trigger-profiles.json` | 페이즈별 트리거 프로필 |

**CLI**: `node atos/index.js self-trigger "검색해보겠습니다"` 
**규칙**: `.claude/rules/self-trigger.md`
