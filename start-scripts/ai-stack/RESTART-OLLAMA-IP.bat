@echo off
:: Ollama를 특정 IP로 재시작

echo [*] 기존 Ollama 종료 중...
taskkill /F /IM ollama.exe >nul 2>&1

echo [*] 2초 대기...
timeout /t 2 /nobreak >nul

echo [*] Ollama 127.0.0.2:11434로 시작...
set OLLAMA_HOST=127.0.0.2:11434
set OLLAMA_MODELS=K:\PortableApps\Claude-Code\ollama-models

start "Ollama@127.0.0.2" K:/PortableApps/Claude-Code/ollama/ollama.exe serve

echo [+] 완료!
echo.
echo 접속 주소: http://127.0.0.2:11434
echo.
pause
