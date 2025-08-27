@echo off
chcp 65001 >nul 2>&1
title Terminal Freeze Fix

echo [*] VSCode 터미널 멈춤 문제 해결 시작...
echo.

REM VSCode 설정 적용 알림
echo [1] VSCode 설정 최적화됨
echo    - 터미널 버퍼: 50000줄
echo    - GPU 가속 비활성화
echo    - DOM 렌더러 사용
echo.

REM MCP 출력 최소화 활성화
echo [2] MCP 출력 필터 활성화...
K:\PortableApps\tools\nodejs\node.exe K:\PortableApps\Claude-Code\systems\mcp-output-minimizer.js
echo.

REM npm 패키지 설치 (chalk 필요)
echo [3] 필요 패키지 확인...
cd /d K:\PortableApps\Claude-Code
if not exist node_modules\chalk (
    echo    - chalk 설치 중...
    K:\PortableApps\tools\nodejs\npm.cmd install chalk --no-save --silent
)
echo.

echo [+] 터미널 최적화 완료!
echo.
echo 효과:
echo - Shrimp Task 대량 출력 자동 축약
echo - MCP 도구 JSON 최소화
echo - 터미널 응답성 개선
echo.
echo VSCode를 재시작하면 설정이 적용됩니다.
pause