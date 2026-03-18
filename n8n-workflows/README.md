# n8n Workflows for LangGraph MCP Orchestrator

LangGraph MCP Orchestrator와 연동되는 n8n 자동화 워크플로우입니다.

## 워크플로우 목록

### 1. Daily CVE Report (`daily-cve-report.json`)
매일 최신 CVE 취약점을 수집하고 분석하여 Slack에 보고합니다.

**트리거**: 24시간마다 자동 실행
**흐름**:
```
Schedule → Research API → Analyze → Slack
```

**설정 필요**:
- Slack Credential 설정
- `#security-alerts` 채널 생성

### 2. PR Review Automation (`pr-review-automation.json`)
GitHub PR이 생성되면 자동으로 코드 리뷰를 수행합니다.

**트리거**: GitHub PR Webhook
**흐름**:
```
PR Created → Code Review API → Post Comment → Slack
```

**설정 필요**:
- GitHub Credential 설정
- GitHub Repository Webhook 설정
- Slack Credential 설정

### 3. Research Pipeline (`research-pipeline.json`)
웹훅으로 리서치 요청을 받아 자동으로 조사하고 보고합니다.

**트리거**: HTTP POST Webhook
**흐름**:
```
Webhook → Research API → Generate Report → Slack
```

**사용 예시**:
```bash
curl -X POST http://localhost:5678/webhook/research-trigger \
  -H "Content-Type: application/json" \
  -d '{"query": "LangGraph vs AutoGen 비교", "research_type": "web"}'
```

## 설치 방법

### 1. n8n에 워크플로우 임포트
```bash
# n8n CLI 사용
n8n import:workflow --input=daily-cve-report.json
n8n import:workflow --input=pr-review-automation.json
n8n import:workflow --input=research-pipeline.json
```

또는 n8n UI에서:
1. Settings → Import from File
2. JSON 파일 선택

### 2. Credential 설정
n8n UI에서 다음 Credential 생성:
- **Slack API**: Bot Token, Signing Secret
- **GitHub API**: Personal Access Token

### 3. 환경 변수
```bash
# LangGraph API 서버 주소 (기본값)
LANGGRAPH_API_URL=http://localhost:8000

# Slack 설정
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# GitHub 설정
GITHUB_TOKEN=ghp_...
```

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/run` | POST | 범용 작업 실행 |
| `/research` | POST | 리서치 전용 |
| `/webhook/n8n/trigger` | POST | n8n 콜백용 |

## 커스터마이징

### 새 워크플로우 생성 시 참고사항

1. **API 호출 형식**:
```json
{
  "input": "작업 설명",
  "workflow": "auto|research|coding|task"
}
```

2. **응답 형식**:
```json
{
  "success": true,
  "output": "결과 텍스트",
  "workflow_used": "사용된 워크플로우",
  "artifacts": []
}
```

3. **에러 처리**:
- `success: false` 시 `error` 필드 확인
- If 노드로 분기 처리 권장

## 트러블슈팅

### API 연결 실패
- LangGraph 서버 실행 확인: `python -m uvicorn main:app --port 8000`
- 방화벽 설정 확인

### Slack 메시지 전송 실패
- Bot Token 권한 확인: `chat:write`, `channels:read`
- 채널에 봇 초대 확인

### GitHub Webhook 미동작
- Webhook URL 확인: `http://your-n8n-url/webhook/github-pr-webhook`
- Content-Type: `application/json` 설정
