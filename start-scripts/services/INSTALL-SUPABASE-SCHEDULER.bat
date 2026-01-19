@echo off
chcp 65001 >nul 2>&1
echo =====================================
echo   Windows 작업 스케줄러 등록
echo   Supabase 자동 활성화 (6일마다)
echo =====================================
echo.

REM 관리자 권한 확인
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [-] 관리자 권한이 필요합니다!
    echo     우클릭 → "관리자 권한으로 실행"
    pause
    exit /b 1
)

REM 작업 스케줄러 등록
echo [*] 작업 스케줄러 등록 중...
schtask /create ^
    /tn "Supabase Keep-Alive" ^
    /tr "K:\PortableApps\Claude-Code\SUPABASE-KEEP-ALIVE.bat" ^
    /sc DAILY ^
    /mo 6 ^
    /st 09:00 ^
    /f

if %errorLevel% == 0 (
    echo [+] 작업 스케줄러 등록 완료!
    echo.
    echo     작업 이름: Supabase Keep-Alive
    echo     실행 주기: 6일마다
    echo     실행 시간: 오전 9시
    echo.
    echo [*] 즉시 테스트 실행하시겠습니까? (Y/N)
    choice /c YN /n
    if errorlevel 2 goto end
    if errorlevel 1 (
        schtasks /run /tn "Supabase Keep-Alive"
        echo [+] 테스트 실행 완료
    )
) else (
    echo [-] 작업 스케줄러 등록 실패
)

:end
echo.
pause