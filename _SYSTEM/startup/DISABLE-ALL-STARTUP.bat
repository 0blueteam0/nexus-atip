@echo off
REM ============================================
REM  DISABLE ALL STARTUP PROCESSES
REM  Removes all scheduled tasks and stops all
REM ============================================

echo ============================================
echo    DISABLE ALL STARTUP PROCESSES
echo    This will stop all automatic startup
echo ============================================
echo.

echo [*] Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
echo [+] All background processes stopped

echo.
echo [*] Removing Windows scheduled tasks...
schtasks /delete /tn "ClaudeCodeStartup" /f >nul 2>&1
schtasks /delete /tn "ClaudeCodeMonitor" /f >nul 2>&1
schtasks /delete /tn "ClaudeCodeCleanup" /f >nul 2>&1
echo [+] Scheduled tasks removed

echo.
echo [*] Creating minimal config...
echo ESSENTIAL_ONLY=1> startup-config.txt
echo AUTO_CLEANUP=0>> startup-config.txt
echo HISTORY_WATCHDOG=0>> startup-config.txt
echo FOLDER_ORGANIZER=0>> startup-config.txt
echo ANOMALY_DETECTOR=0>> startup-config.txt
echo [+] Config set to minimal mode

echo.
echo ============================================
echo    ALL STARTUP PROCESSES DISABLED
echo    Use STARTUP-MANAGER.bat to re-enable
echo ============================================
pause