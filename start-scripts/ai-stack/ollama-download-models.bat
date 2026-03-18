@echo off
:: Ollama 모델 다운로드 스크립트

echo [*] Ollama 모델 다운로드 시작...
echo.

:: 환경 변수 확인
echo [*] 모델 저장 경로: %OLLAMA_MODELS%
if "%OLLAMA_MODELS%"=="" (
    echo [!] 경고: OLLAMA_MODELS 환경 변수가 설정되지 않았습니다.
    echo [*] K-drive 경로로 설정 중...
    set OLLAMA_MODELS=K:\PortableApps\genai\ollama-models
)
echo.

:: 사용자 선택
echo 다운로드할 모델을 선택하세요:
echo.
echo [1] Mistral (4GB) - 빠르고 효율적, 일반 용도
echo [2] Llama 3.3 70B (40GB) - 최고 성능, 느리지만 정확
echo [3] Qwen 2.5 Coder (4GB) - 코딩 특화
echo [4] 모두 다운로드 (약 48GB)
echo [0] 취소
echo.

set /p choice="선택 (0-4): "

if "%choice%"=="1" goto mistral
if "%choice%"=="2" goto llama
if "%choice%"=="3" goto qwen
if "%choice%"=="4" goto all
if "%choice%"=="0" goto end
goto invalid

:mistral
echo.
echo [*] Mistral 다운로드 중...
ollama pull mistral
goto success

:llama
echo.
echo [*] Llama 3.3 70B 다운로드 중... (약 40GB, 시간이 걸릴 수 있습니다)
ollama pull llama3.3:70b
goto success

:qwen
echo.
echo [*] Qwen 2.5 Coder 다운로드 중...
ollama pull qwen2.5-coder
goto success

:all
echo.
echo [*] 모든 모델 다운로드 중... (약 48GB)
echo [*] Mistral 다운로드 중...
ollama pull mistral
echo [*] Llama 3.3 70B 다운로드 중...
ollama pull llama3.3:70b
echo [*] Qwen 2.5 Coder 다운로드 중...
ollama pull qwen2.5-coder
goto success

:invalid
echo [!] 잘못된 선택입니다.
goto end

:success
echo.
echo [+] 다운로드 완료!
echo.
echo [*] 다운로드된 모델 목록:
ollama list
echo.
echo [*] 모델 저장 위치 확인:
dir /s /b "%OLLAMA_MODELS%\*.gguf" 2>nul
if errorlevel 1 (
    echo [!] 모델 파일을 찾을 수 없습니다. 기본 경로를 확인해보세요.
    dir /s /b "%USERPROFILE%\.ollama\models\*.gguf" 2>nul
)
echo.

:end
pause
