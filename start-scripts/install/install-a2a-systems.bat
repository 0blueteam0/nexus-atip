@echo off
chcp 65001
echo.
echo ================================================================
echo  A2A (Agent-to-Agent) 통신 시스템 통합 설치 스크립트
echo  - zen-mcp-server (Multi-Model Orchestration)
echo  - A2A-MCP-Server (A2A Protocol Bridge)
echo ================================================================
echo.

set "BASE_DIR=K:\PortableApps\genai"
set "MCP_DIR=%BASE_DIR%\mcp-servers"
set "PYTHON_EXE=K:\PortableApps\tools\python\python.exe"
set "PIP_EXE=K:\PortableApps\tools\python\Scripts\pip.exe"

echo [1/6] 디렉토리 구조 확인...
if not exist "%MCP_DIR%" (
    mkdir "%MCP_DIR%"
    echo [+] MCP 서버 디렉토리 생성: %MCP_DIR%
)

cd /d "%MCP_DIR%"

echo.
echo [2/6] zen-mcp-server 설치...
if not exist "zen-mcp-server" (
    echo [*] zen-mcp-server 클론 중...
    git clone https://github.com/BeehiveInnovations/zen-mcp-server.git
    if errorlevel 1 (
        echo [-] zen-mcp-server 클론 실패
        pause
        exit /b 1
    )
    echo [+] zen-mcp-server 클론 완료
) else (
    echo [!] zen-mcp-server 이미 존재함 - 업데이트 중...
    cd zen-mcp-server
    git pull origin main
    cd ..
)

echo [*] zen-mcp-server 의존성 설치...
cd zen-mcp-server
"%PYTHON_EXE%" -m pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [-] zen-mcp-server 의존성 설치 실패
    pause
    exit /b 1
)
echo [+] zen-mcp-server 설치 완료
cd ..

echo.
echo [3/6] A2A-MCP-Server 설치...
if not exist "A2A-MCP-Server" (
    echo [*] A2A-MCP-Server 클론 중...
    git clone https://github.com/GongRzhe/A2A-MCP-Server.git
    if errorlevel 1 (
        echo [-] A2A-MCP-Server 클론 실패
        pause
        exit /b 1
    )
    echo [+] A2A-MCP-Server 클론 완료
) else (
    echo [!] A2A-MCP-Server 이미 존재함 - 업데이트 중...
    cd A2A-MCP-Server
    git pull origin main
    cd ..
)

echo [*] A2A-MCP-Server 가상환경 및 의존성 설치...
cd A2A-MCP-Server
if not exist ".venv" (
    "%PYTHON_EXE%" -m venv .venv
    echo [+] 가상환경 생성 완료
)

call .venv\Scripts\activate.bat
python -m pip install --upgrade pip --quiet
python -m pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [-] A2A-MCP-Server 의존성 설치 실패
    pause
    exit /b 1
)
echo [+] A2A-MCP-Server 설치 완료
deactivate
cd ..

echo.
echo [4/6] 설정 파일 생성...

:: Claude Desktop 설정 파일 생성
set "CONFIG_FILE=%BASE_DIR%\claude_desktop_config_a2a.json"
echo [*] Claude Desktop 설정 파일 생성: %CONFIG_FILE%

(
echo {
echo   "mcpServers": {
echo     "zen": {
echo       "command": "K:\\PortableApps\\tools\\python\\python.exe",
echo       "args": [
echo         "K:\\PortableApps\\genai\\mcp-servers\\zen-mcp-server\\zen_mcp_server.py"
echo       ],
echo       "env": {
echo         "GEMINI_API_KEY": "${GEMINI_API_KEY}",
echo         "OPENAI_API_KEY": "${OPENAI_API_KEY}",
echo         "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}",
echo         "XAI_API_KEY": "${XAI_API_KEY}",
echo         "DEFAULT_MODEL": "pro",
echo         "DEFAULT_THINKING_MODE_THINKDEEP": "high",
echo         "LOG_LEVEL": "INFO",
echo         "CONVERSATION_TIMEOUT_HOURS": "6",
echo         "MAX_CONVERSATION_TURNS": "50",
echo         "DISABLED_TOOLS": "analyze,refactor,testgen,secaudit,docgen,tracer"
echo       }
echo     },
echo     "a2a": {
echo       "command": "K:\\PortableApps\\genai\\mcp-servers\\A2A-MCP-Server\\.venv\\Scripts\\python.exe",
echo       "args": [
echo         "K:\\PortableApps\\genai\\mcp-servers\\A2A-MCP-Server\\a2a_mcp_server.py"
echo       ],
echo       "env": {
echo         "MCP_TRANSPORT": "stdio",
echo         "PYTHONPATH": "K:\\PortableApps\\genai\\mcp-servers\\A2A-MCP-Server",
echo         "MCP_DEBUG": "false"
echo       }
echo     }
echo   },
echo   "globalShortcut": "Ctrl+Shift+A"
echo }
) > "%CONFIG_FILE%"

