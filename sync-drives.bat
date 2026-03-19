@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

REM sync-drives.bat - Bidirectional sync between K: and J: drives
REM Usage: sync-drives.bat [k2j|j2k|auto|status]
REM   k2j    = K: -> J: (one-way)
REM   j2k    = J: -> K: (one-way)
REM   auto   = Detect newer, sync both ways (default)
REM   status = Show diff without syncing

set "MODE=%~1"
if "%MODE%"=="" set "MODE=auto"

set "SRC_K=K:\PortableApps"
set "SRC_J=J:\PortableApps"
set "LOG_DIR=K:\PortableApps\genai\logs\sync"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Timestamp for log files
for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /format:list 2^>nul ^| find "="') do set "DT=%%a"
set "TS=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%%DT:~10,2%"
set "LOGFILE=%LOG_DIR%\sync_%TS%.log"

echo ========================================
echo  Drive Sync: K: ^<-^> J:
echo  Mode: %MODE%
echo  Time: %TS%
echo ========================================

REM Check both drives accessible
if not exist "K:\PortableApps" (
    echo [-] K: drive not accessible
    goto :EOF
)
if not exist "J:\" (
    echo [-] J: drive not accessible
    goto :EOF
)

REM Common robocopy options
REM /E = include subdirs  /DCOPY:T = copy dir timestamps
REM /XO = exclude older   /R:1 /W:1 = minimal retry
REM /NP = no progress     /FFT = FAT file time (2-sec granularity for cross-drive)
REM /LOG+ = append log     /TEE = output to console+log
set "ROBO_OPTS=/E /DCOPY:T /R:1 /W:1 /NP /FFT /TEE /LOG+:%LOGFILE%"

REM Exclude patterns (temp, cache, volatile)
set "EXCLUDES=/XD temp npm-cache .git node_modules\.cache __pycache__ .mypy_cache .pytest_cache"
set "EXCLUDES=%EXCLUDES% /XF *.log *.tmp *.pyc observer.db-shm observer.db-wal desktop-commander-*.log"

REM === GIT SYNC (genai/ repo) ===
echo.
echo [*] Step 1: Git sync for genai/ repository
echo ----------------------------------------

if "%MODE%"=="k2j" goto :GIT_K2J
if "%MODE%"=="j2k" goto :GIT_J2K

REM Auto mode - commit on both, then sync
:GIT_AUTO
echo [*] Checking git status on both drives...

cd /d K:\PortableApps\genai
for /f %%i in ('git status --porcelain 2^>nul ^| find /c /v ""') do set "K_CHANGES=%%i"

if exist "J:\PortableApps\genai\.git" (
    cd /d J:\PortableApps\genai
    for /f %%i in ('git status --porcelain 2^>nul ^| find /c /v ""') do set "J_CHANGES=%%i"
) else (
    set "J_CHANGES=0"
)

echo    K: changes: %K_CHANGES%, J: changes: %J_CHANGES%

if %K_CHANGES% GTR 0 (
    echo [*] Auto-committing K: changes...
    cd /d K:\PortableApps\genai
    git add -A
    git commit -m "Sync savepoint from K: [%TS%]"
)

if exist "J:\PortableApps\genai\.git" if %J_CHANGES% GTR 0 (
    echo [*] Auto-committing J: changes...
    cd /d J:\PortableApps\genai
    git add -A
    git commit -m "Sync savepoint from J: [%TS%]"
)

REM Setup remotes if not exists
cd /d K:\PortableApps\genai
git remote get-url j-drive >nul 2>&1 || git remote add j-drive J:\PortableApps\genai

if exist "J:\PortableApps\genai\.git" (
    cd /d J:\PortableApps\genai
    git remote get-url k-drive >nul 2>&1 || git remote add k-drive K:\PortableApps\genai

    REM Fetch and merge both ways
    echo [*] Fetching K: -^> J:
    cd /d K:\PortableApps\genai
    git fetch j-drive main 2>nul
    git merge j-drive/main --no-edit 2>nul
    if errorlevel 1 (
        echo [!] Git merge conflict on K: - resolve manually
        echo [!] Run: cd K:\PortableApps\genai ^& git mergetool
    )

    echo [*] Fetching J: -^> K:
    cd /d J:\PortableApps\genai
    git fetch k-drive main 2>nul
    git merge k-drive/main --no-edit 2>nul
    if errorlevel 1 (
        echo [!] Git merge conflict on J: - resolve manually
    )
)

echo [+] Git sync complete
goto :FILE_SYNC

:GIT_K2J
cd /d K:\PortableApps\genai
git add -A 2>nul
git commit -m "Sync savepoint from K: [%TS%]" 2>nul
if exist "J:\PortableApps\genai\.git" (
    cd /d J:\PortableApps\genai
    git remote get-url k-drive >nul 2>&1 || git remote add k-drive K:\PortableApps\genai
    git fetch k-drive main 2>nul
    git merge k-drive/main --no-edit 2>nul
)
goto :FILE_SYNC

:GIT_J2K
if exist "J:\PortableApps\genai\.git" (
    cd /d J:\PortableApps\genai
    git add -A 2>nul
    git commit -m "Sync savepoint from J: [%TS%]" 2>nul
    cd /d K:\PortableApps\genai
    git remote get-url j-drive >nul 2>&1 || git remote add j-drive J:\PortableApps\genai
    git fetch j-drive main 2>nul
    git merge j-drive/main --no-edit 2>nul
)
goto :FILE_SYNC

:FILE_SYNC
echo.
echo [*] Step 2: File sync for non-git PortableApps content
echo ----------------------------------------

if "%MODE%"=="status" (
    echo [*] Dry-run comparison K: -^> J:
    robocopy "%SRC_K%" "%SRC_J%" %ROBO_OPTS% %EXCLUDES% /L /XD genai
    goto :DONE
)

if "%MODE%"=="k2j" (
    echo [*] Syncing K: -^> J: (newer files only)
    robocopy "%SRC_K%" "%SRC_J%" %ROBO_OPTS% %EXCLUDES% /XO /XD genai
    goto :PATCH_J
)

if "%MODE%"=="j2k" (
    echo [*] Syncing J: -^> K: (newer files only)
    robocopy "%SRC_J%" "%SRC_K%" %ROBO_OPTS% %EXCLUDES% /XO /XD genai
    goto :PATCH_K
)

REM Auto: bidirectional - newer wins
echo [*] Syncing K: -^> J: (newer files)
robocopy "%SRC_K%" "%SRC_J%" %ROBO_OPTS% %EXCLUDES% /XO /XD genai
echo [*] Syncing J: -^> K: (newer files)
robocopy "%SRC_J%" "%SRC_K%" %ROBO_OPTS% %EXCLUDES% /XO /XD genai

:PATCH_J
REM Patch J: configs for J: drive
if exist "J:\PortableApps\genai\setup-drive.bat" (
    echo [*] Patching J: drive configs...
    call J:\PortableApps\genai\setup-drive.bat
)
goto :DONE

:PATCH_K
REM Patch K: configs for K: drive
if exist "K:\PortableApps\genai\setup-drive.bat" (
    echo [*] Patching K: drive configs...
    call K:\PortableApps\genai\setup-drive.bat
)
goto :DONE

:DONE
echo.
echo ========================================
echo [+] Sync complete. Log: %LOGFILE%
echo ========================================
endlocal
