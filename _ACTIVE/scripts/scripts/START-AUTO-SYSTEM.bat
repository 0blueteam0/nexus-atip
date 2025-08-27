@echo off
title 🤖 AUTO-SYSTEM V2.0
cls

echo ============================================
echo   🤖 자율 운영 시스템 V2.0
echo ============================================
echo.
echo 기능:
echo   - MCP 14개 서버 자동 관리
echo   - 메모리 자동 최적화
echo   - 에러 자동 복구
echo   - 성능 모니터링
echo.
echo ============================================
echo.

REM 환경 설정
set NODE_PATH=K:\PortableApps\tools\nodejs
set PATH=%NODE_PATH%;%PATH%

REM 시스템 시작
echo 🚀 자율 시스템 시작 중...
cd /d K:\PortableApps\Claude-Code\systems
K:\PortableApps\tools\nodejs\node.exe AUTO-SYSTEM-V2.js

pause