echo [+] 설정 파일 생성 완료

echo.
echo [5/6] 테스트 스크립트 생성...

:: zen 테스트 스크립트
set "ZEN_TEST=%BASE_DIR%\test-zen-mcp.py"
(
echo """
echo zen-mcp-server 기능 테스트 스크립트
echo """
echo import sys
echo import os
echo import json
echo from datetime import datetime
echo.
echo def test_zen_installation^(^):
echo     """ZEN MCP 서버 설치 상태 확인"""
echo     print^("［*］ ZEN MCP 서버 설치 테스트..."^)
echo     
echo     zen_path = r"K:\PortableApps\genai\mcp-servers\zen-mcp-server"
echo     requirements_path = os.path.join^(zen_path, "requirements.txt"^)
echo     server_path = os.path.join^(zen_path, "zen_mcp_server.py"^)
echo     
echo     if os.path.exists^(zen_path^):
echo         print^(f"［+］ ZEN 디렉토리 존재: {zen_path}"^)
echo     else:
echo         print^(f"［-］ ZEN 디렉토리 없음: {zen_path}"^)
echo         return False
echo         
echo     if os.path.exists^(requirements_path^):
echo         print^(f"［+］ requirements.txt 존재"^)
echo     else:
echo         print^(f"［-］ requirements.txt 없음"^)
echo         
echo     if os.path.exists^(server_path^):
echo         print^(f"［+］ 서버 스크립트 존재"^)
echo     else:
echo         print^(f"［-］ 서버 스크립트 없음"^)
echo         
echo     return True
echo.
echo def show_usage_guide^(^):
echo     """사용법 가이드 출력"""
echo     guide = """
echo ================================================================
echo                    ZEN MCP 서버 사용 가이드
echo ================================================================
echo.
echo 1. API 키 설정:
echo    - GEMINI_API_KEY: Google Gemini API 키
echo    - OPENAI_API_KEY: OpenAI API 키  
echo    - OPENROUTER_API_KEY: OpenRouter API 키
echo.
echo 2. Claude Desktop에서 테스트:
echo    다음 프롬프트를 사용하세요:
echo    
echo    "다음 Python 코드를 다각도로 분석해줘:
echo    
echo    def fibonacci^(n^):
echo        if n ^<= 1:
echo            return n
echo        return fibonacci^(n-1^) + fibonacci^(n-2^)
echo    
echo    요청사항:
echo    1. Gemini로 알고리즘 복잡도 분석
echo    2. O3로 최적화 방안 제시
echo    3. 종합적인 개선 코드 작성"
echo.
echo 3. 설정 파일 위치:
echo    K:\PortableApps\genai\claude_desktop_config_a2a.json
echo.
echo ================================================================
echo     """
echo     print^(guide^)
echo.
echo if __name__ == "__main__":
echo     print^(f"테스트 시작 시간: {datetime.now^(^)}"^)
echo     
echo     if test_zen_installation^(^):
echo         print^("［+］ ZEN MCP 서버 설치 확인 완료"^)
echo         show_usage_guide^(^)
echo     else:
echo         print^("［-］ ZEN MCP 서버 설치 문제 발견"^)
echo         
echo     input^("엔터를 눌러 종료..."^)
) > "%ZEN_TEST%"

