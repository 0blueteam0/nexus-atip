# 🚨 SYSTEM RECOVERY PLAN - 2025-01-16

## 📅 실패 타임라인 (15일~16일)

### Day 1: 2025-01-15 오후
- **14:00**: index.html 실수 삭제 사건
- **15:00**: 메모리 MCP 시스템 구축 시작
- **18:00**: 4종 MCP 비교 → kiro-memory 선택
- **20:00**: Python 의존성 문제 → Podman 시도
- **23:00**: 자율 시스템 파일 생성 (미작동)

### Day 2: 2025-01-16 오전
- **09:00**: 폴더 정리 시작 (31개 폴더)
- **10:00**: MCP 연결 대규모 실패 발생
- **11:00**: .claude.json 정리 시도 (부분 성공)
- **12:00**: 시스템 완전 붕괴 확인

## 🔴 현재 상태 (CRITICAL)

### MCP 연결 상태
```
✓ Connected (4/9)
- mcp-installer
- filesystem
- context7
- google-search

✗ Failed (5/9)
- playwright
- youtube-data
- shrimp-task-manager (핵심!)
- kiro-memory
- firecrawl
```

### 폴더 구조 상태
- 31개 폴더 파편화
- 문서 4곳 분산 (modules, docs, comparisons, recommendations)
- 캐시 3중복, 메모리 5중복
- 아키텍처 붕괴

## 🎯 MASTER RECOVERY PLAN

### 🏗️ Phase 1: 현재 상태 동결 및 백업 (즉시 - 30분)

#### 1.1 완전 백업
```bash
# 전체 프로젝트 백업
xcopy K:\PortableApps\Claude-Code K:\PortableApps\Claude-SystemBackup-20250116 /E /I /H /Y

# 설정 파일 개별 백업
copy .claude.json backup\.claude.json.20250116.full
copy .claude.json.bloated backup\.claude.json.bloated.keep
```

#### 1.2 현재 상태 문서화
```bash
# MCP 상태 기록
claude mcp list > backup\mcp-status-20250116.txt

# 폴더 구조 기록
tree /F > backup\folder-structure-20250116.txt
```

### 🔧 Phase 2: 최소 작동 시스템 구축 (1시간)

#### 2.1 깨끗한 환경 준비
```json
// .claude.json.minimal
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "node",
      "args": ["K:\\PortableApps\\Claude-Code\\mcp-servers\\node_modules\\@modelcontextprotocol\\server-filesystem\\dist\\index.js"],
      "env": {"ALLOWED_DIRECTORIES": "K:\\"}
    }
  }
}
```

#### 2.2 테스트 및 검증
```bash
# 백업 후 교체
copy .claude.json .claude.json.broken
copy .claude.json.minimal .claude.json

# 테스트
claude mcp list
claude mcp test filesystem
```

### 🚀 Phase 3: 핵심 기능 단계별 복구 (3시간)

#### 3.1 Priority 1: Shrimp Task Manager
```json
{
  "shrimp-task-manager": {
    "type": "stdio", 
    "command": "cmd",
    "args": ["/c", "npx", "-y", "mcp-shrimp-task-manager"],
    "env": {
      "DATA_DIR": "K:\\PortableApps\\Claude-Code\\ShrimpData",
      "WEB_PORT": "3000"
    }
  }
}
```
테스트 → 검증 → 다음

#### 3.2 Priority 2: Git MCP
```json
{
  "git-mcp": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@cyanheads/git-mcp-server"]
  }
}
```
테스트 → 검증 → 다음

#### 3.3 Priority 3: Memory System
```json
{
  "kiro-memory": {
    "type": "stdio",
    "command": "uvx",
    "args": ["--from", "git+https://github.com/kirosc/mcp-memory", "mcp-memory"],
    "env": {"UV_SYSTEM_PYTHON": "1"}
  }
}
```
테스트 → 검증 → 완료

### 📐 Phase 4: 구조 재설계 (2시간)

#### 4.1 새로운 폴더 구조
```
K:\PortableApps\Claude-Code-Clean\
├── system/              # 핵심 시스템 파일
│   ├── claude.bat       # 메인 실행
│   ├── .claude.json     # MCP 설정
│   └── .env            # 환경 변수
├── services/           # MCP 서비스
│   ├── core/          # 필수 MCP
│   └── optional/      # 선택 MCP
├── storage/            # 모든 데이터
│   ├── memory/        # 대화 기억
│   ├── tasks/         # 작업 관리
│   └── cache/         # 임시 캐시
└── knowledge/          # 지식 베이스
    ├── @modules/      # CLAUDE.md 모듈
    ├── guides/        # 가이드 문서
    └── archive/       # 과거 기록
```

#### 4.2 마이그레이션
```bash
# 새 구조로 이동
robocopy system/ Claude-Code-Clean\system\ /E
robocopy services/ Claude-Code-Clean\services\ /E
# ... 체계적 이동
```

### 🧪 Phase 5: 검증 시스템 구축 (1시간)

#### 5.1 자동 테스트 스크립트
```javascript
// test-all-mcp.js
const tests = [
  'filesystem',
  'shrimp-task-manager',
  'git-mcp',
  'kiro-memory'
];

tests.forEach(mcp => {
  console.log(`Testing ${mcp}...`);
  // 연결 테스트
  // 기능 테스트
  // 결과 기록
});
```

#### 5.2 상태 모니터링
```bash
# monitor.bat
@echo off
:loop
claude mcp list
timeout /t 300
goto loop
```

## 📋 체크포인트 및 롤백

### 각 Phase 성공 기준
- Phase 1: 백업 완료 확인
- Phase 2: filesystem 작동 확인
- Phase 3: 3개 핵심 MCP 작동
- Phase 4: 새 구조 완성
- Phase 5: 모든 테스트 통과

### 롤백 시나리오
```bash
# 실패 시 즉시 복구
xcopy K:\PortableApps\Claude-SystemBackup-20250116 K:\PortableApps\Claude-Code /E /I /H /Y
```

## 🎯 예상 결과

### 성공 시
- 모든 MCP 정상 작동
- 깔끔한 폴더 구조
- 시스템 안정성 확보
- 롤백 가능한 백업

### 실패 대비
- 완전 백업 보유
- 단계별 체크포인트
- 즉시 롤백 가능
- 최소 시스템 보장

## 📊 진행 상황 추적

| Phase | 시작 | 완료 | 상태 | 검증 |
|-------|------|------|------|------|
| 1. 백업 | 12:30 | - | ⏳ | [ ] |
| 2. 최소 시스템 | - | - | ⏸️ | [ ] |
| 3. 핵심 복구 | - | - | ⏸️ | [ ] |
| 4. 재구조화 | - | - | ⏸️ | [ ] |
| 5. 검증 | - | - | ⏸️ | [ ] |

## 🚨 중요 원칙

1. **No Surprise**: 모든 변경 사전 보고
2. **Test First**: 변경 전 테스트
3. **Backup Always**: 항상 백업 우선
4. **Document Everything**: 모든 과정 기록
5. **Rollback Ready**: 언제든 복구 가능

---
📅 작성: 2025-01-16 12:35
🎯 목표: 시스템 완전 복구
⏱️ 예상: 총 7.5시간
🔄 상태: Phase 1 시작 대기