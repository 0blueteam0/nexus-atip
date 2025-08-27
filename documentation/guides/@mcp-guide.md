# MCP 설치 및 설정 가이드

## 🦐 Shrimp Task Manager 설치 (Windows Native 특별 주의)

**⚠️ 알려진 문제**: claude mcp add 명령 사용 시 cmd 인자가 자동으로 "C:/"로 잘못 설정됨

**올바른 설치 방법:**

1. **초기 설치 명령** (구조 생성용):
```bash
claude mcp add shrimp-task-manager --scope user \
  -e DATA_DIR="K:\\PortableApps\\Claude-Code\\ShrimpData" \
  -e WEB_PORT=3000 \
  -- cmd /c npx -y mcp-shrimp-task-manager
```

2. **수동 수정 필요** (.claude.json):
   - 문제: `"args": ["C:/", "npx", "-y", ...]`
   - 수정: `"args": ["/c", "npx", "-y", ...]`

3. **올바른 설정**:
```json
"shrimp-task-manager": {
  "type": "stdio",
  "command": "cmd",
  "args": ["/c", "npx", "-y", "mcp-shrimp-task-manager"],
  "env": {
    "DATA_DIR": "K:\\PortableApps\\Claude-Code\\ShrimpData",
    "WEB_PORT": "3000"
  }
}
```

**패키지 정보:**
- npm: `mcp-shrimp-task-manager` (@ 없음!)
- 웹 UI: http://localhost:3000
- Chain-of-Thought 작업 관리

## 설치된 MCP 목록
1. ✅ mcp-installer
2. ✅ filesystem  
3. ✅ playwright
4. ✅ context7 (API 키 필요)
5. ✅ youtube-data (API 키 필요)
6. ✅ google-search
7. ✅ shrimp-task-manager
8. ✅ git-mcp
9. ✅ diff-typescript

## Windows Native cmd 버그 수정
모든 MCP 설치 후 반드시:
- C:/ → /c 수정
- .claude.json 직접 편집 필요