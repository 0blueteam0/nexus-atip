# ScrapeGraphAI Local MCP Server

**100% 무료** - Ollama 로컬 모델 사용

## 설치

```bash
cd K:/PortableApps/genai/mcp-servers/scrapegraph-local-mcp
pip install -r requirements.txt
playwright install chromium
```

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| OLLAMA_MODEL | llama3.2 | 사용할 Ollama 모델 |
| OLLAMA_BASE_URL | http://localhost:11434 | Ollama API URL |

## 도구 목록

| 도구 | 설명 |
|------|------|
| smart_scraper | AI로 웹페이지에서 구조화된 데이터 추출 |
| markdownify | 웹페이지를 Markdown으로 변환 |
| search_scraper | 검색 후 결과에서 정보 추출 |
| scrape_local_html | 로컬 HTML 콘텐츠 분석 |

## .claude.json 설정

```json
"scrapegraph-local": {
  "type": "stdio",
  "command": "K:/PortableApps/tools/python/python.exe",
  "args": [
    "K:/PortableApps/genai/mcp-servers/scrapegraph-local-mcp/server.py"
  ],
  "env": {
    "OLLAMA_MODEL": "llama3.2",
    "OLLAMA_BASE_URL": "http://localhost:11434"
  }
}
```

## 요구사항

- Python 3.10+
- Ollama 실행 중 (llama3.2 모델 권장)
- Playwright (chromium)
