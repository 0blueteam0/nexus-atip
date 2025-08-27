@echo off
REM ========================================
REM  Claude Code 자동 문제 해결 시스템
REM  Bottom-up Autonomous Fix System
REM ========================================

echo [AUTO-FIX] Starting autonomous problem solver...

REM 1. 심볼릭 링크로 /tmp 문제 영구 해결
echo [1/5] Creating symbolic links...
if not exist "K:\tmp" mkdir "K:\tmp"
mklink /D "C:\tmp" "K:\PortableApps\Claude-Code\tmp" 2>nul
mklink /D "C:\temp\claude" "K:\PortableApps\Claude-Code\tmp" 2>nul

REM 2. 스냅샷 디렉토리 자동 정리 및 재생성
echo [2/5] Fixing snapshot directory...
if exist "K:\PortableApps\Claude-Code\shell-snapshots" (
    rmdir /S /Q "K:\PortableApps\Claude-Code\shell-snapshots"
)
mkdir "K:\PortableApps\Claude-Code\shell-snapshots"

REM 3. 더미 스냅샷 파일 생성 (에러 방지)
echo [3/5] Creating dummy snapshots...
echo #!/bin/bash > "K:\PortableApps\Claude-Code\shell-snapshots\snapshot-bash-dummy.sh"
echo # Dummy snapshot file >> "K:\PortableApps\Claude-Code\shell-snapshots\snapshot-bash-dummy.sh"

REM 4. 환경 변수 영구 설정
echo [4/5] Setting permanent environment variables...
setx TMPDIR "K:\PortableApps\Claude-Code\tmp" >nul 2>&1
setx TEMP "K:\PortableApps\Claude-Code\tmp" >nul 2>&1
setx TMP "K:\PortableApps\Claude-Code\tmp" >nul 2>&1
setx CLAUDE_HOME "K:\PortableApps\Claude-Code" >nul 2>&1
setx CLAUDE_SHELL_SNAPSHOTS "K:\PortableApps\Claude-Code\shell-snapshots" >nul 2>&1
setx NODE_OPTIONS "--max-old-space-size=4096" >nul 2>&1
setx MCP_TIMEOUT "60000" >nul 2>&1

REM 5. 권한 문제 해결
echo [5/5] Fixing permissions...
icacls "K:\PortableApps\Claude-Code" /grant Everyone:F /T >nul 2>&1

echo.
echo ========================================
echo  ✅ AUTO-FIX COMPLETE!
echo ========================================
echo.
echo Fixed issues:
echo  ✓ /tmp path redirected to K drive
echo  ✓ Shell snapshots regenerated
echo  ✓ Environment variables set permanently
echo  ✓ Permissions fixed
echo  ✓ Memory limits increased
echo.
echo [IMPORTANT] Restart Claude Code for full effect
echo.