@echo off
setlocal EnableDelayedExpansion

REM =============================================================================
REM STOP-RUNPOD-GPU.bat
REM RunPod GPU 인스턴스 안전 종료 및 비용 리포트
REM =============================================================================

echo.
echo [*] RunPod GPU Instance Shutdown
echo [*] K-Drive Portable Environment
echo.

REM UTF-8 인코딩 설정
chcp 65001 >nul 2>&1

REM Python 경로 설정
set PYTHON_EXE=K:\PortableApps\tools\python\python.exe
set RUNPOD_SCRIPTS=K:\PortableApps\Claude-Code\runpod\scripts

REM 인스턴스 ID 입력
echo [*] 중지할 인스턴스 정보
set /p INSTANCE_ID="Instance ID를 입력하세요: "

if "%INSTANCE_ID%"=="" (
    echo [-] Instance ID가 입력되지 않았습니다
    pause
    exit /b 1
)

echo.
echo [1/3] SSH 터널 종료 중...
taskkill /FI "WINDOWTITLE eq *ssh-tunnel*" /F >nul 2>&1
taskkill /FI "IMAGENAME eq python.exe" /FI "WINDOWTITLE eq *RunPod SSH Tunnel*" /F >nul 2>&1
timeout /t 2 /nobreak >nul 2>&1
echo [+] SSH 터널 종료 완료
echo.

echo [2/3] RunPod 인스턴스 중지 중...
%PYTHON_EXE% %RUNPOD_SCRIPTS%\manager.py stop %INSTANCE_ID%

if errorlevel 1 (
    echo [-] 인스턴스 중지 실패
    echo [!] 수동으로 RunPod 콘솔에서 확인하세요
)

echo [+] 인스턴스 중지 요청 완료
echo.

echo [3/3] 비용 리포트 생성 중...
REM monitor.py가 존재하면 실행
if exist "%RUNPOD_SCRIPTS%\monitor.py" (
    %PYTHON_EXE% %RUNPOD_SCRIPTS%\monitor.py report
) else (
    echo [!] 비용 모니터링 스크립트가 아직 설치되지 않았습니다
    echo [*] MONITOR-RUNPOD-COST.bat을 먼저 실행하세요
)

echo.
echo ================================================================
echo [+] RunPod GPU 환경 안전 종료 완료
echo ================================================================
echo.
echo [*] 인스턴스: %INSTANCE_ID%
echo [*] 상태: 중지됨
echo.
echo [!] 완전 삭제하려면: manager.py terminate %INSTANCE_ID%
echo ================================================================

pause
endlocal
