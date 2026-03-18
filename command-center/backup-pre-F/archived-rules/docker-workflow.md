---
description: Self-hosted MCP 서버 사용 전 Docker 상태 확인 워크플로우
globs:
  - mcp-servers/**/*
---

# Docker 시작 확인 워크플로우 (CRITICAL)

## 자동 트리거 조건
다음 MCP 도구 호출 전 Docker 상태 확인:
- `firecrawl_*` (firecrawl self-hosted)
- `one_*` (searxng-crawl4ai)
- `crawl4ai_*` (crawl4ai)

## Docker 확인 프로세스
```powershell
# 1. Docker 실행 여부 확인
docker info >nul 2>&1
if ($LASTEXITCODE -ne 0) {
    # 2. Docker Desktop 시작
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "[*] Docker Desktop 시작 중..."

    # 3. Docker 준비 대기 (최대 60초)
    $timeout = 60
    while ($timeout -gt 0) {
        docker info >nul 2>&1
        if ($LASTEXITCODE -eq 0) { break }
        Start-Sleep -Seconds 2
        $timeout -= 2
    }
}

# 4. Self-hosted 컨테이너 시작
cd K:\PortableApps\Claude-Code\mcp-servers\firecrawl-self-hosted
docker compose up -d

cd K:\PortableApps\Claude-Code\mcp-servers\searxng-crawl4ai-mcp
docker compose up -d
```

## Self-hosted MCP 서버 목록
| 서버 | 컨테이너 | 포트 | 용도 |
|------|----------|------|------|
| firecrawl | firecrawl-api-1, firecrawl-worker-1 | 3002 | 웹 스크래핑 API |
| searxng | searxng | 8082 | 메타 검색 엔진 |
| crawl4ai | crawl4ai | 8001 | AI 기반 크롤링 |
| redis | redis | 6380 | 캐시 서버 |

## 자동 도구 선택 로직

### Crawl4AI 도구 선택
| 조건 | 선택 도구 | 이유 |
|------|----------|------|
| Docker 실행 중 | `one_scrape` (searxng-crawl4ai) | 실제 웹 스크래핑, 정확한 데이터 |
| Docker 미실행/오류 | `crawl4ai_scrape` (crawl4ai-lite) | 폴백용, 기본 응답 제공 |

### Firecrawl 도구 선택
| 조건 | 선택 도구 | 이유 |
|------|----------|------|
| Docker 실행 중 | `firecrawl_scrape` | Self-hosted 완전 기능 |
| Docker 미실행 | 사용자에게 Docker 시작 권유 | API 키 없는 self-hosted는 Docker 필수 |

### MCP 서버 용도 구분
| MCP 서버 | 도구 접두사 | 용도 | Docker 필요 |
|----------|------------|------|-------------|
| `searxng-crawl4ai` | `one_*` | 실제 스크래핑 (권장) | O |
| `crawl4ai-lite` | `crawl4ai_*` | 폴백/테스트용 | X |
| `firecrawl` | `firecrawl_*` | 고급 스크래핑 | O |
