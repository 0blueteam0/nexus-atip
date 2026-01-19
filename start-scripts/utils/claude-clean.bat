@echo off
setlocal enabledelayedexpansion

:: Claude Clean Runner - Raw JSON 출력을 깔끔하게
:: 안전한 Wrapper 방식 (원본 수정 없음)

set "NODE_PATH=K:\PortableApps\tools\nodejs\node.exe"
set "CLAUDE_CLI=K:\PortableApps\Claude-Code\node_modules\@anthropic-ai\claude-code\cli.js"
set "FORMATTER=K:\PortableApps\Claude-Code\systems\claude-output-filter.js"

:: 임시 파일 생성
set "TEMP_OUTPUT=%TEMP%\claude_output_%RANDOM%.txt"

:: Claude 실행 및 출력 캡처
echo [*] Claude Code 시작 (Clean Mode)...
"%NODE_PATH%" "%CLAUDE_CLI%" %* 2>&1 | "%NODE_PATH%" "%FORMATTER%"

:: 정리
if exist "%TEMP_OUTPUT%" del "%TEMP_OUTPUT%"

endlocal