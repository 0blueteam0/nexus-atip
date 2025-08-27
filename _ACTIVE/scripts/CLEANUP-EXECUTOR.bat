@echo off
setlocal EnableDelayedExpansion
echo ========================================
echo    FILE CLEANUP EXECUTOR
echo    Date: 2025-08-27
echo ========================================
echo.

REM Phase 1: Create Archive Structure
echo [Phase 1] Creating archive structure...
mkdir "ARCHIVE\2025-08-27-cleanup\bash-fixes" 2>nul
mkdir "ARCHIVE\2025-08-27-cleanup\tests" 2>nul
mkdir "ARCHIVE\2025-08-27-cleanup\temp-scripts" 2>nul
mkdir "ARCHIVE\2025-08-27-cleanup\obsolete" 2>nul
mkdir "ARCHIVE\2025-08-27-cleanup\wsl-txt" 2>nul
mkdir "ARCHIVE\2025-08-27-cleanup\popup-monitor" 2>nul

REM Phase 2: Move Bash-related files
echo.
echo [Phase 2] Moving Bash-related files...
set count=0
for %%f in (BASH-*.bat BASH-*.txt FIX-BASH-*.bat FIX-BASH-*.txt COMPLETE-BASH-*.bat DEBUG-BASH-*.bat FINAL-BASH-*.bat) do (
    if exist "%%f" (
        move "%%f" "ARCHIVE\2025-08-27-cleanup\bash-fixes\" >nul 2>&1
        set /a count+=1
    )
)
echo    Moved !count! Bash-related files

REM Phase 3: Move WSL files
echo.
echo [Phase 3] Moving WSL files...
set count=0
for %%f in (WSL-*.txt WSL-*.bat QUICK-WSL-*.txt) do (
    if exist "%%f" (
        move "%%f" "ARCHIVE\2025-08-27-cleanup\wsl-txt\" >nul 2>&1
        set /a count+=1
    )
)
echo    Moved !count! WSL files

REM Phase 4: Move test files
echo.
echo [Phase 4] Moving test files...
set count=0
for %%f in (TEST-*.bat TEST-*.txt test-*.bat direct-test.bat *-test.*) do (
    if exist "%%f" (
        move "%%f" "ARCHIVE\2025-08-27-cleanup\tests\" >nul 2>&1
        set /a count+=1
    )
)
echo    Moved !count! test files

REM Phase 5: Move popup/monitor files
echo.
echo [Phase 5] Moving popup monitoring files...
move CATCH-POPUP-NOW.bat "ARCHIVE\2025-08-27-cleanup\popup-monitor\" >nul 2>&1
move START-POPUP-MONITOR.bat "ARCHIVE\2025-08-27-cleanup\popup-monitor\" >nul 2>&1
move catch-popup.ps1 "ARCHIVE\2025-08-27-cleanup\popup-monitor\" >nul 2>&1
move monitor-popup.bat "ARCHIVE\2025-08-27-cleanup\popup-monitor\" >nul 2>&1
move check-scheduled-tasks.bat "ARCHIVE\2025-08-27-cleanup\popup-monitor\" >nul 2>&1
echo    Moved popup monitoring files

REM Phase 6: Move Python scripts
echo.
echo [Phase 6] Moving Python scripts...
set count=0
for %%f in (*.py) do (
    if exist "%%f" (
        move "%%f" "ARCHIVE\2025-08-27-cleanup\temp-scripts\" >nul 2>&1
        set /a count+=1
    )
)
echo    Moved !count! Python files

REM Phase 7: Move execution instruction files
echo.
echo [Phase 7] Moving instruction text files...
move EXECUTE-THIS-NOW.txt "ARCHIVE\2025-08-27-cleanup\obsolete\" >nul 2>&1
move RUN-POWERSHELL-FIX.txt "ARCHIVE\2025-08-27-cleanup\obsolete\" >nul 2>&1
move INSTALL-DESKTOP-COMMANDER-NOW.txt "ARCHIVE\2025-08-27-cleanup\obsolete\" >nul 2>&1
move FIX-ALL-ISSUES-*.txt "ARCHIVE\2025-08-27-cleanup\obsolete\" >nul 2>&1
move FIX-TIMESTAMP-*.txt "ARCHIVE\2025-08-27-cleanup\obsolete\" >nul 2>&1
move FIX-GIT-BASH-PATH.bat "ARCHIVE\2025-08-27-cleanup\bash-fixes\" >nul 2>&1
echo    Moved instruction files

REM Phase 8: Move misc temp files
echo.
echo [Phase 8] Moving miscellaneous temp files...
move simple-fix.bat "ARCHIVE\2025-08-27-cleanup\obsolete\" >nul 2>&1
move bash.bat "ARCHIVE\2025-08-27-cleanup\obsolete\" >nul 2>&1
move sh.bat "ARCHIVE\2025-08-27-cleanup\obsolete\" >nul 2>&1
move run-trace.bat "ARCHIVE\2025-08-27-cleanup\obsolete\" >nul 2>&1
move setup-utf8-complete.bat "ARCHIVE\2025-08-27-cleanup\temp-scripts\" >nul 2>&1
move verify-utf8.bat "ARCHIVE\2025-08-27-cleanup\temp-scripts\" >nul 2>&1
move analyze-timestamp.js "ARCHIVE\2025-08-27-cleanup\temp-scripts\" >nul 2>&1
move add-utf8-config.js "ARCHIVE\2025-08-27-cleanup\temp-scripts\" >nul 2>&1
move patch-claude-bash.js "ARCHIVE\2025-08-27-cleanup\temp-scripts\" >nul 2>&1
move trace-bash*.js "ARCHIVE\2025-08-27-cleanup\temp-scripts\" >nul 2>&1
move REALTIME-DIAGNOSTIC.js "ARCHIVE\2025-08-27-cleanup\temp-scripts\" >nul 2>&1
move install-desktop-commander.bat "ARCHIVE\2025-08-27-cleanup\obsolete\" >nul 2>&1
echo    Moved misc files

REM Phase 9: Remove empty/duplicate directories
echo.
echo [Phase 9] Removing empty directories...
if exist tmp rmdir /Q tmp 2>nul
if exist ClaudeCode rmdir /S /Q ClaudeCode 2>nul
if exist nul del nul 2>nul
echo    Cleaned up empty directories

REM Phase 10: Create summary
echo.
echo ========================================
echo    CLEANUP SUMMARY
echo ========================================
echo.
REM Count files in current K: directory only
set count=0
for %%f in (K:\PortableApps\Claude-Code\*) do (
    set /a count+=1
)
echo Files in root: !count! (was ~80+)
echo.
echo Archived to: ARCHIVE\2025-08-27-cleanup\
echo.
echo [+] Cleanup completed successfully!
echo.
pause