@echo off
setlocal EnableDelayedExpansion

REM =============================================================================
REM MONITOR-RUNPOD-COST.bat
REM RunPod GPU 실시간 비용 모니터링 (백그라운드)
REM =============================================================================

echo.
echo [*] RunPod Cost Monitor
echo [*] K-Drive Portable Environment
echo.

REM UTF-8 인코딩 설정
chcp 65001 >nul 2>&1

REM Python 경로 설정
set PYTHON_EXE=K:\PortableApps\tools\python\python.exe
set RUNPOD_SCRIPTS=K:\PortableApps\Claude-Code\runpod\scripts
set MONITOR_SCRIPT=%RUNPOD_SCRIPTS%\monitor.py

REM monitor.py 존재 확인
if not exist "%MONITOR_SCRIPT%" (
    echo [-] monitor.py를 찾을 수 없습니다
    echo [!] 경로: %MONITOR_SCRIPT%
    pause
    exit /b 1
)

REM 백그라운드로 모니터링 시작
echo [*] 비용 모니터링 시작 중...
start "RunPod Cost Monitor" /MIN %PYTHON_EXE% %MONITOR_SCRIPT% monitor

REM 2초 대기 후 상태 확인
timeout /t 2 /nobreak >nul 2>&1

REM 프로세스 확인
tasklist /FI "WINDOWTITLE eq RunPod Cost Monitor*" | find "python.exe" >nul 2>&1
if errorlevel 1 (
    echo [-] 모니터링 시작 실패
    echo [!] logs/monitor.log를 확인하세요
    pause
    exit /b 1
)

echo.
echo ================================================================
echo [+] RunPod 비용 모니터링 시작 완료!
echo ================================================================
echo.
echo [*] 백그라운드에서 30초마다 비용 추적 중
echo [*] 로그: K:/PortableApps/Claude-Code/runpod/logs/monitor.log
echo [*] 기록: K:/PortableApps/Claude-Code/runpod/logs/cost-tracking.json
echo.
echo [!] 모니터링 종료 방법:
echo     1) Ctrl+C로 모니터 창 종료
echo     2) taskkill /FI "WINDOWTITLE eq *RunPod Cost Monitor*" /F
echo.
echo [*] 비용 리포트 보기:
echo     python runpod/scripts/monitor.py report
echo.
echo ================================================================

endlocal
