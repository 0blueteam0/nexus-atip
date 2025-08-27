# Portable Claude Code 사용 가이드

## 개요
USB 드라이브에서 Claude Code를 완전히 포터블하게 사용하는 방법입니다.
여러 컴퓨터에서 이동하며 작업할 때 C 드라이브의 사용자 폴더를 사용하지 않고 
K 드라이브(또는 USB 드라이브)의 설정만 사용합니다.

## 사용 방법

### 방법 1: --mcp-config 옵션 사용 (권장)
```bash
claude --mcp-config "/k/PortableApps/Claude-Code/mcp-config.json"
```

### 방법 2: 배치 파일 사용 (Windows)
```cmd
K:\PortableApps\Claude-Code\claude-portable.bat
```

### 방법 3: 쉘 스크립트 사용 (Git Bash/Linux/Mac)
```bash
/k/PortableApps/Claude-Code/claude-portable.sh
```

## 파일 구조
```
K:\PortableApps\Claude-Code\
├── mcp-config.json       # MCP 서버 설정 (포터블용)
├── .claude.json          # Claude 주 설정 파일
├── claude-portable.bat   # Windows 실행 스크립트
├── claude-portable.sh    # Unix/Linux 실행 스크립트
└── mcp-servers/         # MCP 서버 설치 디렉토리
```

## MCP 서버 추가/수정
`mcp-config.json` 파일을 직접 편집하여 MCP 서버를 추가할 수 있습니다:

```json
{
  "mcpServers": {
    "서버이름": {
      "type": "stdio",
      "command": "실행명령",
      "args": ["인자1", "인자2"]
    }
  }
}
```

## 주의사항
1. **항상 --mcp-config 옵션을 사용해야 합니다**
   - 일반 `claude` 명령은 여전히 C 드라이브 설정을 사용합니다
   - 포터블 설정을 사용하려면 반드시 mcp-config 옵션을 지정해야 합니다

2. **경로 형식**
   - Windows 경로: `K:\\PortableApps\\Claude-Code\\` (JSON 내부)
   - Unix 경로: `/k/PortableApps/Claude-Code/` (명령줄)

3. **다른 컴퓨터에서 사용 시**
   - USB 드라이브 문자가 다를 수 있으므로 확인 필요
   - 스크립트의 경로를 수정해야 할 수 있음

## 문제 해결
- MCP 서버가 로드되지 않을 때: `claude mcp list --mcp-config "경로"` 로 확인
- 경로 문제: Unix 스타일 경로 사용 (`/k/` 형식)
- 디버그 모드: `claude --debug --mcp-config "경로"`로 상세 정보 확인