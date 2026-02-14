# 🚨 폴더 구조 분석 - 심각한 파편화 발견

## 📊 현황: 31개 폴더 (정상: 5-7개)

### 🔴 중복/충돌 폴더들
#### 캐시 중복 (3개)
- `.cache/` - 일반 캐시
- `npm-cache/` - npm 전용
- `.local/` - 로컬 데이터

#### 메모리 시스템 충돌 (5개)
- `memory-data/`
- `memory-archive/` 
- `mcp-memory-service/`
- `brain/`
- `ShrimpData/`

#### 임시 폴더 난립 (4개)
- `tmp/`
- `temp/`
- `shell-snapshots/`
- `statsig/`

#### 태스크 관리 중복 (3개)
- `todos/`
- `tasks/`
- `projects/`

#### MCP 서버 분산 (2개)
- `mcp-servers/`
- `mcp-tools/`

#### 문서 분산 (4개)
- `docs/`
- `comparisons/`
- `recommendations/`
- `installation-guides/`

### 🎯 문제점
1. **파편화**: 같은 기능이 여러 폴더에 분산
2. **중복**: 캐시 3개, 메모리 5개, 임시 4개
3. **혼란**: 어디에 뭐가 있는지 파악 불가
4. **성능**: 폴더 탐색 시간 증가

## 🔧 제안: 5개 핵심 폴더로 통합

### 새로운 구조 (CLEAN)
```
K:\PortableApps\genai\
├── core/           # 핵심 실행 파일
│   ├── claude.bat
│   ├── .claude.json
│   └── node_modules/
├── mcp/            # 모든 MCP 서버
│   └── (mcp-servers + mcp-tools 통합)
├── data/           # 모든 데이터
│   ├── memory/     # 메모리 시스템 통합
│   ├── cache/      # 캐시 통합
│   └── tasks/      # 태스크 통합
├── docs/           # 모든 문서
│   └── (docs + guides + recommendations 통합)
└── _archive/       # 임시/백업
    └── (old + temp + snapshots)
```

### 🗑️ 즉시 제거 대상
- `AppData/` - Windows 전용, K드라이브 철학 위반
- `threat-knowledge-graph/` - 사용 안함
- `.claude-server-commander/` - 구식
- `bin/` - 빈 폴더
- `modules/` - 실제 모듈 없음
- `.ssh/` - 사용 안함
- `hooks/` - .claude/hooks와 중복

### 📉 예상 결과
- **폴더 수**: 31개 → 5개 (84% 감소)
- **탐색 속도**: 5배 향상
- **관리성**: 명확한 구조로 개선
- **혼란 제거**: 1폴더 = 1기능

## ⚡ 실행 명령
```batch
REM 1. 백업
move * K:\PortableApps\Claude-Archive\full-backup-20250116\

REM 2. 재구성
mkdir core mcp data docs _archive

REM 3. 복원 (선택적)
move 필요한_파일만 새_구조로
```

**현재 31개 폴더는 완전히 통제 불능 상태입니다!**