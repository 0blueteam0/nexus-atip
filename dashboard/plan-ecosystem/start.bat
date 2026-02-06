@echo off
chcp 65001 >nul 2>&1
:: Plan Ecosystem Dashboard - Docker Launcher
:: Port: 7847

cd /d "%~dp0"
echo ========================================
echo   Plan Ecosystem Dashboard (Docker)
echo ========================================
echo.

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [-] Docker is not running
    echo [*] Please start Docker Desktop first
    pause
    exit /b 1
)

echo [*] Starting container...
docker compose up -d

if errorlevel 1 (
    echo [-] Failed to start container
    echo [*] Try: docker compose build
    pause
    exit /b 1
)

echo [+] Container started successfully
echo [*] Dashboard: http://localhost:7847
echo.
echo Commands:
echo   docker logs plan-ecosystem-dashboard     - View logs
echo   docker compose down                      - Stop container
echo   docker compose restart                   - Restart container
echo.

:: Open browser
start http://localhost:7847
