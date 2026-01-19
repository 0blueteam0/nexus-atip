
if "%POD_IP%"=="" (
    echo [-] IP 주소가 입력되지 않았습니다
    pause
    exit /b 1
)

echo [+] Pod IP: %POD_IP%
echo.

REM 4. SSH 터널 시작 (백그라운드)
echo [4/4] SSH 터널 생성 중...
start /B "RunPod SSH Tunnel" %PYTHON_EXE% %RUNPOD_SCRIPTS%\ssh-tunnel.py %POD_IP%

REM 터널 연결 대기
timeout /t 5 /nobreak >nul 2>&1

echo.
echo ================================================================
echo [+] RunPod GPU 환경 준비 완료!
echo ================================================================
echo.
echo [*] Jupyter Lab: http://localhost:8888
echo [*] SSH 터널: %POD_IP%:8888 -^> localhost:8888
echo.
echo [!] 종료하려면: STOP-RUNPOD-GPU.bat 실행
echo [!] 비용 모니터링: MONITOR-RUNPOD-COST.bat 실행
echo.
echo ================================================================

endlocal
