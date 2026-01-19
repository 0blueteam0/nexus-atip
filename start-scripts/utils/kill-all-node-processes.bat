@echo off
echo [!] 모든 Node.js 프로세스 강제 종료 스크립트
echo.
echo [*] 현재 Node.js 프로세스 개수 확인 중...

for /f %%i in ('powershell -Command "(Get-Process -Name node -ErrorAction SilentlyContinue).Count"') do set BEFORE=%%i
echo    현재: %BEFORE%개 실행 중

echo.
echo [+] 모든 Node.js 프로세스 종료 중...

REM 1. taskkill로 종료 시도
taskkill /F /IM node.exe 2>nul

REM 2. PowerShell로 강제 종료
powershell -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force" 2>nul

REM 3. WMIC로 고아 프로세스 종료
for /f "skip=1 tokens=2" %%a in ('wmic process where "name='node.exe'" get ProcessId 2^>nul') do (
    if not "%%a"=="" (
        taskkill /PID %%a /F 2>nul
    )
)

echo.
echo [*] 종료 결과 확인 중...
timeout /t 2 /nobreak >nul

for /f %%i in ('powershell -Command "(Get-Process -Name node -ErrorAction SilentlyContinue).Count"') do set AFTER=%%i

echo.
echo ========================================
echo [완료] 프로세스 정리 결과
echo ========================================
echo    처리 전: %BEFORE%개
echo    처리 후: %AFTER%개

if "%AFTER%"=="0" (
    echo    [+] 모든 프로세스가 성공적으로 종료되었습니다!
) else (
    echo    [!] %AFTER%개 프로세스가 남아있습니다.
    echo    [!] Claude Desktop 재시작이 필요할 수 있습니다.
)

echo.
echo ========================================
echo [권장 후속 조치]
echo ========================================
echo 1. Claude Desktop 완전히 종료 (시스템 트레이 확인)
echo 2. 이 스크립트 다시 실행
echo 3. Claude Desktop 재시작
echo 4. .claude.json 설정이 적용되었는지 확인
echo.
pause