# System Inventory v1.0.0
**Last Updated**: 2026-01-19 (수동/자동 업데이트)

---

## Quick Stats
| 항목 | 수량 |
|------|------|
| MCP Servers | 36 |
| Skills | 19 |
| Commands | 59 (10 core + 30 library + 19 sc) |
| Rules | 11 (6 active + 5 archived) |
| Hooks | 7+ active |
| Total Size | ~7GB |

---

## Critical Files (절대 수정 금지)
| 파일 | 역할 | 훼손 시 영향 |
|------|------|-------------|
| `.claude.json` | MCP 서버 40+ 정의 | 전체 도구 사용 불가 |
| `.claude-hooks.json` | 훅 7개 정의 | 자동화 중단 |
| `CLAUDE.md` | 핵심 지침 | 작업 일관성 상실 |
| `atos/index.js` | ATOS 도구 오케스트레이션 | 도구 추천 중단 |
| `unified-task-system/session-restore.js` | 세션 복원 | 연속성 상실 |

---

## Active Plan
- **현재 플랜**: plans/ACTIVE-PLAN.md 참조
- **진행 상황**: plans/floofy-sauteeing-alpaca-progress.json
- **플래닝 시스템**: planning-system/

---

## 설정 파일 역할
| 파일 | 역할 | 수정 권한 |
|------|------|----------|
| `.claude.json` | MCP 서버 40+ 정의 (메인) | 금지 |
| `.mcp.json` | e2b 등 추가 서버 (확장) | 허용 |
| `.claude-hooks.json` | 훅 7개 정의 | 확장만 |


---

## Folder Map
| 폴더 | 용도 |
|------|------|
| `.claude/` | 스킬, 규칙, 명령어 |
| `atos/` | 도구 오케스트레이션 시스템 |
| `planning-system/` | 플래닝 인프라 |
| `planning-log/` | 플래닝 로그 |
| `plans/` | 플랜 파일 |
| `mcp-servers/` | MCP 서버 코드 |
| `unified-task-system/` | 통합 작업 관리 |
| `documentation/` | 문서 |
| `start-scripts/` | 배치 스크립트 |
| `archive/` | 아카이브 |
| `backups/` | 백업 |

---

## Planning System
플래닝 5대 원칙 준수 시스템:

| 원칙 | 구현 |
|------|------|
| 구체성 | 모든 명령어, 경로, 검증 기준 명시 |
| 추적가능성 | progress.json + Git 커밋 연동 |
| 지속적 인지 | ACTIVE-PLAN.md + 세션 훅 |
| 버전관리 | Phase 완료 시 자동 커밋 |
| 백업성 | 3중 백업 (로컬/Git/log) |

### 핵심 스크립트
| 스크립트 | 용도 |
|----------|------|
| `planning-system/restore.js` | 세션 시작 시 상태 복원 |
| `planning-system/checkpoint.js` | Phase/Task 완료 처리 |
| `planning-system/progress-tracker.js` | 진행 상황 CRUD |
| `planning-system/daily-logger.js` | 일일 로그 기록 |

---

## Recent Git Commits
```
[PLAN] Phase 2 완료: 통합 (Consolidation)
[PLAN] Phase 1 완료: 정리 (Cleanup)
[PLAN] Phase 0 완료: 플래닝 시스템 인프라 구축
```

---

## Health Check Commands
```bash
# 플래닝 상태
node planning-system/restore.js

# MCP 연결
claude --mcp-debug 2>&1 | head -50

# Docker 상태
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

*Auto-updated by planning-system*
