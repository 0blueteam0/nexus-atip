# K드라이브 시스템 정리 및 워크스페이스 통합 플랜

## 메타 정보
- **플랜 ID**: compiled-crafting-whisper
- **버전**: 2.0.0
- **작성일**: 2026-02-03
- **이전 플랜**: v1.0.0 (Production Workflow Framework) → 구현 완료, 아카이빙

---

## 이전 플랜 아카이빙

### v1.0.0 요약 (구현 완료)
- **목표**: 목적별 워크스페이스 분리 + RIPER+ 워크플로우
- **상태**: 100% 구현 완료 (2026-02-03)
- **산출물**:
  - workspaces/ 5개 워크스페이스 (research, app-dev, web-services, automation, blog)
  - .claude/rules/ 3개 신규 규칙
  - .claude/skills/ 2개 신규 스킬
  - .claude/templates/ 7개 템플릿
  - .claude/agents/parallel-workflow.md
- **아카이브**: plans/archived/compiled-crafting-whisper-v1.0.0.md

---

# 신규 플랜: K드라이브 시스템 정리 및 통합

## 개요
**목표**: 기존 콘텐츠 정리 + 시스템 연결성 보존 + 워크스페이스 통합 + 고도화 제안

---

## Phase 0: 사전 백업 및 아카이빙 (CRITICAL)

### 0.1 필수 백업 항목
```
backups/2026-02-03-reorganization/
├── planning-system/          # 플래닝 시스템 전체
├── unified-task-system/      # 통합 태스크 시스템
├── atos/                     # ATOS 시스템
├── .claude-hooks.json        # 훅 설정
├── .claude.json              # MCP 설정
└── CLAUDE.md                 # 마스터 설정
```

### 0.2 플랜 아카이빙
```bash
# 이전 플랜 아카이브
cp plans/compiled-crafting-whisper.md plans/archived/compiled-crafting-whisper-v1.0.0.md
```

---

## Phase 1: 현황 분석 결과 (탐색 완료)

### 1.1 루트 디렉토리 현황 (78개 폴더)

| 카테고리 | 폴더 수 | 대표 폴더 |
|----------|---------|----------|
| **핵심 시스템** | 8 | .claude/, planning-system/, unified-task-system/, atos/, ShrimpData/ |
| **MCP 서버** | 15 | mcp-servers/, desktop-commander-mcp/, ollama/ |
| **문서** | 5 | documentation/, plans/, examples/, workflows/ |
| **콘텐츠 (이동 대상)** | 12 | papers/, 1211_논문분석/, security-hub/, 요청작업/ |
| **백업/임시** | 8 | backups/, cache/, temp/, debug/, shell-snapshots/ |
| **앱/서비스** | 10 | vite-app/, dashboard/, runpod/, multi-ai-orchestration/ |
| **설정/데이터** | 20 | data/, bin/, plugins/ 등 |

### 1.2 시스템 연결성 분석 (CRITICAL)

#### 하드코딩된 경로 참조 (50-70개)
| 파일 | 참조 수 | 위험도 |
|------|---------|--------|
| `.claude-hooks.json` | 14개 절대 경로 | HIGH |
| `.claude.json` | 30+개 MCP 서버 경로 | HIGH |
| `planning-system/*.js` | 10개 상대/절대 경로 | MEDIUM |
| `atos/*.js` | 8개 상대 경로 | MEDIUM |
| `unified-task-system/*.js` | 6개 상대 경로 | MEDIUM |

#### 절대 이동 금지 폴더 (5개 핵심 서브시스템)
```
[!] 이동 금지 - 시스템 연결성 파괴 위험
├── .claude/           # Claude Code 핵심 설정
├── planning-system/   # 플래닝 시스템 (hooks 연결)
├── unified-task-system/ # 작업 관리 (hooks 연결)
├── atos/              # 도구 오케스트레이션
└── ShrimpData/        # Shrimp Task Manager 데이터
```

### 1.3 이동 가능 콘텐츠 분류

#### 연구/논문 (→ workspaces/research/projects/)
```
papers/                    # 논문 PDF/분석
1211_논문분석/             # 특정 논문 분석
ai-security-*.pdf/html     # AI 보안 보고서
```

#### 앱 개발 (→ workspaces/app-dev/projects/)
```
vite-app/                  # Vite 기반 앱
dashboard/                 # 대시보드 앱
```

#### 웹서비스 (→ workspaces/web-services/projects/)
```
mcp-servers/               # MCP 서버들 (또는 별도 유지)
multi-ai-orchestration/    # AI 오케스트레이션
```

#### 블로그/콘텐츠 (→ workspaces/blog/projects/)
```
요청작업/                  # 작업 요청 문서
보험개발원_*               # 발표자료/문서
```

### 1.4 문서 시스템 현황

| 폴더 | 파일 수 | 내용 |
|------|---------|------|
| documentation/guides/ | 15 | 가이드 문서 |
| documentation/reports/ | 12 | 리포트 |
| documentation/analysis/ | 5 | 분석 문서 |
| documentation/core-modules/ | 5 | 핵심 모듈 문서 |
| .claude/rules/ | 10 | 활성 규칙 |
| .claude/skills/ | 21 | 스킬 정의 |
| plans/ | 13 | 플랜 파일 |

