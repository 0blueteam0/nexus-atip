# MCP 서버 설치 현황 - ULTRATHINK 분석
생성일시: 2025-01-19

## 📊 전체 현황
- **설정된 서버**: 19개
- **실제 확인된 서버**: 검증 진행 중

## ✅ 확인된 MCP 서버 목록

### 1. Node.js 기반 서버 (node_modules)
| 서버명 | 경로 | 상태 |
|--------|------|------|
| mcp-installer | npx -y @anaisbetts/mcp-installer | ✅ 도구 |
| filesystem | mcp-servers/node_modules/@modelcontextprotocol/server-filesystem | ✅ 설치됨 |
| memory | mcp-servers/node_modules/@modelcontextprotocol/server-memory | ✅ 설치됨 |
| shrimp-task | node_modules/mcp-shrimp-task-manager | ✅ 설치됨 |
| context7 | node_modules/@upstash | ✅ 설치됨 (npx) |
| edit-file-lines | mcp-servers/mcp-edit-file-lines/build/index.js | ✅ 빌드됨 |
| google-search | node_modules/google-search-mcp | ✅ 설치됨 |
| firecrawl | node_modules/firecrawl-mcp | ✅ 설치됨 |
| sqlite-mcp | node_modules/mcp-server-sqlite-npx | ✅ 설치됨 |
| git-mcp | node_modules/@cyanheads/git-mcp-server | ✅ 설치됨 |
| websearch | node_modules/websearch-mcp | ✅ 설치됨 |
| playwright | npx -y @executeautomation/playwright-mcp-server | ⚠️ npx 의존 |
| youtube-data | node_modules/youtube-data-mcp-server | ✅ 설치됨 |
| github | npx -y @modelcontextprotocol/server-github | ⚠️ npx 의존 |
| mcp-ripgrep | node_modules/mcp-ripgrep | ✅ 설치됨 |

### 2. Python 기반 서버
| 서버명 | 경로 | 상태 |
|--------|------|------|
| kiro-memory | mcp-servers/kiro-memory/mcp_server_enhanced.py | ✅ 소스 존재 |

### 3. 외부 서비스 의존 서버
| 서버명 | 타입 | API 키 필요 | 상태 |
|--------|------|------------|------|
| postgres | npx | ✅ DB 연결 문자열 | ⚠️ 미설정 |
| slack | npx | ✅ Slack Token | ⚠️ 미설정 |
| perplexity | npx | ✅ API Key | ⚠️ 미설정 |
| mongodb | npx | ✅ MongoDB URI | ⚠️ 미설정 |

## 🔑 API 키 설정 현황

### 설정 완료
- ✅ Google Search: AIzaSy... (설정됨)
- ✅ Firecrawl: fc-1469... (설정됨)
- ✅ YouTube Data: AIzaSy... (설정됨)
- ✅ GitHub Token: github_pat... (설정됨)
- ✅ Tavily (websearch): tvly-dev... (설정됨)

### 미설정 (스텁 값)
- ❌ Perplexity: pplx-your-api-key (스텁)
- ❌ Slack: xoxb-your-slack-bot-token (스텁)
- ❌ Postgres: postgresql://... (스텁)
- ❌ MongoDB: mongodb://localhost:27017/mydb (스텁)

## 🔍 추가 발견 서버
- mcp-ripgrep (설치되어 있지만 설정에 없음)
- @googleapis, @mendable 등 관련 라이브러리

## 📝 다음 단계
1. API 키 유효성 실제 테스트
2. 연결 테스트 수행
3. 미설정 서버 구성 최적화