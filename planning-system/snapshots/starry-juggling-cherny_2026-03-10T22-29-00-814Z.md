# Claude Code 에코시스템 확장 플랜

> **작성일**: 2026-02-07
> **목적**: 2025년 8월 ~ 2026년 2월 최신 기능, 인기 도구, 활용법을 현재 시스템에 통합
> **상태**: 승인 대기
> **구현 범위**: 전체 (6.5시간) - 사용자 선택

## 사용자 선택 사항
- **Python-C 도구**: pybind11 (권장)
- **Agent Teams**: 활성화 (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
- **구현 범위**: 전체 Phase 1~6

---

## 1. 리서치 요약

### 1.1 수집된 정보 소스
- [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code) (Skills, Hooks, Plugins)
- [바이브 코딩 베스트 프랙티스](https://www.softr.io/blog/vibe-coding-best-practices)
- [AGENTS.md 가이드](https://www.builder.io/blog/agents-md)
- [HackerNews 토론](https://news.ycombinator.com/item?id=46743908) (Swarms, 활용 사례)

### 1.2 핵심 발견 사항

| 영역 | 현재 상태 | GAP |
|------|----------|-----|
| **버전 추적** | v2.1.29까지 | v2.1.30~v2.1.34 누락 |
| **Agent Teams** | 미구현 | TeammateTool, Swarm 패턴 필요 |
| **바이브 코딩** | 미문서화 | 워크플로우 가이드 필요 |
| **AGENTS.md** | 미사용 | 계층적 에이전트 규칙 표준화 필요 |
| **Python-C 통합** | 없음 | pybind11/Cython 스킬 추가 필요 |

---

## 2. 추가할 기능 (v2.1.30 ~ v2.1.34)

### 2.1 Agent Teams (v2.1.32~v2.1.34) - CRITICAL

```yaml
# 환경변수 활성화
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 새 훅 이벤트
- TeammateIdle: 팀원 에이전트 유휴 시
- TaskCompleted: 태스크 완료 시

# 새 frontmatter 필드
memory: user|project|local  # 영속 메모리 범위
```

**적용 파일**: `.claude/rules/new-features-v2.md`

### 2.2 PDF 읽기 개선 (v2.1.31)

```
Read(file_path="doc.pdf", pages="1-5")  # 특정 페이지만 읽기
# 10페이지 초과 PDF는 lightweight reference로 자동 전환
```

### 2.3 새 CLI 플래그 & 명령어

| 플래그/명령어 | 용도 |
|--------------|------|
| `/debug` | 세션 트러블슈팅 |
| `--from-pr` | PR 연결 세션 재개 |
| `--init`, `--maintenance` | Setup 훅 트리거 |
| `spinnerVerbs` 설정 | 스피너 동사 커스터마이징 |

---

## 3. 바이브 코딩 워크플로우 통합

### 3.1 핵심 원칙 (Chain of Thought)

```
[바이브 코딩 4단계]
1. SPECIFY → PRD/요구사항 명확화 (AI 인터뷰 활용)
2. ITERATE → 작은 단위로 분해, 순차 구현
3. VALIDATE → 모든 변경 테스트 (AI 출력 맹신 금지)
4. DOCUMENT → 프롬프트 로그 유지
```

### 3.2 새 스킬 생성

```
.claude/skills/vibe-coding/
├── SKILL.md           # 바이브 코딩 워크플로우
├── prompts/
│   ├── interview.md   # AI 인터뷰 프롬프트
│   ├── iterate.md     # 반복 개선 프롬프트
│   └── validate.md    # 검증 프롬프트
```

**참조**: [Softr 가이드](https://www.softr.io/blog/vibe-coding-best-practices)

---

## 4. AGENTS.md 표준 도입

### 4.1 파일 구조

```
프로젝트_루트/
├── AGENTS.md              # 전역 에이전트 규칙
├── src/
│   └── AGENTS.md          # src 디렉토리 특화 규칙
├── tests/
│   └── AGENTS.md          # 테스트 특화 규칙
└── .claude/
    └── agents/            # 커스텀 에이전트 정의
```

### 4.2 AGENTS.md 템플릿

```markdown
# Project Agents Configuration

## Code Style
- Use TypeScript strict mode
- Prefer functional components
- 4-space indentation

## Testing Requirements
- Write unit tests for all public functions
- Minimum 80% coverage

## Prohibited
- NO any types
- NO console.log in production code
```

**효과**: 디렉토리별 맥락 인식, AI 일관성 향상

---

## 5. 인기 GitHub 도구 통합

### 5.1 필수 통합 대상

| 레포지토리 | Stars | 용도 |
|-----------|-------|------|
| [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | 342+ | Skills, Hooks, Plugins 큐레이션 |
| [claude-code-plugins-plus-skills](https://github.com/jeremylongshore/claude-code-plugins-plus-skills) | - | 270+ 플러그인, 739 스킬 |
| [awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | - | 100+ 전문 서브에이전트 |
| [claude-code-showcase](https://github.com/ChrisWiles/claude-code-showcase) | - | 종합 설정 예제 |

### 5.2 추천 플러그인

```
[필수 설치]
1. ralph-wiggum → 반복적 자기개선 루프
2. hookify → 마크다운 기반 규칙 강제
3. firecrawl plugin → 웹 데이터 추출
4. context7 → 최신 API 문서 참조
```

---

## 6. Python-C 통합 스킬

### 6.1 선택된 도구: pybind11 (사용자 선택)

```
[pybind11 핵심 특징]
- C++11 모던 문법
- 헤더 전용 (설치 간단)
- 객체 지향에 적합
- NumPy 배열 지원 (py::array)

[보조 도구]
- ctypes: 간단한 C 호출 시 폴백
- CFFI: PyPy 필요 시
```

### 6.2 새 스킬/에이전트

```
.claude/skills/python-c-binding/
├── SKILL.md              # pybind11 중심 워크플로우
├── templates/
│   ├── pybind11-module.md   # 기본 모듈 템플릿
│   ├── pybind11-numpy.md    # NumPy 연동
│   └── CMakeLists-example.md # CMake 빌드

.claude/agents/native-binding-expert.md
```

---

## 7. CoT/ToT 사고 프레임워크 강화

### 7.1 현재 도구 활용

```
[복잡한 문제 해결 파이프라인]
1. ultrathink 모드 활성화 (Alt+T)
2. sequential_thinking MCP 호출
3. 필요시 Tree of Thought 분기 탐색
4. 결정 후 Plan Mode 진입
```

### 7.2 통합 워크플로우

```yaml
# .claude/skills/deep-reasoning/SKILL.md
트리거: "깊이 생각", "think deeply", "분석해줘"
도구체인:
  1. sequential_thinking → 단계별 분석
  2. llm-council/deliberate → 다중 관점 검토
  3. Task(Plan) → 계획 수립
```

---

## 8. 구현 태스크

### Phase 1: 문서 업데이트 (1시간)
- [ ] `new-features-v2.md` → v2.1.34까지 업데이트
- [ ] Agent Teams 섹션 추가
- [ ] PDF pages 파라미터 문서화

### Phase 2: 바이브 코딩 스킬 (2시간)
- [ ] `.claude/skills/vibe-coding/SKILL.md` 생성
- [ ] 프롬프트 템플릿 작성
- [ ] CLAUDE.md에 트리거 키워드 등록

### Phase 3: AGENTS.md 표준화 (1시간)
- [ ] 루트 `AGENTS.md` 템플릿 생성
- [ ] 워크스페이스별 예제 작성
- [ ] 문서화 (`documentation/guides/agents-md-guide.md`)

### Phase 4: Python-C 스킬 (1.5시간)
- [ ] `.claude/skills/python-c-binding/SKILL.md` 생성
- [ ] `.claude/agents/native-binding-expert.md` 생성
- [ ] 예제 템플릿 작성

### Phase 5: 인기 플러그인 참조 (30분)
- [ ] `documentation/guides/recommended-plugins.md` 작성
- [ ] CLAUDE.md에 참조 추가

### Phase 6: 검증 (30분)
- [ ] 새 스킬 테스트
- [ ] 문서 정합성 확인
- [ ] Git 커밋

---

## 9. 예상 결과물

```
변경/생성 파일:
├── .claude/rules/new-features-v2.md (수정)
├── .claude/skills/vibe-coding/SKILL.md (신규)
├── .claude/skills/python-c-binding/SKILL.md (신규)
├── .claude/agents/native-binding-expert.md (신규)
├── AGENTS.md (신규 - 프로젝트 루트)
├── documentation/guides/
│   ├── vibe-coding-workflow.md (신규)
│   ├── agents-md-guide.md (신규)
│   ├── recommended-plugins.md (신규)
│   └── python-c-integration.md (신규)
└── CLAUDE.md (수정 - 트리거 키워드 추가)
```

---

## 10. 참조 소스

- [Claude Code Docs](https://code.claude.com/docs)
- [바이브 코딩 Wikipedia](https://en.wikipedia.org/wiki/Vibe_coding)
- [AGENTS.md 가이드](https://www.builder.io/blog/agents-md)
- [pybind11 문서](https://pybind11.readthedocs.io/)
- [HackerNews Claude Code 토론](https://news.ycombinator.com/item?id=46743908)
- [Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)

---

**총 예상 시간**: 6.5시간
**우선순위**: Phase 1 > Phase 2 > Phase 4 > Phase 3 > Phase 5 > Phase 6
