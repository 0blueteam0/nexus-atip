@echo off
chcp 65001 >nul 2>&1
:: Start Observer Server (F Architecture - Swarm Commander)
:: Called by session-start hook or manually

set CLAUDE_HOME=K:\PortableApps\genai
set NODE_EXE=%CLAUDE_HOME%\tools\nodejs\node.exe
set OBSERVER_DIR=%CLAUDE_HOME%\command-center\server
set OBSERVER_PORT=3847

:: Check if already running
curl -s http://localhost:%OBSERVER_PORT%/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [+] Observer already running
    exit /b 0
)

:: Start Observer in background
echo [*] Starting Observer Server (F Architecture)...
start /B "" "%NODE_EXE%" "%OBSERVER_DIR%\index.js" >nul 2>&1

:: Wait for startup
timeout /t 3 /nobreak >nul

:: Verify
curl -s http://localhost:%OBSERVER_PORT%/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [+] Observer v2.0.0-F started successfully
) else (
    echo [-] Observer failed to start
)

exit /b 0
