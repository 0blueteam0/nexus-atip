@echo off
chcp 65001 >nul 2>&1
:: Fully Automatic Startup - No user intervention needed
:: This runs EVERYTHING automatically

echo [AUTO-STARTUP] Starting autonomous systems...

:: 1. Environment setup
set CLAUDE_HOME=K:\PortableApps\Claude-Code
set TMPDIR=%CLAUDE_HOME%\tmp
set TEMP=%CLAUDE_HOME%\tmp
set PATH=%CLAUDE_HOME%\tools\nodejs;%PATH%
mkdir %CLAUDE_HOME%\tmp 2>nul

cd /d %CLAUDE_HOME%

:: 2. Start autonomous systems in background
echo [1/4] Starting anomaly detector...
start /B "" "%CLAUDE_HOME%\tools\nodejs\node.exe" "%CLAUDE_HOME%\systems\anomaly-detector.js" 2>nul

echo [2/4] Starting evolution engine...
start /B "" "%CLAUDE_HOME%\tools\nodejs\node.exe" "%CLAUDE_HOME%\systems\instruction-evolution.js" 2>nul

echo [3/4] Starting auto executor...
start /B "" "%CLAUDE_HOME%\tools\nodejs\node.exe" "%CLAUDE_HOME%\systems\auto-executor.js" 2>nul

echo [4/4] Starting Docker MCP checker...
start /B "" "%CLAUDE_HOME%\tools\nodejs\node.exe" "%CLAUDE_HOME%\systems\docker-checker.js" 2>nul

:: 3. Auto cleanup (7+ day old log files)
powershell -Command "& {$dirs=@('K:\PortableApps\Claude-Code\workflows\logs','K:\PortableApps\Claude-Code\tmp','K:\PortableApps\Claude-Code\shell-snapshots');foreach($d in $dirs){if(Test-Path $d){gci $d -File|?{$_.LastWriteTime -lt (Get-Date).AddDays(-7)}|ri -Force 2>$null}}}" 2>nul

echo.
echo [AUTO-STARTUP] All systems running autonomously
echo.
echo Running systems:
echo   - anomaly-detector.js (Anomaly detection)
echo   - instruction-evolution.js (Self-evolution)
echo   - auto-executor.js (Auto execution)
echo   - docker-checker.js (Docker MCP)
echo.
exit /b 0
