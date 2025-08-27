@echo off
REM ============================================
REM  CHECK RUNNING PROCESSES
REM  Shows what's currently running
REM ============================================

echo ============================================
echo    PROCESS STATUS CHECK
echo ============================================
echo.

echo [*] Checking Node.js processes...
echo --------------------------------
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if %errorlevel% EQU 0 (
    echo Found running Node.js processes:
    tasklist /FI "IMAGENAME eq node.exe" /FO LIST | find "PID:"
) else (
    echo No Node.js processes running
)

echo.
echo [*] Checking scheduled tasks...
echo --------------------------------
schtasks /query 2>nul | find /I "Claude" >nul
if %errorlevel% EQU 0 (
    echo Found Claude scheduled tasks:
    schtasks /query | find /I "Claude"
) else (
    echo No Claude scheduled tasks found
)

echo.
echo [*] Checking .claude.json size...
echo --------------------------------
for %%F in (.claude.json) do set size=%%~zF
set /a sizeKB=%size% / 1024
echo File size: %sizeKB% KB

if %sizeKB% GTR 100 (
    echo [!] WARNING: File is large, consider cleanup
) else (
    echo [+] File size is healthy
)

echo.
echo [*] Checking startup config...
echo --------------------------------
if exist startup-config.txt (
    echo Current configuration:
    type startup-config.txt
) else (
    echo No startup config found (using defaults)
)

echo.
pause