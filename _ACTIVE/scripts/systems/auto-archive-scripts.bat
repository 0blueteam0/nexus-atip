@echo off
REM ============================================
REM  AUTO-ARCHIVE FOR ONE-TIME SCRIPTS
REM  Automatically archives temporary scripts
REM  after use to keep workspace clean
REM ============================================
setlocal EnableDelayedExpansion

REM Create today's archive folder
set TODAY=%date:~0,4%-%date:~5,2%-%date:~8,2%
set ARCHIVE_PATH=K:\PortableApps\Claude-Code\ARCHIVE\auto-archive\%TODAY%

if not exist "%ARCHIVE_PATH%" (
    mkdir "%ARCHIVE_PATH%" 2>nul
    echo [+] Created archive folder: %TODAY%
)

REM Function to check and archive script
:CHECK_AND_ARCHIVE
set "script_file=%~1"
set "script_name=%~nx1"

REM Check if file exists
if not exist "%script_file%" goto :eof

REM Check if it's a one-time script pattern
echo %script_name% | findstr /i "^FIX- ^TEST- ^DEBUG- ^TEMP- ^QUICK- ^EXECUTE- ^RUN- ^CATCH- ^CHECK-" >nul
if %errorlevel%==0 (
    REM Move to archive
    move "%script_file%" "%ARCHIVE_PATH%\" >nul 2>&1
    if !errorlevel!==0 (
        echo [+] Archived: %script_name%
    )
)
goto :eof

REM Main execution - scan for one-time scripts
echo ============================================
echo    AUTO-ARCHIVING ONE-TIME SCRIPTS
echo    Date: %TODAY%
echo ============================================
echo.

REM Patterns for one-time scripts
set patterns=FIX-*.bat TEST-*.bat DEBUG-*.bat TEMP-*.bat QUICK-*.bat
set patterns=%patterns% EXECUTE-*.txt RUN-*.txt CATCH-*.ps1 CHECK-*.bat
set patterns=%patterns% *-test.* *-temp.* *-debug.*

REM Process each pattern
for %%p in (%patterns%) do (
    for %%f in (K:\PortableApps\Claude-Code\%%p) do (
        if exist "%%f" (
            call :CHECK_AND_ARCHIVE "%%f"
        )
    )
)

echo.
echo [+] Auto-archive completed
pause