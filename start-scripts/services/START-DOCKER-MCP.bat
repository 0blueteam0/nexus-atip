@echo off
REM ============================================
REM START-DOCKER-MCP.bat
REM Self-hosted MCP 서버용 Docker 시작 스크립트
REM ============================================

echo.
echo [*] Docker 상태 확인...
docker info >nul 2>&1
if errorlevel 1 (
    echo [!] Docker가 실행되지 않았습니다. 시작 중...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo [*] Docker Desktop 시작 대기 중... (최대 60초)

    set /a count=0
    :wait_docker
    timeout /t 2 /nobreak >nul
    docker info >nul 2>&1
    if not errorlevel 1 goto docker_ready
    set /a count+=2
    if %count% geq 60 (
        echo [-] Docker 시작 시간 초과. 수동으로 Docker Desktop을 시작하세요.
        pause
        exit /b 1
    )
    echo     ... %count%초 경과
    goto wait_docker
)

:docker_ready
echo [+] Docker 실행 중

echo.
echo [*] Firecrawl Self-hosted 시작... (포트 3002)
cd /d K:\PortableApps\Claude-Code\mcp-servers\firecrawl-self-hosted
docker compose up -d

echo.
echo [*] SearXNG + Crawl4AI 시작... (포트 8001, 8082, 6380)
cd /d K:\PortableApps\Claude-Code\mcp-servers\searxng-crawl4ai-mcp
docker compose up -d

echo.
echo ============================================
echo [+] 모든 Self-hosted MCP 서버 시작 완료!
echo ============================================
echo.
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

cd /d K:\PortableApps\Claude-Code
pause
