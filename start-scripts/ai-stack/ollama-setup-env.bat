@echo off
:: Ollama 환경 변수 설정 스크립트
:: K-drive에 모델을 저장하도록 설정

echo [*] Ollama 환경 변수 설정 중...

:: OLLAMA_MODELS 환경 변수를 K-drive로 설정
setx OLLAMA_MODELS "K:\PortableApps\genai\ollama-models"

echo [+] 환경 변수 설정 완료!
echo.
echo OLLAMA_MODELS = K:\PortableApps\genai\ollama-models
echo.
echo [!] 변경사항 적용을 위해 터미널을 재시작하거나 다음 명령어 실행:
echo     set OLLAMA_MODELS=K:\PortableApps\genai\ollama-models
echo.

:: 현재 세션에도 적용
set OLLAMA_MODELS=K:\PortableApps\genai\ollama-models

echo [*] 현재 세션에 적용 완료
echo.
pause
