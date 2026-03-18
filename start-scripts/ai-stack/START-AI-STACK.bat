@echo off
:: AI 개발 스택 통합 시작 스크립트
:: K드라이브 포터블 환경

echo ==========================================
echo    AI 개발 스택 통합 시작
echo ==========================================
echo.

:: 환경 변수 설정
echo [*] 환경 변수 설정 중...
set PYTHONUSERBASE=K:\PortableApps\genai\python-packages
set OLLAMA_MODELS=K:\PortableApps\genai\ollama-models
set PATH=%PATH%;K:\PortableApps\tools\nodejs;K:\PortableApps\tools\python

echo [+] 환경 변수 설정 완료
echo.

:: 메뉴
echo 무엇을 시작하시겠습니까?
echo.
echo [1] Ollama 서버 시작
echo [2] Flowise UI 시작
echo [3] 전체 시작 (Ollama + Flowise)
echo [4] Python REPL (AI 라이브러리 로드)
echo [5] 설치 상태 확인
echo [0] 종료
echo.

set /p choice="선택 (0-5): "

if "%choice%"=="1" goto ollama
if "%choice%"=="2" goto flowise
if "%choice%"=="3" goto all
if "%choice%"=="4" goto python
if "%choice%"=="5" goto check
if "%choice%"=="0" goto end
goto invalid

:ollama
echo.
echo [*] Ollama 서버 시작 중...
start "Ollama Server" cmd /c "set OLLAMA_MODELS=K:\PortableApps\genai\ollama-models && K:/PortableApps/genai/ollama/ollama.exe serve"
echo [+] Ollama 서버가 백그라운드에서 시작되었습니다
echo [+] 서버 주소: http://127.0.0.1:11434
echo.
pause
goto end

:flowise
echo.
echo [*] Flowise UI 시작 중...
echo [!] 브라우저에서 http://localhost:3000 을 열어주세요
echo.
start "Flowise UI" cmd /c "K:/PortableApps/tools/nodejs/npx.cmd flowise start"
echo [+] Flowise가 백그라운드에서 시작되었습니다
echo.
pause
goto end

:all
echo.
echo [*] 전체 스택 시작 중...
echo.
echo [1/2] Ollama 서버 시작...
start "Ollama Server" cmd /c "set OLLAMA_MODELS=K:\PortableApps\genai\ollama-models && K:/PortableApps/genai/ollama/ollama.exe serve"
timeout /t 3 /nobreak >nul
echo [+] Ollama 서버 시작됨 (http://127.0.0.1:11434)
echo.
echo [2/2] Flowise UI 시작...
start "Flowise UI" cmd /c "K:/PortableApps/tools/nodejs/npx.cmd flowise start"
echo [+] Flowise UI 시작됨 (http://localhost:3000)
echo.
echo [+] 전체 스택이 백그라운드에서 실행 중입니다!
echo.
pause
goto end

:python
echo.
echo [*] Python AI 환경 시작 중...
echo [!] CrewAI, LiteLLM, Qdrant 라이브러리 사용 가능
echo.
start "Python AI REPL" cmd /k "set PYTHONUSERBASE=K:\PortableApps\genai\python-packages && python"
echo [+] Python REPL이 열렸습니다
echo.
pause
goto end

:check
echo.
echo [*] 설치 상태 확인 중...
echo.

:: Ollama 확인
echo [1] Ollama:
if exist "K:\PortableApps\genai\ollama\ollama.exe" (
    echo    [+] 설치됨 - K:/PortableApps/genai/ollama/
    K:/PortableApps/genai/ollama/ollama.exe --version
) else (
    echo    [-] 미설치
)
echo.

:: Python 패키지 확인
echo [2] Python 패키지:
set PYTHONUSERBASE=K:\PortableApps\genai\python-packages
python -m pip list --user | findstr /i "crewai qdrant litellm streamlit gradio"
echo.

:: Node.js 패키지 확인
echo [3] Node.js 패키지:
K:/PortableApps/tools/nodejs/npm.cmd list -g flowise
echo.

echo [+] 상태 확인 완료
echo.
pause
goto end

:invalid
echo [!] 잘못된 선택입니다.
pause
goto end

:end
echo.
