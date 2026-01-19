@echo off
:: Ollama 설치 검증 스크립트

echo ========================================
echo    Ollama 설치 검증
echo ========================================
echo.

set ERRORS=0

:: 1. Ollama 명령어 확인
echo [*] 1/5: Ollama 명령어 확인...
ollama --version >nul 2>&1
if errorlevel 1 (
    echo [X] 실패: ollama 명령어를 찾을 수 없습니다.
    echo     Ollama가 설치되지 않았거나 PATH에 없습니다.
    set /a ERRORS+=1
) else (
    echo [+] 성공: Ollama 명령어 사용 가능
    ollama --version
)
echo.

:: 2. Ollama 서비스 실행 확인
echo [*] 2/5: Ollama 서비스 실행 확인...
tasklist | find "ollama" >nul 2>&1
if errorlevel 1 (
    echo [!] 경고: Ollama 서비스가 실행되지 않았습니다.
    echo [*] 서비스 시작 시도...
    start /B ollama serve >nul 2>&1
    timeout /t 3 >nul
    tasklist | find "ollama" >nul 2>&1
    if errorlevel 1 (
        echo [X] 실패: 서비스를 시작할 수 없습니다.
        set /a ERRORS+=1
    ) else (
        echo [+] 성공: 서비스가 시작되었습니다.
    )
) else (
    echo [+] 성공: Ollama 서비스 실행 중
)
echo.

:: 3. 환경 변수 확인
echo [*] 3/5: 환경 변수 확인...
if "%OLLAMA_MODELS%"=="" (
    echo [X] 실패: OLLAMA_MODELS 환경 변수가 설정되지 않았습니다.
    echo     ollama-setup-env.bat을 실행해주세요.
    set /a ERRORS+=1
) else (
    echo [+] 성공: OLLAMA_MODELS = %OLLAMA_MODELS%
)
echo.

:: 4. 모델 디렉토리 확인
echo [*] 4/5: 모델 디렉토리 확인...
if not exist "K:\PortableApps\Claude-Code\ollama-models" (
    echo [X] 실패: 모델 디렉토리가 존재하지 않습니다.
    set /a ERRORS+=1
) else (
    echo [+] 성공: 모델 디렉토리 존재
)
echo.

:: 5. 다운로드된 모델 확인
echo [*] 5/5: 다운로드된 모델 확인...
ollama list >nul 2>&1
if errorlevel 1 (
    echo [!] 경고: 모델 목록을 가져올 수 없습니다.
    set /a ERRORS+=1
) else (
    echo [+] 다운로드된 모델 목록:
    ollama list
)
echo.

:: 6. API 테스트
echo [*] 추가: API 응답 테스트...
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo [!] 경고: Ollama API에 연결할 수 없습니다.
    echo     포트 11434가 사용 가능한지 확인해주세요.
) else (
    echo [+] 성공: Ollama API 응답 정상
)
echo.

:: 결과 출력
echo ========================================
if %ERRORS%==0 (
    echo [+] 모든 검증 통과!
    echo     Ollama가 정상적으로 설치되었습니다.
    echo.
    echo [*] 다음 단계:
    echo     - 모델 다운로드: ollama-download-models.bat
    echo     - Phase 6.3: Ollama + LangChain 통합 테스트
) else (
    echo [X] %ERRORS%개의 오류 발견
    echo     OLLAMA-INSTALL-GUIDE.md를 참조하여 문제를 해결해주세요.
)
echo ========================================
echo.

pause
