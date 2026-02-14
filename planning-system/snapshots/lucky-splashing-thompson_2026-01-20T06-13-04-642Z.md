# AI 코딩 도구 딥리서치 - OpenCode, Vibe, Kanban 생태계 분석

**연구 목적**: K드라이브 Claude Code 포터블 환경에 통합/보완 가능한 AI 코딩 도구 발굴
**연구 방법**: GitHub 검색 + ultrathink 확장 사고 모드
**연구 일자**: 2026-01-13

---

## 발견된 저장소 (21+ repositories)

### Category 1: OpenCode 생태계

| Repository | Stars | 설명 | K드라이브 적합성 |
|------------|-------|------|-----------------|
| **marhsjbdn/opencode** | 주요 | 오픈소스 터미널 AI 코딩 어시스턴트 | [+] 높음 |
| kedbin/opencode-skills | - | 스킬 확장 시스템 | [+] 참고 가능 |
| Nolikzero/claude-terminal-panel | - | Claude 터미널 패널 | [+] 통합 가능 |
| dpshade/raycast-opencode | - | Raycast 연동 | [-] macOS 전용 |

### Category 2: Vibe Coding (氛围编程)

| Repository | Stars | 설명 | K드라이브 적합성 |
|------------|-------|------|-----------------|
| **R1SH4BH81/vibe-Coder** | - | 자연어 기반 코드 생성 | [+] 컨셉 참고 |
| JamesTheGiblet/VibeCode-AI-Assisted | - | AI 보조 Vibe 코딩 | [+] 참고 |
| lassestilvang/vibe-sdk | - | Vibe SDK | [?] 평가 필요 |

### Category 3: Terminal Kanban

| Repository | Stars | 설명 | K드라이브 적합성 |
|------------|-------|------|-----------------|
| **happytaoer/cli_kanban** | - | Go + Bubble Tea + SQLite CLI 칸반 | [++] 매우 높음 |

### Category 4: MCP 서버 (Claude Code 확장)

| Repository | Stars | 설명 | K드라이브 적합성 |
|------------|-------|------|-----------------|
| **emiryasar/mcp_code_analyzer** | 172+ | 코드 분석 MCP 서버 | [++] 즉시 추가 |
| **VetCoders/mcp-server-semgrep** | - | Semgrep 보안 분석 MCP | [++] 보안 강화 |
| adstastic/claude-code-whatsapp-approval | - | WhatsApp 승인 연동 | [+] 모바일 승인 |
| sadiuysal/crawl4ai-mcp-server | - | Crawl4AI MCP 서버 | [+] 기존 보완 |

### Category 5: Multi-Agent 오케스트레이션

| Repository | Stars | 설명 | K드라이브 적합성 |
|------------|-------|------|-----------------|
| **joewinke/jat** | - | "World's First Agentic IDE" 비주얼 대시보드 | [++] 핵심 참고 |
| **realonecan/Multi-Agent-Orchestrator-TMAO** | - | 터미널 멀티에이전트 오케스트레이터 | [++] ATOS 강화 |
| eagurin/code-claude-squad | - | Claude 에이전트 팀 | [+] 참고 |
| izll/agent-session-manager | - | 에이전트 세션 관리 | [+] 세션 연속성 |

### Category 6: 설정/프록시 도구

| Repository | Stars | 설명 | K드라이브 적합성 |
|------------|-------|------|-----------------|
| **erans/lunaroute** | - | AI 코딩 어시스턴트 로컬 프록시 (세션 녹화/재생) | [++] 핵심 도구 |
| neiii/bridle | - | 설정 관리 | [+] 참고 |
| hosenur/portal | - | 포털 시스템 | [?] 평가 필요 |

### Category 7: 가이드/문서

| Repository | Stars | 설명 |
|------------|-------|------|
| wesammustafa/Claude-Code-Everything-You-Need-to-Know | - | Claude Code 종합 가이드 |

---

## 통합 우선순위 매트릭스

### Tier 1: 즉시 추가 권장 (1-2주)

