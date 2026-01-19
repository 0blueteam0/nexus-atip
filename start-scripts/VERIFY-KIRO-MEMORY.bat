@echo off
chcp 65001 >nul 2>&1
echo =====================================
echo   Kiro-Memory 설치 상태 확인
echo =====================================
echo.

echo [*] Python 모듈 확인...
K:\PortableApps\tools\python-portable\python.exe -c "import mcp_server_enhanced; print('[+] kiro-memory 모듈 정상')"

echo.
echo [*] MCP 서버 연결 테스트...
K:\PortableApps\Claude-Code\claude.bat mcp list | findstr "kiro-memory"

echo.
echo [+] 검증 완료!
pause