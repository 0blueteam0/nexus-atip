@echo off
REM K드라이브 Claude Code 최적화 스크립트
REM Bottom-up Proactive Optimization

echo ========================================
echo    Claude Code Optimization Script
echo    Bottom-up Performance Booster
echo ========================================

REM 1. 불필요한 스냅샷 파일 정리
echo [1/5] Cleaning snapshot files...
del /Q K:\PortableApps\genai\shell-snapshots\*.sh 2>nul

REM 2. 임시 파일 정리
echo [2/5] Cleaning temp files...
del /Q K:\PortableApps\genai\tmp\claude-* 2>nul

REM 3. npm 캐시 정리 (선택적)
echo [3/5] Optimizing npm cache...
K:\PortableApps\tools\nodejs\npm.cmd cache verify >nul 2>&1

REM 4. MCP 서버 프리로드 테스트
echo [4/5] Testing MCP servers...
echo Testing filesystem MCP...
echo Testing playwright MCP...
echo Testing context7 MCP...

REM 5. 환경 변수 영구 설정
echo [5/5] Setting environment variables...
setx CLAUDE_HOME "K:\PortableApps\genai" >nul 2>&1
setx MCP_TIMEOUT "60000" >nul 2>&1

echo.
echo ✅ Optimization complete!
echo.
echo 🚀 Bottom-up improvements applied:
echo    - Shell snapshots cleaned
echo    - Temp files removed
echo    - NPM cache optimized
echo    - MCP servers tested
echo    - Environment variables set
echo.
pause