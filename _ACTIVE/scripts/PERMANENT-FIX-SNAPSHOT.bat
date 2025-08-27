@echo off
echo ============================================
echo    PERMANENT SNAPSHOT GENERATION FIX
echo ============================================
echo.

REM 1. Delete existing snapshots
echo [1/4] Removing existing snapshots...
if exist "K:\PortableApps\Claude-Code\shell-snapshots" (
    rmdir /S /Q "K:\PortableApps\Claude-Code\shell-snapshots" 2>nul
    echo    - Removed shell-snapshots folder
)

REM 2. Create dummy file to prevent folder creation
echo [2/4] Creating blocker file...
echo This file prevents snapshot folder creation > "K:\PortableApps\Claude-Code\shell-snapshots"
attrib +R "K:\PortableApps\Claude-Code\shell-snapshots" 2>nul
echo    - Created read-only blocker file

REM 3. Set environment variables
echo [3/4] Setting environment variables...
setx CLAUDE_CODE_NO_SNAPSHOT "true" >nul 2>&1
setx CLAUDE_CODE_DONT_INHERIT_ENV "1" >nul 2>&1
setx CLAUDE_CODE_SHELL "cmd.exe" >nul 2>&1
echo    - Environment variables set

REM 4. Test
echo [4/4] Testing...
echo.
K:\PortableApps\tools\git\bin\bash.exe --norc --noprofile -c "echo 'Bash works without snapshots!'"

echo.
echo ============================================
echo    FIX APPLIED SUCCESSFULLY!
echo ============================================
echo.
echo The shell-snapshots folder is now blocked.
echo Claude Code cannot create snapshots anymore.
echo.
pause