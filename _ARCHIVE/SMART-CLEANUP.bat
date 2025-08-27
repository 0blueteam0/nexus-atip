@echo off
REM ============================================
REM  SMART CLEANUP - Intelligent Organization
REM  Categorizes and removes redundant files
REM ============================================

setlocal enabledelayedexpansion

echo ============================================
echo    SMART CLEANUP SYSTEM
echo    Organizing and removing redundancies
echo ============================================
echo.

REM Create organized structure
if not exist "_SYSTEM\configs" mkdir "_SYSTEM\configs"
if not exist "_SYSTEM\history-fixes" mkdir "_SYSTEM\history-fixes"
if not exist "_SYSTEM\startup" mkdir "_SYSTEM\startup"
if not exist "_SYSTEM\monitors" mkdir "_SYSTEM\monitors"
if not exist "_ARCHIVE\backups" mkdir "_ARCHIVE\backups"
if not exist "_ARCHIVE\broken" mkdir "_ARCHIVE\broken"

echo [*] Moving configuration files...
REM Move config-related files
if exist .claude.json.backup move .claude.json.backup "_ARCHIVE\backups\" >nul 2>&1
if exist .claude.json.broken-20250120 move .claude.json.broken-20250120 "_ARCHIVE\broken\" >nul 2>&1
if exist .credentials.json move .credentials.json "_SYSTEM\configs\" >nul 2>&1
if exist .google-search-browser-state-fingerprint.json move .google-search-browser-state-fingerprint.json "_SYSTEM\configs\" >nul 2>&1
if exist .google-search-browser-state.json move .google-search-browser-state.json "_SYSTEM\configs\" >nul 2>&1

echo [*] Organizing history fix files...
REM Move history-related files
if exist claude-history-manager.js move claude-history-manager.js "_SYSTEM\history-fixes\" >nul 2>&1
if exist claude-history-watchdog.js move claude-history-watchdog.js "_SYSTEM\history-fixes\" >nul 2>&1
if exist CLAUDE-HISTORY-SOLUTION.md move CLAUDE-HISTORY-SOLUTION.md "_SYSTEM\history-fixes\" >nul 2>&1
if exist fix-claude-json-bug.js move fix-claude-json-bug.js "_SYSTEM\history-fixes\" >nul 2>&1
if exist FIX-CLAUDE-JSON-BUG.md move FIX-CLAUDE-JSON-BUG.md "_SYSTEM\history-fixes\" >nul 2>&1
if exist PREVENT-HISTORY-WRITING.bat move PREVENT-HISTORY-WRITING.bat "_SYSTEM\history-fixes\" >nul 2>&1

echo [*] Organizing startup files...
REM Move startup-related files
if exist STARTUP-MANAGER.bat move STARTUP-MANAGER.bat "_SYSTEM\startup\" >nul 2>&1
if exist MINIMAL-STARTUP.bat move MINIMAL-STARTUP.bat "_SYSTEM\startup\" >nul 2>&1
if exist DISABLE-ALL-STARTUP.bat move DISABLE-ALL-STARTUP.bat "_SYSTEM\startup\" >nul 2>&1
if exist CHECK-PROCESSES.bat move CHECK-PROCESSES.bat "_SYSTEM\startup\" >nul 2>&1
if exist unified-monitor.js move unified-monitor.js "_SYSTEM\monitors\" >nul 2>&1
if exist UNIFIED-SYSTEM-MANAGER.bat move UNIFIED-SYSTEM-MANAGER.bat "_SYSTEM\monitors\" >nul 2>&1

echo [*] Cleaning up duplicate folders...
REM Remove empty or duplicate folders
if exist npm-cache rmdir /s /q npm-cache 2>nul
if exist .npm-cache rmdir /s /q .npm-cache 2>nul
if exist temp rmdir /s /q temp 2>nul
if exist todos rmdir /s /q todos 2>nul
if exist .localappdata rmdir /s /q .localappdata 2>nul

echo [*] Removing unnecessary files...
REM Remove the 'nul' file
if exist nul del nul 2>nul

echo [*] Compressing old HTML...
REM Archive large HTML file
if exist index.html (
    for %%F in (index.html) do set size=%%~zF
    set /a sizeMB=!size! / 1048576
    if !sizeMB! GTR 0 (
        echo   - index.html is !sizeMB! MB, moving to archive...
        move index.html "_ARCHIVE\" >nul 2>&1
    )
)

echo.
echo ============================================
echo    CLEANUP SUMMARY
echo ============================================
echo.

REM Count remaining files in root
set /a rootFiles=0
for %%f in (*) do set /a rootFiles+=1
echo [*] Root directory files: %rootFiles%

REM Show organized structure
echo.
echo [*] Organized structure:
echo   _SYSTEM\
echo     - configs\       (configuration files)
echo     - history-fixes\ (JSON history solutions)
echo     - startup\       (startup managers)
echo     - monitors\      (monitoring scripts)
echo   _ARCHIVE\
echo     - backups\       (backup files)
echo     - broken\        (corrupted files)

echo.
echo [+] Cleanup complete!
pause