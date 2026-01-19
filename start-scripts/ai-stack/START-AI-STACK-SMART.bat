@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 환경 변수 설정
set PYTHONUSERBASE=K:\PortableApps\Claude-Code\python-packages
set OLLAMA_MODELS=K:\PortableApps\Claude-Code\ollama-models
set PATH=%PATH%;K:\PortableApps\tools\nodejs;K:\PortableApps\tools\python

echo ==========================================
echo    AI Stack - 스마트 런처
echo    포트 충돌 자동 감지
echo ==========================================
echo.

:menu
echo [*] 서비스 상태 확인 중...
echo.

:: Ollama 체크 (11434)
call :check_port 11434 OLLAMA_STATUS
if "%OLLAMA_STATUS%"=="RUNNING" (
    echo [+] Ollama      : 실행 중 ^(127.0.0.1:11434^)
) else (
    echo [-] Ollama      : 중지됨 ^(포트 11434 사용 가능^)
)

:: Flowise 체크 (3000)
call :check_port 3000 FLOWISE_STATUS
if "%FLOWISE_STATUS%"=="RUNNING" (
    echo [+] Flowise     : 실행 중 ^(localhost:3000^)
) else (
    echo [-] Flowise     : 중지됨 ^(포트 3000 사용 가능^)
)

:: Qdrant 체크 (6333)
call :check_port 6333 QDRANT_STATUS
if "%QDRANT_STATUS%"=="RUNNING" (
    echo [+] Qdrant      : 실행 중 ^(localhost:6333^)
) else (
    echo [-] Qdrant      : 중지됨 ^(포트 6333 사용 가능^)
)

:: LiteLLM 체크 (8000)
call :check_port 8000 LITELLM_STATUS
if "%LITELLM_STATUS%"=="RUNNING" (
    echo [+] LiteLLM     : 실행 중 ^(localhost:8000^)
) else (
    echo [-] LiteLLM     : 중지됨 ^(포트 8000 사용 가능^)
)

echo.
echo ==========================================
echo    메뉴
echo ==========================================
echo.
echo [1] Ollama 시작/재시작
echo [2] Flowise 시작
echo [3] Qdrant 시작
echo [4] LiteLLM 시작
echo.
echo [5] 전체 시작 (충돌 체크)
echo [6] 전체 중지
echo [7] 포트 상세 확인
echo.
echo [0] 종료
echo.

set /p choice="선택 (0-7): "

if "%choice%"=="1" goto ollama
if "%choice%"=="2" goto flowise
if "%choice%"=="3" goto qdrant
if "%choice%"=="4" goto litellm
if "%choice%"=="5" goto start_all
if "%choice%"=="6" goto stop_all
if "%choice%"=="7" goto port_detail
if "%choice%"=="0" goto end
goto menu

:ollama
echo.
echo [*] Ollama 시작 중...
if "%OLLAMA_STATUS%"=="RUNNING" (
    echo [!] Ollama가 이미 실행 중입니다.
    echo [*] 재시작하시겠습니까? ^(Y/N^)
    set /p restart_choice="선택: "
    if /i "!restart_choice!"=="Y" (
        echo [*] Ollama 종료 중...
        taskkill /F /IM ollama.exe >nul 2>&1
        timeout /t 2 /nobreak >nul
    ) else (
        goto menu
    )
)

echo [*] Ollama 시작...
start "Ollama Server" cmd /c "set OLLAMA_MODELS=K:\PortableApps\Claude-Code\ollama-models && K:/PortableApps/Claude-Code/ollama/ollama.exe serve"
timeout /t 3 /nobreak >nul
echo [+] 완료! http://127.0.0.1:11434
pause
goto menu

:flowise
echo.
echo [*] Flowise 시작 중...
if "%FLOWISE_STATUS%"=="RUNNING" (
    echo [X] 포트 3000이 이미 사용 중입니다!
    echo [?] 다른 프로그램이 포트를 사용 중일 수 있습니다.
    pause
    goto menu
)

echo [*] Flowise 시작...
start "Flowise" cmd /c "cd K:\PortableApps\Claude-Code && npx flowise start"
echo [+] 완료! http://localhost:3000
pause
goto menu

:qdrant
echo.
echo [*] Qdrant 시작 중...
if "%QDRANT_STATUS%"=="RUNNING" (
    echo [X] 포트 6333이 이미 사용 중입니다!
    pause
    goto menu
)

echo [!] Qdrant는 수동 설치가 필요합니다.
echo [?] Docker 또는 standalone 버전을 사용하세요.
pause
goto menu

:litellm
echo.
echo [*] LiteLLM 시작 중...
if "%LITELLM_STATUS%"=="RUNNING" (
    echo [X] 포트 8000이 이미 사용 중입니다!
    pause
    goto menu
)

echo [*] LiteLLM 시작...
start "LiteLLM" cmd /c "cd K:\PortableApps\Claude-Code && K:\PortableApps\tools\python\python.exe -m litellm --port 8000"
echo [+] 완료! http://localhost:8000
pause
goto menu

:start_all
echo.
echo [*] 전체 시작 (충돌 자동 감지)
echo.

if "%OLLAMA_STATUS%"=="FREE" (
    echo [*] Ollama 시작...
    start "Ollama Server" cmd /c "set OLLAMA_MODELS=K:\PortableApps\Claude-Code\ollama-models && K:/PortableApps/Claude-Code/ollama/ollama.exe serve"
    timeout /t 2 /nobreak >nul
) else (
    echo [!] Ollama 이미 실행 중 - 스킵
)

if "%FLOWISE_STATUS%"=="FREE" (
    echo [*] Flowise 시작...
    start "Flowise" cmd /c "cd K:\PortableApps\Claude-Code && npx flowise start"
    timeout /t 2 /nobreak >nul
) else (
    echo [!] Flowise 이미 실행 중 - 스킵
)

echo.
echo [+] 시작 가능한 서비스 모두 실행!
pause
goto menu

:stop_all
echo.
echo [*] 전체 중지 중...
taskkill /F /IM ollama.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
echo [+] 완료!
pause
goto menu

:port_detail
echo.
echo [*] 포트 상세 정보
echo.
netstat -ano | findstr ":11434 :3000 :6333 :8000 :8501 :7860"
echo.
pause
goto menu

:check_port
netstat -ano | findstr ":%~1 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    set "%~2=FREE"
) else (
    set "%~2=RUNNING"
)
exit /b

:end
echo.
echo [*] 종료
exit /b 0
