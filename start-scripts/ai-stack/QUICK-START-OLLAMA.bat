@echo off
:: Ollama 빠른 시작 스크립트
:: Phase 6.1 자동화 헬퍼

echo ==========================================
echo    Ollama 빠른 시작
echo ==========================================
echo.

:: Ollama 설치 확인
ollama --version >nul 2>&1
if errorlevel 1 (
    echo [X] Ollama가 설치되지 않았습니다!
    echo.
    echo [*] 설치 방법:
    echo     1. https://ollama.com/download/windows 접속
    echo     2. OllamaSetup.exe 다운로드 및 실행
    echo     3. 설치 완료 후 이 스크립트 다시 실행
    echo.
    pause
    exit /b 1
)

echo [+] Ollama 설치 확인됨
ollama --version
echo.

:: 메뉴
echo 무엇을 하시겠습니까?
echo.
echo [1] 환경 변수 설정 (K-drive)
echo [2] 모델 다운로드
echo [3] 설치 검증
echo [4] 전체 자동 설정 (1+2+3)
echo [0] 종료
echo.

set /p choice="선택 (0-4): "

if "%choice%"=="1" goto env
if "%choice%"=="2" goto download
if "%choice%"=="3" goto verify
if "%choice%"=="4" goto auto
if "%choice%"=="0" goto end
goto invalid

:env
echo.
call ollama-setup-env.bat
goto end

:download
echo.
call ollama-download-models.bat
goto end

:verify
echo.
call ollama-verify.bat
goto end

:auto
echo.
echo [*] 전체 자동 설정 시작...
echo.
echo [1/3] 환경 변수 설정...
call ollama-setup-env.bat
echo.
echo [2/3] 모델 다운로드...
echo [!] Mistral 모델을 자동으로 다운로드합니다 (4GB)
ollama pull mistral
echo.
echo [3/3] 설치 검증...
call ollama-verify.bat
echo.
echo [+] 전체 설정 완료!
goto end

:invalid
echo [!] 잘못된 선택입니다.
pause
goto end

:end
echo.
pause
