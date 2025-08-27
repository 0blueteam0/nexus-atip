@echo off
:: Windows 작업 스케줄러에 자동 시작 등록
:: 컴퓨터 켜질 때마다 자동으로 모든 시스템 시작

echo ============================================
echo    CLAUDE AUTO-STARTUP INSTALLER
echo ============================================
echo.

:: 관리자 권한 확인
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] 관리자 권한이 필요합니다.
    echo     우클릭 - "관리자 권한으로 실행"
    pause
    exit /b 1
)

:: 작업 스케줄러에 등록
echo [1/3] Windows 시작 시 자동 실행 등록 중...
schtasks /create /tn "ClaudeAutoExecutor" /tr "K:\PortableApps\tools\nodejs\node.exe K:\PortableApps\Claude-Code\systems\auto-executor.js" /sc onstart /ru SYSTEM /f >nul 2>&1

echo [2/3] 로그온 시 자동 실행 등록 중...  
schtasks /create /tn "ClaudeAutoStartup" /tr "K:\PortableApps\Claude-Code\AUTO-STARTUP.bat" /sc onlogon /rl highest /f >nul 2>&1

echo [3/3] 30분마다 자동 체크 등록 중...
schtasks /create /tn "ClaudeAutoMonitor" /tr "K:\PortableApps\Claude-Code\systems\auto-executor.js" /sc minute /mo 30 /f >nul 2>&1

:: 즉시 시작
echo.
echo 지금 바로 자동 시스템을 시작하시겠습니까? (Y/N)
set /p START=선택: 
if /i "%START%"=="Y" (
    echo.
    echo 자율 시스템 시작 중...
    start /B node "K:\PortableApps\Claude-Code\systems\auto-executor.js"
    start /B "K:\PortableApps\Claude-Code\AUTO-STARTUP.bat"
)

echo.
echo ============================================
echo    설치 완료!
echo ============================================
echo.
echo 다음 작업이 등록되었습니다:
echo   - Windows 시작 시 자동 실행
echo   - 사용자 로그인 시 자동 실행  
echo   - 30분마다 자동 모니터링
echo.
echo 제거하려면: schtasks /delete /tn "ClaudeAuto*" /f
echo.
pause