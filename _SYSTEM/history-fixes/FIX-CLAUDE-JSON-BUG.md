# .claude.json History Bug 해결 방안

## [!] 핵심 문제
**이것은 Claude Code의 알려진 버그입니다!** (GitHub Issue #1449, #5024, #5313)

## [*] 정상적인 구조

### 올바른 파일 역할:
1. **`.claude.json`**: MCP 서버 설정만 포함
   - mcpServers 설정
   - autoUpdates 설정
   - 기본 설정값들
   - **history 없어야 함!**

2. **`projects/*/[session-id].jsonl`**: 실제 세션 기록
   - 각 세션별 대화 내용
   - 컨텍스트 정보
   - 타임스탬프

## [>>] 현재 버그 상황

### 잘못된 동작:
```json
// .claude.json에 잘못 추가되는 항목들
{
  "projects": {
    "K:\\PortableApps\\Claude-Code": {
      "history": [...]  // <- 버그! 여기 있으면 안됨
    }
  },
  "tipsHistory": {...},  // <- 이것도 버그
  "promptQueueUseCount": ...  // <- 이것도 버그
}
```

### 영향:
- .claude.json 파일 크기 폭증 (수 MB ~ 수백 MB)
- Claude Code 시작 속도 저하
- 메모리 과다 사용
- Claude Desktop과 충돌

## [+] 해결 방법

### 1. 즉시 조치 - history 제거
```javascript
// clean-claude-json.js
const fs = require('fs');

function cleanClaudeJson() {
    const configPath = 'K:/PortableApps/Claude-Code/.claude.json';
    
    // 백업
    const backup = fs.readFileSync(configPath, 'utf8');
    fs.writeFileSync(configPath + '.backup-' + Date.now(), backup);
    
    // 로드
    const config = JSON.parse(backup);
    
    // 버그 항목 제거
    if (config.projects) {
        for (const project in config.projects) {
            delete config.projects[project].history;
        }
        // projects가 비어있으면 제거
        if (Object.keys(config.projects).length === 0) {
            delete config.projects;
        }
    }
    
    // 저장
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('[+] Cleaned .claude.json - removed buggy history');
}

cleanClaudeJson();
```

### 2. 방지책 - 읽기 전용 설정
```batch
REM history 섹션 추가 방지
attrib +R .claude.json
```

### 3. 올바른 세션 관리
- 세션은 `projects/K--PortableApps-Claude-Code/*.jsonl`에 저장됨
- 이 파일들이 실제 대화 기록
- `.claude.json`은 설정만

## [?] 확인 사항

### 정상 .claude.json 크기:
- 정상: 2-10 KB
- 비정상: 100 KB 이상

### 정상 구조:
```json
{
  "mcpServers": {
    // MCP 서버 설정들
  },
  "autoUpdates": true,
  "shell": "cmd.exe"
  // history 없음!
}
```

## [=] GitHub Issues
- #1449: .claude.json automatically stores conversation history
- #5024: History accumulation causes performance issues
- #5313: Runtime data overwrites configuration

**이 버그는 Claude Code 팀이 수정해야 하는 문제입니다.**