---

## Phase 2: 안전한 마이그레이션 전략

### 2.1 마이그레이션 원칙

| 원칙 | 설명 |
|------|------|
| **Zero Breaking** | 시스템 연결성 파괴 금지 |
| **Backup First** | 모든 작업 전 백업 필수 |
| **Incremental** | 점진적 이동, 검증 후 다음 단계 |
| **Symlink Fallback** | 필요시 심볼릭 링크로 호환성 유지 |

### 2.2 마이그레이션 대상 분류

#### [O] 안전하게 이동 가능 (콘텐츠 폴더)
```
→ workspaces/research/projects/
  papers/                    # 논문 자료
  1211_논문분석/             # 분석 문서
  ai-security-*.pdf          # 보고서

→ workspaces/blog/projects/
  요청작업/                  # 요청 문서
  보험개발원_*               # 발표자료

→ workspaces/app-dev/projects/
  (현재 루트 앱 프로젝트)
```

#### [!] 이동 금지 (시스템 의존성)
```
.claude/                    # Claude Code 핵심
planning-system/            # 14개 Hook 참조
unified-task-system/        # Hook 참조
atos/                       # 도구 오케스트레이션
ShrimpData/                 # Task Manager 데이터
mcp-servers/                # MCP 서버 (30+ 경로 참조)
```

#### [?] 검토 필요 (개별 판단)
```
vite-app/                   # 독립 앱? 시스템 일부?
dashboard/                  # 독립 앱? 시스템 일부?
WORKSPACE/                  # workspaces/와 중복?
```

### 2.3 WORKSPACE/ vs workspaces/ 통합

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A: 병합** | WORKSPACE/ 내용을 workspaces/로 이동 | 단일 구조 | 마이그레이션 필요 |
| **B: 공존** | 두 폴더 유지, 용도 구분 | 변경 최소화 | 혼란 가능 |
| **C: 리네임** | WORKSPACE → workspaces-legacy | 명확한 구분 | 추가 폴더 |

**권장**: 옵션 A (병합) - 장기적 유지보수 용이

---

## Phase 3: 경로 참조 업데이트 전략

### 3.1 영향받는 파일 목록

| 파일 | 수정 필요 항목 | 위험도 |
|------|---------------|--------|
| `.claude-hooks.json` | 이동된 폴더 참조 경로 | HIGH |
| `.claude.json` | MCP 서버 경로 (이동 시) | HIGH |
| `CLAUDE.md` | 문서 참조 경로 | LOW |
| `.claude/rules/*.md` | 상대 경로 참조 | LOW |

### 3.2 안전한 경로 업데이트 순서

```
1. 백업 생성 (backups/2026-02-03-reorganization/)
     │
     ▼
2. 콘텐츠 폴더 복사 (cp -r, 원본 유지)
     │
     ▼
3. 참조 파일 업데이트 (경로 수정)
     │
     ▼
4. 기능 검증 (Hook, MCP 테스트)
     │
     ▼
5. 원본 삭제 (검증 완료 후)
```

---

## Phase 4: 정리 및 최적화

### 4.1 삭제 대상 (안전)

| 폴더/파일 | 사유 | 크기 |
|-----------|------|------|
| `shell-snapshots/*.sh` (60일+) | 오래된 스냅샷 | ~50KB |
| `cache/` 내 임시 파일 | 캐시 정리 | ~10MB |
| `*.backup.*` 파일들 | 오래된 백업 | ~5MB |
| `debug/` 내 로그 (30일+) | 오래된 디버그 로그 | ~2MB |

### 4.2 아카이브 대상

```
→ backups/archive-2026-02/
  - 완료된 플랜 (plans/completed/)
  - 오래된 문서 버전
  - 레거시 설정 파일
```

### 4.3 중복 제거

| 중복 유형 | 발견 위치 | 조치 |
|-----------|----------|------|
| `.claude.json.backup.*` | 루트 (4개) | 최신 1개만 유지 |
| `index.html.backup-*` | vite-app/ (8개) | 최신 2개만 유지 |
| `CLAUDE.md.backup-*` | 루트 (4개) | 최신 1개만 유지 |

---

## Phase 5: 고도화 제안 (혁신)

### 5.1 자동 프로젝트 분류 시스템

```
[새 프로젝트 감지]
     │
     ▼
┌──────────────────┐
│ 콘텐츠 분석      │
│ - 파일 확장자    │
│ - package.json   │
│ - 키워드         │
└────────┬─────────┘
         │
    ┌────┴────┬────────┬──────────┐
    ▼         ▼        ▼          ▼
[research] [app-dev] [web] [automation]
    │         │        │          │
    ▼         ▼        ▼          ▼
[자동 워크스페이스 배치]
```

### 5.2 워크스페이스 전환 스킬

```bash
# 제안: 워크스페이스 간 빠른 전환
/workspace research    # research/ 컨텍스트로 전환
/workspace app-dev     # app-dev/ 컨텍스트로 전환
/workspace list        # 모든 워크스페이스 목록
```

