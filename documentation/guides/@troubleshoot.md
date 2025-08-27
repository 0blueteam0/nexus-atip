# @troubleshoot.md - 문제 해결 가이드

## 🔧 공통 문제 해결

### Bash 셸 스냅샷 에러
```bash
# 증상: shell-snapshots/snapshot-bash-*.sh 파일 없음
# 해결:
optimize.bat  # 또는
del /Q K:\PortableApps\Claude-Code\shell-snapshots\*.sh
```

### 임시 디렉토리 문제
```bash
# 증상: /tmp/claude-* 경로 에러
# 해결:
mkdir K:\PortableApps\Claude-Code\tmp
set TMPDIR=K:\PortableApps\Claude-Code\tmp
```

### MCP 서버 연결 실패
```bash
# 증상: MCP server failed to start
# 해결:
1. API 키 확인: .claude.json의 env 섹션
2. 타임아웃 증가: MCP_TIMEOUT=60000
3. cmd 래퍼 사용: "command": "cmd", "args": ["/c", "npx", ...]
```

### NPM/NPX 실행 에러
```bash
# 증상: npx command not found
# 해결:
set PATH=K:\PortableApps\tools\nodejs;%PATH%
npm config get prefix  # 경로 확인
```

### 메모리 부족
```bash
# 증상: Out of memory 에러
# 해결:
set NODE_OPTIONS=--max-old-space-size=4096
```

## 🚀 빠른 해결
1. **optimize.bat 실행** - 대부분 문제 자동 해결
2. **quick.bat 사용** - 환경 변수 자동 설정
3. **node test-mcp.js** - MCP 상태 확인