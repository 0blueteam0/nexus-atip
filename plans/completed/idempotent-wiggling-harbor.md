# Claude-Code -> genai 폴더 리네이밍 마이그레이션 계획

## Context

현재 K드라이브 포터블 환경의 루트 폴더가 `K:\PortableApps\genai`로 되어 있다. 이를 `K:\PortableApps\genai`로 변경하여 더 범용적인 이름으로 전환한다. 시스템 전체에 하드코딩된 경로가 **250+ 곳 이상** 존재하므로, 빠짐없이 전수 교체가 필요하다.

---

## 전수조사 결과 요약

### 변경 대상 분류

| 카테고리 | 파일 수 | 참조 수 | 심각도 |
|----------|---------|---------|--------|
| **P0: 시작/설정** (.claude.json, claude.bat, .npmrc, .bashrc, settings.local.json) | 5 | ~80 | CRITICAL |
| **P1: Hook 시스템** (.claude-hooks.json) | 1 | ~25 | CRITICAL |
| **P2: 핵심 JS 시스템** (planning-system, unified-task-system, atos, systems) | ~40 | ~100 | HIGH |
| **P3: Docker/YAML** (docker-compose.yml 등) | 3 | ~12 | HIGH |
| **P4: 문서** (CLAUDE.md, .claude/rules/*.md, plans/*.md 등) | ~60 | ~150 | MEDIUM |
| **P5: 백업/아카이브** (backups/, shell-snapshots/) | ~80 | ~100+ | LOW |
| **P6: 자동생성** (projects/K--PortableApps-genai, debug/) | ~30 | ~30 | LOW |

### 변경하지 않는 대상

| 대상 | 이유 |
|------|------|
| `node_modules/` 내부 | npm 패키지 이름 `@anthropic-ai/claude-code` (폴더 경로 아님) |
| `.cursor/extensions/` | Cursor IDE 확장 (패키지명 anthropic.claude-code) |
| `K:\PortableApps\tools\` 내 npm 패키지 | 패키지명 참조, 경로 아님 |
| `.git/` 내부 | Git 내부 데이터 (자동 처리) |

---

## 실행 계획

### Phase 0: 백업 (필수 선행)

```bash
# 1. Git 세이브포인트
git add -A && git commit -m "Savepoint: Before Claude-Code to genai migration"

# 2. 전체 폴더 복사 백업
cp -r "K:/PortableApps/genai" "K:/PortableApps/genai-BACKUP-$(date +%Y%m%d)"
```

### Phase 1: 파일 내용 일괄 교체 (폴더 이름 변경 전)

모든 파일 내용의 경로 참조를 먼저 교체한다. **폴더 이름은 아직 바꾸지 않는다.**

교체 패턴 (순서 중요 - 긴 패턴부터):

| # | 찾기 | 바꾸기 | 적용 대상 |
|---|------|--------|-----------|
| 1 | `K:\\PortableApps\\genai\\` | `K:\\PortableApps\\genai\\` | .claude.json, .bat 파일 등 |
| 2 | `K:\\PortableApps\\genai` | `K:\\PortableApps\\genai` | .bat, .npmrc 등 |
| 3 | `K:/PortableApps/genai/` | `K:/PortableApps/genai/` | .js, .json, .yml, settings |
| 4 | `K:/PortableApps/genai` | `K:/PortableApps/genai` | .js, .json, .yml, settings |
| 5 | `/k/PortableApps/genai` | `/k/PortableApps/genai` | .bashrc (MSYS 경로) |
| 6 | `//k/PortableApps/genai` | `//k/PortableApps/genai` | settings.local.json (UNC 경로) |
| 7 | `K--PortableApps-genai` | `K--PortableApps-genai` | projects 폴더명 참조 |

#### Phase 1-A: P0 CRITICAL 파일 (5개)

**1. `.claude.json`** (~20개 경로)
- 38개 MCP 서버 경로 전부 교체
- 패턴 1, 2, 3, 4 적용

**2. `claude.bat`** (~13개 경로)
- 환경변수: NPM_CONFIG_CACHE, TEMP, TMP, TMPDIR, HOME, USERPROFILE, CLAUDE_HOME 등
- 패턴 2 적용

**3. `.npmrc`** (4줄)
- cache, prefix, tmp, userconfig 경로
- 패턴 2 적용

**4. `.bashrc`** (3줄)
- CLAUDE_HOME, TEMP, TMP
- 패턴 5 적용

**5. `.claude/settings.local.json`** (~12개 경로)
- Bash 허용 목록, Read 허용 경로, Hook 명령어
- 패턴 3, 4, 6 적용

#### Phase 1-B: P1 Hook 시스템 (1개)

**6. `.claude-hooks.json`** (~25개 경로)
- 모든 Hook 스크립트 경로
- 패턴 1, 2, 3, 4 적용

#### Phase 1-C: P2 핵심 JS 시스템 (~40개 파일)

대상 디렉토리별 일괄 교체:

| 디렉토리 | 파일 수 | 교체 패턴 |
|----------|---------|-----------|
| `planning-system/` | 3 (plan-guard.js, workflow.js, guard-state.json) | 3, 4 |
| `unified-task-system/` | 15+ (session-restore.js, cli.js, task-manager.js 등) | 3, 4 |
| `atos/` | 10+ (index.js, execution-monitor.js, bidirectional-sync.js 등) | 3, 4 |
| `systems/` | 8+ (startup-orchestrator.js, docker-checker.js 등) | 3, 4 |
| `dashboard/plan-ecosystem/` | 15+ (server.js, collectors/*.js) | 3, 4 |
| `.claude-update-system/` | 7 (workflow.js, version-checker.js 등) | 3, 4 |
| `_SYSTEM/` | 5+ (monitors, history-fixes) | 3, 4 |
| `_ACTIVE/scripts/` | 20+ (systems/*.js, hooks/*.js) | 3, 4 |
| `langgraph-system/` | 2 (hub-adapter.js, gate-checker.js) | 3, 4 |
| `workflows/` | 3 (workflow-executor.js 등) | 3, 4 |
| `scripts/` | 3 (validation, repair, system) | 3, 4 |
| `ecosystem-cli.js` | 1 | 3, 4 |

#### Phase 1-D: P3 Docker/YAML (3개)

| 파일 | 교체 수 |
|------|---------|
| `dashboard/plan-ecosystem/docker-compose.yml` | 9 |
| `mcp-servers/n8n/docker-compose.yml` | 1+ |
| `scripts/system/launch-browser-test.ps1` | 2 |

#### Phase 1-E: P4 문서 (~60개)

| 대상 | 작업 |
|------|------|
| `CLAUDE.md` (루트) | 경로 참조 전체 교체 |
| `.claude/CLAUDE.md` | superclaude 경로 교체 |
| `.claude/rules/*.md` | 환경 경로 참조 교체 |
| `documentation/**/*.md` | 경로 참조 교체 |
| `plans/**/*.md` | 경로 참조 교체 |
| `AGENTS.md` | 경로 참조 교체 |

#### Phase 1-F: P5 백업/아카이브

| 대상 | 방침 | 결정 |
|------|------|------|
| `backups/` 내 .js, .json, .md | **교체** | [v] 확정 |
| `shell-snapshots/*.sh` | **스킵** | [v] 확정 |

#### Phase 1-G: P6 자동생성 디렉토리

| 대상 | 작업 |
|------|------|
| `projects/K--PortableApps-genai/` | 폴더명 변경: `K--PortableApps-genai/` |
| `debug/*.txt` | **스킵** (자동 생성, 임시 데이터) |

### Phase 2: 폴더 이름 변경 (사용자 수동 실행)

**Claude Code 세션을 완전히 종료한 후**, Windows 탐색기 또는 cmd에서 직접 실행:

```cmd
cd K:\PortableApps
ren Claude-Code genai
```

> [!] 이 단계는 자동화 스크립트에 포함하지 않음. 세션 중 실행 불가.

### Phase 3: 내부 디렉토리 변경

```bash
# projects 하위 폴더명 변경
cd K:\PortableApps\genai\projects
ren K--PortableApps-genai K--PortableApps-genai
```

### Phase 4: 외부 참조 변경

| 대상 | 위치 | 작업 |
|------|------|------|
| Auto-memory 디렉토리 | `projects/K--PortableApps-genai/memory/` | Phase 3에서 자동 처리 |
| Windows 바로가기/링크 | 바탕화면 등 | 수동 확인 |
| 환경변수 (시스템) | 없음 (포터블이므로) | 불필요 |

### Phase 5: 검증

```bash
# 1. claude.bat 실행 테스트
K:\PortableApps\genai\claude.bat

# 2. MCP 서버 초기화 확인
# -> 38개 서버 모두 연결 확인

# 3. Hook 시스템 확인
# -> 세션 시작 시 startup hook 정상 동작

# 4. Planning 시스템 확인
node K:/PortableApps/genai/planning-system/restore.js --all

# 5. Task 시스템 확인
node K:/PortableApps/genai/unified-task-system/session-restore.js

# 6. Docker 서비스 확인
docker ps  # plan-ecosystem 등 볼륨 마운트 확인
```

---

## 실행 방법: 자동화 스크립트

Phase 1의 모든 교체를 Node.js 스크립트로 자동화한다:

```
migrate-to-genai.js
- 1단계: 대상 파일 목록 수집 (확장자별)
- 2단계: 각 파일 읽기 -> 패턴 교체 -> 쓰기
- 3단계: 교체 결과 로그 출력
- 4단계: 검증 (남은 참조 grep)
```

### 교체 제외 목록 (glob)

```
node_modules/**
.git/**
.cursor/extensions/**
backups/evidence-*/**  (선택적)
shell-snapshots/**  (선택적)
debug/**
*.exe, *.dll, *.zip, *.tar.gz  (바이너리)
```

---

## 리스크 및 대응

| 리스크 | 대응 |
|--------|------|
| 교체 누락으로 시스템 실패 | Phase 5 검증 + grep 재스캔 |
| 바이너리 파일 손상 | 확장자 필터로 텍스트 파일만 교체 |
| Git 히스토리 손실 | Phase 0 백업 + 세이브포인트 |
| Docker 볼륨 마운트 실패 | docker-compose.yml 교체 + 재시작 |
| Claude Code 내부 프로젝트 인식 | projects/ 폴더명 교체 |

---

## 구현 원칙

- **플랜에만 종속되지 않는다**: 플랜은 가이드라인이며, 구현 중 발견되는 미비점이나 추가 필요사항은 목적(안전한 genai 전환)에 따라 유연하게 대응한다.
- **발견 즉시 처리**: 플랜에 없더라도 교체가 필요한 참조를 발견하면 즉시 교체한다.
- **교체 후 재검증**: 전체 교체 완료 후 grep으로 잔여 참조를 재스캔하여 누락 없음을 보장한다.

---

## 요약

- **전체 영향 파일**: ~150개 (백업 포함)
- **전체 교체 참조**: ~250개+
- **자동화**: Node.js 마이그레이션 스크립트
- **안전장치**: Git 세이브포인트 + 전체 폴더 백업
- **검증**: 5단계 체크리스트
- **사용자 결정**: backups/ 교체, shell-snapshots/ 스킵, 폴더 리네이밍은 수동