### 5.3 콘텐츠 정리 자동화 Hook

```javascript
// 제안: 세션 종료 시 자동 정리
{
  "event": "session-end",
  "script": "node systems/auto-cleanup.js",
  "actions": [
    "임시 파일 정리",
    "오래된 스냅샷 삭제",
    "캐시 최적화"
  ]
}
```

### 5.4 문서 자동 인덱싱

| 기능 | 설명 |
|------|------|
| **자동 목차 생성** | documentation/ 내 모든 .md 파일 인덱싱 |
| **크로스 참조** | 문서 간 링크 자동 업데이트 |
| **검색 최적화** | 키워드 기반 빠른 문서 찾기 |

### 5.5 워크스페이스 템플릿 확장

| 템플릿 | 용도 | 포함 내용 |
|--------|------|----------|
| `data-science` | 데이터 분석 | notebooks/, data/, models/ |
| `mcp-server` | MCP 개발 | src/, tests/, package.json |
| `documentation` | 문서 프로젝트 | docs/, assets/, build/ |

---

## 구현 우선순위

### Phase A: 백업 및 준비 (즉시)
- [x] 현황 분석 완료
- [ ] backups/2026-02-03-reorganization/ 생성
- [ ] 핵심 파일 백업 (hooks, config, CLAUDE.md)

### Phase B: 콘텐츠 마이그레이션 (검토 후)
- [ ] papers/ → workspaces/research/projects/papers/
- [ ] 요청작업/ → workspaces/blog/projects/
- [ ] WORKSPACE/ 내용 검토 및 병합

### Phase C: 정리 및 최적화 (마이그레이션 후)
- [ ] 중복 백업 파일 정리
- [ ] 오래된 스냅샷/캐시 삭제
- [ ] 완료된 플랜 아카이빙

### Phase D: 고도화 (선택적)
- [ ] 워크스페이스 전환 스킬 구현
- [ ] 자동 정리 Hook 설정
- [ ] 문서 인덱싱 시스템

---

## 수정 대상 파일

| 파일 | 작업 | 위험도 |
|------|------|--------|
| `.claude-hooks.json` | 경로 업데이트 (마이그레이션 시) | HIGH |
| `CLAUDE.md` | 워크스페이스 구조 문서화 | LOW |
| `workspaces/*/CLAUDE.md` | 워크스페이스별 규칙 확인 | LOW |

---

## 검증 계획

### 마이그레이션 전 검증
1. **Hook 테스트**: planning-workflow 훅 정상 작동 확인
2. **MCP 테스트**: 모든 MCP 서버 연결 확인

### 마이그레이션 후 검증
1. **경로 참조 검증**: grep으로 broken link 검색
2. **세션 시작 테스트**: 정상 초기화 확인
3. **롤백 테스트**: 백업에서 복원 가능 확인

---

## 위험 완화

| 위험 | 완화 방안 |
|------|----------|
| Hook 경로 오류 | 백업 후 단계별 진행 |
| MCP 연결 실패 | mcp-servers/ 이동 금지 |
| 데이터 손실 | 복사 후 삭제 (이동 X) |

---

## Phase 6: 후속 작업 (Final Cleanup)

### 6.1 원본 폴더 삭제
마이그레이션 완료 확인됨 - 원본 삭제 진행

| 원본 | 복사본 위치 | 상태 |
|------|------------|------|
| papers/ | workspaces/research/projects/papers/ | 삭제 대상 |
| 1211_논문분석/ | workspaces/research/projects/1211_논문분석/ | 삭제 대상 |
| 요청작업/ | workspaces/blog/projects/요청작업/ | 삭제 대상 |

### 6.2 WORKSPACE/ 정리
AICRA-analyze가 이미 web-services에 복사됨 - 전체 폴더 정리

| 폴더 | 내용 | 조치 |
|------|------|------|
| AICRA-analyze/ | Jekyll 웹사이트 | 이미 복사됨, 삭제 |
| projects/ | 비어있음 | 삭제 |
| _obsidian/, _workspace-meta/ | 메타 데이터 | 삭제 |
| archive/, logs/, shared/ | 비어있거나 불필요 | 삭제 |

**옵션**: WORKSPACE/ 전체 삭제 (workspaces/와 중복)

### 실행 순서
```bash
# 1. 원본 폴더 삭제
rm -rf K:/PortableApps/Claude-Code/papers/
rm -rf K:/PortableApps/Claude-Code/1211_논문분석/
rm -rf K:/PortableApps/Claude-Code/요청작업/

# 2. WORKSPACE/ 정리 (전체 삭제)
rm -rf K:/PortableApps/Claude-Code/WORKSPACE/
```

### 검증
```bash
# 삭제 후 확인
ls -la K:/PortableApps/Claude-Code/ | grep -E "papers|논문|요청|WORKSPACE"
```

---

**버전**: 2.1.0
**작성일**: 2026-02-04
**목적**: K드라이브 시스템 정리 및 워크스페이스 통합 + 후속작업