| 도구 | 이유 | 작업량 |
|------|------|--------|
| **mcp_code_analyzer** | 172+ stars, 코드 분석 강화, MCP 표준 | 낮음 |
| **mcp-server-semgrep** | 보안 분석 자동화, OWASP 대응 | 낮음 |
| **cli_kanban** | Go 바이너리, SQLite 포터블, Shrimp 보완 | 낮음 |

### Tier 2: 단기 통합 (1개월)

| 도구 | 이유 | 작업량 |
|------|------|--------|
| **lunaroute** | 세션 녹화/재생, 디버깅 강화, LLM 프록시 | 중간 |
| **TMAO** | ATOS 시스템 강화, 멀티에이전트 패턴 | 중간 |
| **jat (Agentic IDE)** | 비주얼 대시보드 컨셉, 20+ 에이전트 관리 | 중간 |

### Tier 3: 장기 연구 (2-3개월)

| 도구 | 이유 | 작업량 |
|------|------|--------|
| **OpenCode** | 대안 터미널 AI 어시스턴트 분석 | 높음 |
| **Vibe Coding 컨셉** | 자연어 우선 개발 방법론 | 연구 |

---

## 추천 실행 계획

### Phase 1: MCP 서버 추가 (즉시)
```bash
# 1. mcp_code_analyzer 설치
git clone https://github.com/emiryasar/mcp_code_analyzer
# .claude.json에 MCP 서버 등록

# 2. mcp-server-semgrep 설치
git clone https://github.com/VetCoders/mcp-server-semgrep
# 보안 분석 도구 체인에 추가
```

### Phase 2: CLI Kanban 통합
```bash
# Go 바이너리 빌드/다운로드
# K:/PortableApps/tools/kanban/ 설치
# Shrimp Task Manager와 연동 검토
```

### Phase 3: LunaRoute 프록시 설정
```bash
# 로컬 프록시 설치
# 세션 녹화/재생 기능 활성화
# 디버깅 워크플로우 개선
```

### Phase 4: Multi-Agent 대시보드 연구
- JAT (Agentic IDE) 아키텍처 분석
- TMAO 패턴을 ATOS에 통합
- 비주얼 모니터링 대시보드 프로토타입

---

## 핵심 발견 요약

| 카테고리 | 핵심 발견 | 영향 |
|----------|----------|------|
| **OpenCode** | Claude Code 대안 존재, 스킬 시스템 유사 | 경쟁 분석 |
| **Vibe Coding** | 자연어 우선 개발 트렌드 | 방법론 참고 |
| **CLI Kanban** | 포터블 작업 관리 가능 | Shrimp 보완 |
| **MCP 서버** | 코드 분석/보안 분석 도구 발견 | 즉시 통합 |
| **Multi-Agent** | JAT/TMAO 등 고급 오케스트레이션 | ATOS 강화 |
| **LunaRoute** | 세션 녹화/재생, LLM 프록시 | 디버깅 혁신 |

---

## K드라이브 포터블 환경 고려사항

| 요소 | 권장 사항 |
|------|----------|
| **설치 경로** | K:/PortableApps/tools/[도구명]/ |
| **데이터 저장** | SQLite 기반 도구 우선 (포터블 친화) |
| **의존성** | Go 바이너리, Node.js 패키지 선호 |
| **Docker** | 선택적 (이미 firecrawl/searxng 사용 중) |

---

---

## [CRITICAL] 안전 프로토콜 (Safety Protocol)

### 사용자 필수 요구사항 (2026-01-13 추가)
**"모든 추가/삭제/수정은 기존 시스템 탐색 후, 연결성 유지, 백업 필수, 사용자 허용 필수"**

| # | 원칙 | 설명 |
|---|------|------|
| 1 | **사전 탐색 필수** | 기존 시스템, 도구, 연결성 모두 파악 후 작업 |
| 2 | **연결성 보존** | 기능/도구/시스템 간 연결 모두 유지 |
| 3 | **백업 필수** | 변경 전 .backup 파일 생성 |
| 4 | **사용자 승인 필수** | 삭제/수정 전 명시적 승인 대기 |

