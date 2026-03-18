@echo off
:: AI 개발 스택 - IP 기반 실행 (포트 충돌 없음)
:: 각 서비스마다 독립 loopback IP 할당

setlocal enabledelayedexpansion

echo ==========================================
echo    AI 스택 - IP 기반 실행
echo    포트 충돌 걱정 없음!
echo ==========================================
echo.

:: 환경 변수 설정
set PYTHONUSERBASE=K:\PortableApps\genai\python-packages
set OLLAMA_MODELS=K:\PortableApps\genai\ollama-models
set PATH=%PATH%;K:\PortableApps\tools\nodejs;K:\PortableApps\tools\python

echo [*] IP 할당 현황:
echo.
echo     Ollama  : 127.0.0.2:11434
echo     Flowise : 127.0.0.3:3000
echo     Qdrant  : 127.0.0.4:6333
echo     LiteLLM : 127.0.0.5:8000
echo.
echo ==========================================
echo.

echo 무엇을 시작하시겠습니까?
echo.
echo [1] Ollama 시작 (127.0.0.2:11434)
echo [2] Flowise 시작 (127.0.0.3:3000)
echo [3] Qdrant 시작 (127.0.0.4:6333)
echo [4] LiteLLM 시작 (127.0.0.5:8000)
echo [5] 전체 시작 (모든 서비스)
echo [6] 실행 상태 확인
echo [7] IP 테스트 (연결 확인)
echo [0] 종료
echo.
set /p choice="선택 (0-7): "

if "%choice%"=="1" goto ollama
if "%choice%"=="2" goto flowise
if "%choice%"=="3" goto qdrant
if "%choice%"=="4" goto litellm
if "%choice%"=="5" goto all
if "%choice%"=="6" goto status
if "%choice%"=="7" goto test
if "%choice%"=="0" goto end
goto invalid

:ollama
echo.
echo [*] Ollama 서버 시작 중... (IP: 127.0.0.2)
start "Ollama@127.0.0.2" cmd /c "set OLLAMA_HOST=127.0.0.2:11434 && set OLLAMA_MODELS=K:\PortableApps\genai\ollama-models && K:/PortableApps/genai/ollama/ollama.exe serve"
timeout /t 3 /nobreak >nul
echo [+] Ollama 시작됨: http://127.0.0.2:11434
goto end

:flowise
echo.
echo [*] Flowise UI 시작 중... (IP: 127.0.0.3)
start "Flowise@127.0.0.3" cmd /c "set HOST=127.0.0.3 && set PORT=3000 && K:/PortableApps/tools/nodejs/npx.cmd flowise start"
timeout /t 5 /nobreak >nul
echo [+] Flowise 시작됨: http://127.0.0.3:3000
goto end

:qdrant
echo.
echo [*] Qdrant 시작 중... (IP: 127.0.0.4)
echo [!] Qdrant는 Docker/Podman 필요 또는 Python 서버 모드
echo [*] Python 클라이언트만 설치됨 (서버 별도 설치 필요)
echo.
echo [?] Qdrant 서버 설치 옵션:
echo     1. Docker: docker run -p 127.0.0.4:6333:6333 qdrant/qdrant
echo     2. 직접 다운로드: https://qdrant.tech/documentation/guides/installation/
pause
goto end

:litellm
echo.
echo [*] LiteLLM 프록시 시작 중... (IP: 127.0.0.5)
start "LiteLLM@127.0.0.5" cmd /c "set PYTHONUSERBASE=K:\PortableApps\genai\python-packages && python -m litellm --host 127.0.0.5 --port 8000"
timeout /t 3 /nobreak >nul
echo [+] LiteLLM 시작됨: http://127.0.0.5:8000
goto end

:all
echo.
echo [*] 모든 서비스 시작 중...
echo.
echo [1/4] Ollama 시작...
start "Ollama@127.0.0.2" cmd /c "set OLLAMA_HOST=127.0.0.2:11434 && set OLLAMA_MODELS=K:\PortableApps\genai\ollama-models && K:/PortableApps/genai/ollama/ollama.exe serve"
timeout /t 3 /nobreak >nul
echo [+] Ollama: http://127.0.0.2:11434

echo [2/4] Flowise 시작...
start "Flowise@127.0.0.3" cmd /c "set HOST=127.0.0.3 && set PORT=3000 && K:/PortableApps/tools/nodejs/npx.cmd flowise start"
timeout /t 5 /nobreak >nul
echo [+] Flowise: http://127.0.0.3:3000

echo [3/4] LiteLLM 시작...
start "LiteLLM@127.0.0.5" cmd /c "set PYTHONUSERBASE=K:\PortableApps\genai\python-packages && python -m litellm --host 127.0.0.5 --port 8000"
timeout /t 3 /nobreak >nul
echo [+] LiteLLM: http://127.0.0.5:8000

echo [4/4] 완료!
echo.
echo [+] 모든 서비스 시작 완료!
echo.
goto end

:status
echo.
echo [*] 실행 중인 AI 서비스 확인...
echo.
tasklist | findstr /i "ollama.exe node.exe python.exe" >nul 2>&1
if errorlevel 1 (
    echo [X] 실행 중인 서비스가 없습니다.
) else (
    echo [+] 실행 중인 프로세스:
    tasklist | findstr /i "ollama node python"
)
echo.
pause
goto end

:test
echo.
echo [*] IP 연결 테스트 중...
echo.
echo [1] Ollama (127.0.0.2:11434)
curl -s http://127.0.0.2:11434 >nul 2>&1 && echo [+] 연결 성공 || echo [X] 연결 실패
echo.
echo [2] Flowise (127.0.0.3:3000)
curl -s http://127.0.0.3:3000 >nul 2>&1 && echo [+] 연결 성공 || echo [X] 연결 실패
echo.
echo [3] LiteLLM (127.0.0.5:8000)
curl -s http://127.0.0.5:8000 >nul 2>&1 && echo [+] 연결 성공 || echo [X] 연결 실패
echo.
pause
goto end

:invalid
echo.
echo [!] 잘못된 선택입니다.
timeout /t 2 /nobreak >nul
goto end

:end
echo.
pause
