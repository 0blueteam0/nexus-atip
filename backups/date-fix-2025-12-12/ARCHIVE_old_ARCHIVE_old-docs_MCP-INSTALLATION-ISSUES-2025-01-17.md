# MCP 설치 문제 및 해결 방법 (2025-01-17)

## 🔴 발견된 문제들

### 1. **타입 지정 누락 문제**
- **문제**: MCP 서버 설정에 `"type": "stdio"` 누락
- **증상**: MCP 서버가 연결되지 않음
- **해결**: 모든 MCP 서버 설정에 `"type": "stdio"` 추가

### 2. **Windows 경로 문제**
- **문제**: `/` 대신 `\\` 사용 필요
- **증상**: 파일을 찾을 수 없다는 에러
- **해결**: 모든 경로를 `\\` 이스케이프로 변경
  ```json
  "K:/PortableApps/..." → "K:\\PortableApps\\..."
  ```

### 3. **npx 실행 문제**
- **문제**: Windows에서 npx 직접 실행 불가
- **증상**: npx 명령이 실행되지 않음
- **해결**: `cmd /c` 래퍼 사용
  ```json
  {
    "command": "cmd",
    "args": ["/c", "npx", "-y", "package-name"]
  }
  ```

### 4. **Shrimp Task Manager 경로 문제**
- **문제**: shrimp-task-manager/build 폴더가 없음
- **실제 위치**: `node_modules/mcp-shrimp-task-manager/dist/index.js`
- **해결**: 올바른 경로로 수정

### 5. **Python MCP 서버 문제**
- **문제**: pip 모듈이 제대로 설치되지 않음
- **증상**: kiro-memory, zen-mcp 실행 불가
- **해결 필요**: Python portable 환경 재설정

### 6. **MCP List 타임아웃 문제**
- **문제**: `claude.bat mcp list` 명령이 2분 후 타임아웃
- **원인**: 잘못된 설정으로 인한 MCP 서버 무한 대기
- **해결 필요**: 각 MCP 서버 개별 테스트

## ✅ 성공적으로 연결된 MCP

1. **filesystem** - ✅ 연결됨
2. **memory** - ✅ 연결됨
3. **mcp-installer** - ✅ 설정됨

## 🔧 현재 작동하는 설정

```json
{
  "mcpServers": {
    "mcp-installer": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@anaisbetts/mcp-installer"]
    },
    "filesystem": {
      "type": "stdio",
      "command": "node",
      "args": [
        "K:\\PortableApps\\genai\\mcp-servers\\node_modules\\@modelcontextprotocol\\server-filesystem\\dist\\index.js"
      ],
      "env": {
        "ALLOWED_DIRECTORIES": "K:\\"
      }
    },
    "memory": {
      "type": "stdio",
      "command": "node",
      "args": [
        "K:\\PortableApps\\genai\\mcp-servers\\node_modules\\@modelcontextprotocol\\server-memory\\dist\\index.js"
      ]
    },
    "shrimp-task": {
      "type": "stdio",
      "command": "node",
      "args": [
        "K:\\PortableApps\\genai\\node_modules\\mcp-shrimp-task-manager\\dist\\index.js"
      ]
    },
    "context7": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

## 📝 해결 필요 항목

1. **edit-file-lines** - 빌드 완료 확인 필요
2. **google-search** - API 키 설정 필요
3. **firecrawl** - API 키 설정 필요  
4. **zen-mcp** - Python 환경 수정 필요
5. **kiro-memory** - Python pip 설치 필요

## 🚀 다음 단계

1. 각 MCP 서버 개별 테스트
2. API 키 설정 (.env 파일)
3. Python 환경 재구성
4. 모든 MCP 실제 연결 확인
5. Real Implementation, Real Integration 달성

## 📊 진행 상황

- **설치 완료**: 9개 MCP
- **연결 확인**: 2개 MCP (filesystem, memory)
- **연결 대기**: 7개 MCP
- **목표**: 모든 MCP Real Integration

---
작성일: 2025-01-17 11:35 KST