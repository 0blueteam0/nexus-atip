@echo off
REM Claude Code Quick Launch with Bottom-up Optimization
REM 최적화된 빠른 실행 스크립트

cd /d K:\PortableApps\Claude-Code

REM 환경 변수 즉시 설정
set CLAUDE_HOME=K:\PortableApps\Claude-Code
set CLAUDE_CONFIG_FILE=K:\PortableApps\Claude-Code\.claude.json
set PATH=K:\PortableApps\tools\nodejs;K:\PortableApps\tools\git\bin;%PATH%
set MCP_TIMEOUT=60000

REM 스냅샷 문제 자동 해결
if exist shell-snapshots\*.sh (
    del /Q shell-snapshots\*.sh 2>nul
)

REM Claude Code 실행
echo ╔══════════════════════════════════════════════╗
echo ║     🚀 CLAUDE CODE - BOTTOM-UP MODE 🚀      ║
echo ║         Cutting Edge Performance             ║
echo ╚══════════════════════════════════════════════╝
echo.

K:\PortableApps\tools\nodejs\node.exe K:\PortableApps\Claude-Code\node_modules\@anthropic-ai\claude-code\cli.js %*