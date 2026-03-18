# Workspace Structure (워크스페이스 계층 구조)

## 개요
**목적별 워크스페이스 분리**를 통한 효율적인 대규모 프로젝트 관리

---

## 3-Tier 계층 구조

```
K:/PortableApps/genai/
├── CLAUDE.md                    # [L0] 글로벌 공통
├── .claude/
│   ├── rules/                   # 공통 규칙
│   ├── skills/                  # 공통 스킬
│   └── agents/                  # 공통 에이전트
│
├── workspaces/                  # [L1] 목적별 워크스페이스
│   ├── research/                # 논문/연구
│   ├── app-dev/                 # 앱 개발
│   ├── web-services/            # 웹서비스
│   └── automation/              # 자동화/도구
│
└── projects/                    # [L2] 개별 프로젝트 (선택적)
```

---

## CLAUDE.md 상속 체계

| 레벨 | 위치 | 내용 | 상속 |
|------|------|------|------|
| **L0** | 루트 CLAUDE.md | Claude Code 최적화, 공통 도구 규칙 | 모든 하위에 적용 |
| **L1** | workspaces/*/CLAUDE.md | 목적별 규칙 (연구/앱/웹) | 해당 워크스페이스 내 |
| **L2** | projects/*/CLAUDE.md | 프로젝트 특화 규칙 | 해당 프로젝트만 |

---

## 워크스페이스별 특화 규칙

### research/ (논문/연구)
- 학술 검증 워크플로우 자동 활성화
- citation 검증, 데이터 무결성 체크
- paper-search-mcp 우선 사용

### app-dev/ (앱 개발)
- 모바일/데스크톱 앱 개발 규칙
- 빌드/테스트 자동화
- UI/UX 가이드라인 준수

### web-services/ (웹서비스)
- API 설계 규칙 (REST/GraphQL)
- 보안 체크리스트 자동 적용
- 성능 모니터링 통합

### automation/ (자동화/도구)
- CLI 도구 개발 규칙
- 스크립트 표준화
- MCP 서버 개발 가이드


---

## 워크스페이스 이동/진입

### CLI 명령어 (제안)
```bash
# 워크스페이스 진입
cd K:/PortableApps/genai/workspaces/research
claude

# 특정 프로젝트 진입
cd K:/PortableApps/genai/workspaces/app-dev/projects/my-app
claude
```

### 자동 감지
Claude Code가 현재 디렉토리 기반으로:
1. L0 규칙 로드 (항상)
2. L1 규칙 로드 (워크스페이스 내일 경우)
3. L2 규칙 로드 (프로젝트 내일 경우)

---

## 프로젝트 구조 표준

```
[project-name]/
├── CLAUDE.md            # 프로젝트 전용 규칙
├── specs/               # PRD/요구사항
│   ├── spec.md          # 메인 스펙
│   ├── plan.md          # 구현 계획
│   └── tasks.md         # 실행 태스크
├── plans/               # 구현 계획 (상세)
├── src/                 # 소스 코드
├── tests/               # 테스트
└── docs/                # 문서
```

---

**버전**: 1.0.0
**작성일**: 2026-02-03
