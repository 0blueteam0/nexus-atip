@echo off
REM ====================================
REM  PREVENT CLAUDE HISTORY WRITING
REM  Continuously removes history field
REM ====================================

echo [*] Starting history prevention system...
echo.

:LOOP
REM Run the fix quietly
K:\PortableApps\tools\nodejs\node.exe fix-claude-json-bug.js fix >nul 2>&1

REM Wait 30 seconds
timeout /t 30 /nobreak >nul

REM Loop forever
goto LOOP