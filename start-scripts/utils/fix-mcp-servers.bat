@echo off
echo [*] MCP 서버 최적화 스크립트 시작
echo.

REM 1. 백업 생성
echo [+] 설정 파일 백업 중...
copy K:\PortableApps\genai\.claude.json K:\PortableApps\genai\.claude.json.backup-%date:~0,4%%date:~5,2%%date:~8,2%

REM 2. ClaudeJsonCleanup 작업 비활성화
echo [+] 예약 작업 비활성화 중...
schtasks /Change /TN "ClaudeJsonCleanup" /DISABLE

REM 3. NPM 캐시 정리
echo [+] NPM 캐시 정리 중...
npm cache clean --force

REM 4. 고아 프로세스 정리
echo [+] 고아 Node.js 프로세스 정리 중...
for /f "skip=3 tokens=2 delims= " %%a in ('wmic process where "name='node.exe' and ParentProcessId=0" get ProcessId') do (
    taskkill /PID %%a /F 2>nul
)

echo.
echo [완료] MCP 서버 최적화 완료!
echo.
echo [!] 다음 단계:
echo 1. .claude.json 파일에서 "npx -y" → "npx"로 변경
echo 2. Bitdefender에서 K:\PortableApps 폴더 예외 추가
pause