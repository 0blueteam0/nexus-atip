# 📁 K:\PortableApps\Claude-Code 폴더 분석 보고서

## 🔴 즉시 삭제 필요 (불필요/중복)

| 폴더 | 크기 | 이유 | 영향 |
|------|------|------|------|
| `.cache/` | 89MB | Huggingface AI 모델 캐시 | 삭제 안전 |
| `.claude/` | ? | Claude Desktop 중복 | 현재 사용 안함 |
| `.claude-server-commander/` | 빈폴더 | 사용 안함 | 삭제 안전 |
| `.local/` | ? | Linux 스타일 캐시 | Windows에 불필요 |
| `.ssh/` | 빈폴더 | SSH 키 없음 | 삭제 안전 |
| `shell-snapshots/` | 빈폴더 | 사용 안함 | 삭제 안전 |
| `npm-cache/` | 100MB+ | 성능 문제 원인 | **즉시 삭제** |

## 🟡 정리/이동 필요

| 폴더 | 현재 상태 | 제안 |
|------|-----------|------|
| `AppData/` | Podman Desktop만 | Podman 제거 시 삭제 |
| `mcp-memory-service/` | 600+ 파일 | Archive로 이동 |
| `mcp-servers/`, `mcp-tools/` | 중복 | 하나로 통합 |
| `memory-*` 폴더들 | 5개 분산 | 1개로 통합 |
| `bin/`, `backup-configs/` | 사용 안함 | 삭제 검토 |

## 🟢 유지 필요 (핵심)

| 폴더 | 용도 | 중요도 |
|------|------|--------|
| `threat-knowledge-graph/` | NEXUS ATIP 프로젝트 | ⭐⭐⭐⭐⭐ |
| `ShrimpData/` | 현재 작업 관리 | ⭐⭐⭐⭐⭐ |
| `node_modules/` | Claude Code 의존성 | ⭐⭐⭐⭐ |
| `docs/` | 문서 | ⭐⭐⭐ |
| `modules/` | 지침 모듈 | ⭐⭐⭐⭐ |
| `systems/` | 자동화 스크립트 | ⭐⭐⭐ |

## 📊 크기별 정렬 (추정)

1. `node_modules/` - 200MB+
2. `mcp-memory-service/` - 150MB+
3. `npm-cache/` - 100MB+ (디스크 할당 포함)
4. `.cache/` - 89MB
5. `AppData/` - 121MB (Podman)

## 🎯 정리 우선순위

### 1단계: 즉시 삭제 (안전)
```batch
rmdir /s /q .cache
rmdir /s /q .claude-server-commander
rmdir /s /q .local
rmdir /s /q .ssh
rmdir /s /q shell-snapshots
rmdir /s /q npm-cache
```

### 2단계: 백업 후 정리
```batch
move mcp-memory-service archive\
move bin archive\
move backup-configs archive\
```

### 3단계: 통합
- `mcp-servers/` + `mcp-tools/` → `mcp/`
- 5개 memory 폴더 → `data/memory/`

## 💾 예상 절약 공간

- 즉시 삭제: ~200MB
- 정리/이동: ~150MB
- **총 절약: 350MB+**

## ⚠️ 주의사항

1. **threat-knowledge-graph/** 절대 삭제 금지
2. **ShrimpData/** 현재 작업 중
3. **node_modules/** Claude Code 필수