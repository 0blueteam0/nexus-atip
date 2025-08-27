# @mcp-guide.md - MCP 설치 및 설정 가이드

## 🔧 MCP 도구 사용법

### 설치된 MCP 서버
1. **filesystem** - 파일 시스템 작업
2. **playwright** - 웹 자동화
3. **shrimp-task-manager** - 작업 관리
4. **context7** - 라이브러리 정보 (API 키 필요)
5. **youtube-data** - YouTube 분석 (API 키 필요)
6. **google-search** - 웹 검색

### MCP 설치 순서
1. `mcp-installer`를 사용해 설치
2. `./claude.bat mcp list`로 확인
3. 디버그 모드로 테스트: `./claude.bat --debug`
4. 문제 시 직접 설정: `.claude.json` 편집

### Windows Native 설정 예시
```json
{
  "mcpServers": {
    "example": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@package/name"],
      "env": {
        "API_KEY": "YOUR_KEY"
      }
    }
  }
}
```

### 트러블슈팅
- npx 환경에서 에러 시: `cmd /c npx` 사용
- 타임아웃 문제: `MCP_TIMEOUT=60000` 설정
- 경로 이스케이프: JSON에서 `\\` 두 번 사용