:: A2A 테스트 스크립트  
set "A2A_TEST=%BASE_DIR%\test-a2a-bridge.py"
(
echo """
echo A2A-MCP-Server 브리지 테스트 스크립트
echo """
echo import sys
echo import os
echo import json
echo from datetime import datetime
echo.
echo def test_a2a_installation^(^):
echo     """A2A MCP 서버 설치 상태 확인"""
echo     print^("［*］ A2A MCP 서버 설치 테스트..."^)
echo     
echo     a2a_path = r"K:\PortableApps\genai\mcp-servers\A2A-MCP-Server"
echo     venv_path = os.path.join^(a2a_path, ".venv"^)
echo     server_path = os.path.join^(a2a_path, "a2a_mcp_server.py"^)
echo     
echo     if os.path.exists^(a2a_path^):
echo         print^(f"［+］ A2A 디렉토리 존재: {a2a_path}"^)
echo     else:
echo         print^(f"［-］ A2A 디렉토리 없음: {a2a_path}"^)
echo         return False
echo         
echo     if os.path.exists^(venv_path^):
echo         print^(f"［+］ 가상환경 존재"^)
echo     else:
echo         print^(f"［-］ 가상환경 없음"^)
echo         
echo     if os.path.exists^(server_path^):
echo         print^(f"［+］ 서버 스크립트 존재"^)
echo     else:
echo         print^(f"［-］ 서버 스크립트 없음"^)
echo         
echo     return True
echo.
echo def show_a2a_guide^(^):
echo     """A2A 사용 가이드 출력"""
echo     guide = """
echo ================================================================
echo                   A2A MCP 서버 사용 가이드
echo ================================================================
echo.
echo 1. A2A 프로토콜 기본 개념:
echo    - Task-Based Communication: 모든 상호작용이 작업 단위
echo    - JSON-RPC Schema: 표준화된 통신 방식
echo    - Agent Discovery: 에이전트 자동 발견
echo.
echo 2. Claude Desktop에서 테스트:
echo    다음 프롬프트를 사용하세요:
echo    
echo    "A2A 에이전트들을 활용하여 다음 작업을 수행해줘:
echo    1. 사용 가능한 에이전트 목록 조회
echo    2. 새로운 분석 작업 생성
echo    3. 작업 상태 확인 및 결과 조회"
echo.
echo 3. 에이전트 개발:
echo    - K:\PortableApps\genai\documentation\guides\A2A-COMPREHENSIVE-ANALYSIS-2025.md
echo    - 참조하여 커스텀 에이전트 개발 가능
echo.
echo ================================================================
echo     """
echo     print^(guide^)
echo.
echo if __name__ == "__main__":
echo     print^(f"테스트 시작 시간: {datetime.now^(^)}"^)
echo     
echo     if test_a2a_installation^(^):
echo         print^("［+］ A2A MCP 서버 설치 확인 완료"^)
echo         show_a2a_guide^(^)
echo     else:
echo         print^("［-］ A2A MCP 서버 설치 문제 발견"^)
echo         
echo     input^("엔터를 눌러 종료..."^)
) > "%A2A_TEST%"

echo [+] 테스트 스크립트 생성 완료

echo.
echo [6/6] 설치 완료 정보 출력...

echo.
echo ================================================================
echo                    설치 완료!
echo ================================================================
echo.
echo [+] 설치된 시스템:
echo     1. zen-mcp-server (Multi-Model Orchestration)
echo        위치: %MCP_DIR%\zen-mcp-server
echo        
echo     2. A2A-MCP-Server (A2A Protocol Bridge)  
echo        위치: %MCP_DIR%\A2A-MCP-Server
echo.
echo [+] 설정 파일:
echo     - Claude Desktop: %CONFIG_FILE%
echo     - 환경변수 예시: 위 파일에서 ${API_KEY} 부분을 실제 키로 교체
echo.
echo [+] 테스트 방법:
echo     1. ZEN 테스트: %PYTHON_EXE% %ZEN_TEST%
echo     2. A2A 테스트: %PYTHON_EXE% %A2A_TEST%
echo.
echo [+] 다음 단계:
echo     1. API 키 설정 (GEMINI_API_KEY 등)
echo     2. Claude Desktop 재시작  
echo     3. /mcp 명령어로 서버 확인
echo     4. 종합 가이드 참조: 
echo        K:\PortableApps\genai\documentation\guides\A2A-COMPREHENSIVE-ANALYSIS-2025.md
echo.
echo ================================================================

pause