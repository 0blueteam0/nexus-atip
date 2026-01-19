@echo off
chcp 65001 >nul 2>&1
:: Windows Task Scheduler Auto-Startup Registration
:: Runs all systems automatically on computer boot

echo ============================================
echo    CLAUDE AUTO-STARTUP INSTALLER
echo ============================================
echo.

:: Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Administrator privileges required.
    echo     Right-click - "Run as administrator"
    pause
    exit /b 1
)

set CLAUDE_HOME=K:\PortableApps\Claude-Code

:: Register to Task Scheduler
echo [1/3] Registering Windows startup task...
schtasks /delete /tn "ClaudeAutoExecutor" /f 2>nul
schtasks /create /tn "ClaudeAutoExecutor" /tr "\"%CLAUDE_HOME%\tools\nodejs\node.exe\" \"%CLAUDE_HOME%\systems\auto-executor.js\"" /sc onlogon /rl highest /f
if %errorLevel% neq 0 echo [!] ClaudeAutoExecutor registration failed!

echo [2/3] Registering logon task...
schtasks /create /tn "ClaudeAutoStartup" /tr "\"%CLAUDE_HOME%\AUTO-STARTUP.bat\"" /sc onlogon /rl highest /f >nul 2>&1

echo [3/3] Registering 30-minute monitor task...
schtasks /create /tn "ClaudeAutoMonitor" /tr "\"%CLAUDE_HOME%\tools\nodejs\node.exe\" \"%CLAUDE_HOME%\systems\anomaly-detector.js\"" /sc minute /mo 30 /f >nul 2>&1

:: Start now
echo.
echo Start autonomous systems now? (Y/N)
set /p START=Choice:
if /i "%START%"=="Y" (
    echo.
    echo Starting autonomous systems...
    call "%CLAUDE_HOME%\AUTO-STARTUP.bat"
)

echo.
echo ============================================
echo    Installation Complete!
echo ============================================
echo.
echo Registered tasks:
echo   - ClaudeAutoExecutor: Windows startup
echo   - ClaudeAutoStartup: User logon
echo   - ClaudeAutoMonitor: Every 30 minutes
echo.
echo Verify: schtasks /query /tn "ClaudeAuto*"
echo Remove: schtasks /delete /tn "ClaudeAutoExecutor" /f
echo         schtasks /delete /tn "ClaudeAutoStartup" /f
echo         schtasks /delete /tn "ClaudeAutoMonitor" /f
echo.
pause
