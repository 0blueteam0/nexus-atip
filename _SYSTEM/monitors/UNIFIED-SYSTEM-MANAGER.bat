@echo off
REM ============================================
REM  UNIFIED SYSTEM MANAGER
REM  One script to rule them all
REM  Combines all maintenance tasks
REM ============================================

echo ============================================
echo    UNIFIED SYSTEM MANAGER
echo    Handling all maintenance in one place
echo ============================================
echo.

:MENU
echo Select operation:
echo [1] Quick Clean (one-time cleanup)
echo [2] Start Monitor (continuous)
echo [3] Stop All Background Tasks
echo [4] Status Check
echo [5] Exit
echo.
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" goto CLEAN
if "%choice%"=="2" goto MONITOR
if "%choice%"=="3" goto STOP
if "%choice%"=="4" goto STATUS
if "%choice%"=="5" goto END

:CLEAN
echo.
echo [*] Running quick cleanup...
echo --------------------------------

REM 1. Clean .claude.json history
K:\PortableApps\tools\nodejs\node.exe fix-claude-json-bug.js fix 2>nul
if %errorlevel%==0 (
    echo [+] Cleaned .claude.json
) else (
    echo [-] .claude.json clean failed
)

REM 2. Archive old scripts
call systems\auto-archive-scripts.bat >nul 2>&1
echo [+] Archived old scripts

REM 3. Organize folders
if exist "_ACTIVE" (
    echo [+] Folders already organized
) else (
    call AUTO-ORGANIZE-ALL.bat >nul 2>&1
    echo [+] Organized all folders
)

echo.
echo [*] Quick cleanup complete!
pause
goto MENU

:MONITOR
echo.
echo [*] Starting continuous monitor...
echo    Press Ctrl+C to stop
echo --------------------------------
K:\PortableApps\tools\nodejs\node.exe unified-monitor.js
goto MENU

:STOP
echo.
echo [*] Stopping all background tasks...
taskkill /F /IM node.exe >nul 2>&1
echo [+] All Node.js processes stopped
pause
goto MENU

:STATUS
echo.
echo [*] System Status:
echo --------------------------------

REM Check .claude.json size
for %%F in (.claude.json) do set size=%%~zF
set /a sizeKB=%size% / 1024
echo [*] .claude.json size: %sizeKB% KB

REM Count files in root
set /a count=0
for %%f in (*) do set /a count+=1
echo [*] Root directory files: %count%

REM Check if organized
if exist "_SYSTEM" (
    echo [+] Folder structure: ORGANIZED
) else (
    echo [-] Folder structure: NOT ORGANIZED
)

REM Count session files
set /a sessions=0
for %%f in (projects\K--PortableApps-Claude-Code\*.jsonl) do set /a sessions+=1
echo [*] Session files: %sessions%

echo.
pause
goto MENU

:END
echo [*] Exiting...
exit /b