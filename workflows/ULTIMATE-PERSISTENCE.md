# 궁극의 워크플로우 영속성 솔루션

## 🎯 핵심 아이디어: N8N + MCP = 완벽한 자동화

### 1. N8N의 강력한 기능
- **영구 저장**: 서버에 워크플로우 저장
- **Webhook 트리거**: 외부에서 자동 실행
- **스케줄링**: 정기적 자동 실행
- **상태 저장**: 실행 이력 및 결과 보관
- **에러 복구**: 실패 시 자동 재시도

### 2. MCP와 N8N 연동 방법
```javascript
// N8N 워크플로우를 MCP 도구처럼 사용
mcp__n8n__create-workflow({
    name: "Claude-News-Pipeline",
    nodes: [
        // MCP 도구들을 N8N 노드로 연결
        {type: "mcp-websearch"},
        {type: "mcp-firecrawl"},
        {type: "mcp-kiro-memory"}
    ]
})
```

### 3. 세션 무관 영속성
- Claude 세션 시작 → N8N webhook 호출
- N8N이 워크플로우 실행 → 결과 반환
- 모델 변경, ultrathink 무관하게 동일 실행

### 4. 실제 구현 단계
1. N8N 서버 설치 (Docker 또는 npm)
2. MCP 도구를 N8N 커스텀 노드로 등록
3. 워크플로우 생성 및 저장
4. Webhook URL 생성
5. Claude에서 webhook 호출만 하면 끝!