### 작업 전 체크리스트
```
[ ] 기존 MCP 서버 목록 확인 (32+ 서버)
[ ] ATOS 시스템 연결 확인 (STL, FIC, Bootstrap)
[ ] 스킬/커맨드 레지스트리 확인 (21 스킬, 40 커맨드)
[ ] 훅 시스템 확인 (10 훅)
[ ] 백업 파일 생성 완료
[ ] 사용자 승인 획득
```

---

## [NEW] Vibe Kanban 통합 계획 (추가 발견)

### GitHub 검색 결과 (131 repositories)
| Repository | 유형 | K드라이브 적합성 | 우선순위 |
|------------|------|-----------------|----------|
| **shahriarb/vibekanban** | MCP Server | [+++] 최적 | #1 |
| **irukasano/vibe-kanban-cli** | CLI Tool | [++] 높음 | #2 |
| farsroidx/vibe-kanban | 웹 앱 | [+] 참고 | #3 |

### 최적 후보: shahriarb/vibekanban
- **유형**: MCP Server (Claude Code 네이티브 통합)
- **장점**:
  - MCP 표준 준수 (기존 32개 서버와 동일 패턴)
  - 칸반 보드 기능 (Shrimp Task Manager 보완)
  - 바로 .claude.json에 추가 가능
- **설치 경로**: K:/PortableApps/genai/mcp-servers/vibekanban/

### CLI 대안: irukasano/vibe-kanban-cli
- **유형**: CLI Tool (독립 실행)
- **장점**:
  - Go/Rust 바이너리 (포터블)
  - 터미널 기반 칸반
- **설치 경로**: K:/PortableApps/tools/vibe-kanban/

---

## 사전 탐색 결과 요약 (Explore 완료)

### K드라이브 기존 시스템 현황
| 카테고리 | 수량 | 핵심 구성요소 |
|----------|------|--------------|
| **MCP 서버** | 32+ | desktop-commander, shrimp-task, firecrawl, github, kiro-memory |
| **ATOS 시스템** | 1 | STL (Self-Triggered Loading), FIC, Bootstrap Loader |
| **스킬** | 21 | academic-paper-verifier, update-optimizer, fic-* 3종 |
| **커맨드** | 40 | core/ 10개, library/ 30개 |
| **훅** | 10 | session-restore, session-persist 등 |

### 시스템 연결 맵
```
User Input → STL (키워드 감지) → LoadTracker → 리소스 로드
    ↓
ATOS Orchestrator → Tool Registry → MCP 서버 선택
    ↓
Desktop Commander (P1) → Edit File Lines (P2) → Built-in (P4)
    ↓
Shrimp Task Manager (P3) ← [새로운 연결: vibekanban MCP]
```

---

## 수정된 실행 계획 (Safety First)

### Phase 0: 백업 생성 (필수)
```bash
# 1. .claude.json 백업
cp K:/PortableApps/genai/.claude.json K:/PortableApps/genai/.claude.json.backup-$(date +%Y%m%d)

# 2. MCP 서버 목록 스냅샷
dir K:/PortableApps/genai/mcp-servers/ > mcp-snapshot.txt
```

### Phase 1: Vibe Kanban MCP 추가 (사용자 승인 후)
```bash
# shahriarb/vibekanban 클론
cd K:/PortableApps/genai/mcp-servers/
git clone https://github.com/shahriarb/vibekanban

# .claude.json에 MCP 서버 등록 (수동 검토 후)
```

### Phase 2: 기존 MCP 서버 추가 (기존 계획 유지)
- mcp_code_analyzer (코드 분석)
- mcp-server-semgrep (보안 분석)
- cli_kanban (Go 기반 대안)

### Phase 3: 연결성 검증 [COMPLETE 2026-01-14]
```
[x] Shrimp Task Manager ↔ vibekanban 연동 테스트 - 4개 MCP 도구 정상 작동
[x] ATOS 도구 레지스트리에 새 도구 등록 - tool-registry.json 업데이트
[x] STL 트리거 매핑 추가 (키워드: "칸반", "kanban", "보드") - unified-triggers.json
```

---

버전: 3.0.0
연구 완료일: 2026-01-13
연구 방법: GitHub Deep Research + ultrathink
업데이트: 안전 프로토콜 + Vibe Kanban 통합 계획 추가
이전 버전: 2.0.0 (기본 딥리서치)
