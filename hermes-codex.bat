@echo off
setlocal EnableDelayedExpansion

REM Hermes Agent launcher using OpenAI Codex OAuth.
REM Drive-agnostic: works on both K: and J: portable layouts.

chcp 65001 >nul 2>&1

set "DRV=%~d0"
set "ROOT=%DRV%\PortableApps\genai"
set "HERMES_AGENT_ROOT=%ROOT%\tools\hermes-agent"
set "HERMES_EXE=%HERMES_AGENT_ROOT%\.venv\Scripts\hermes.exe"
set "HERMES_HOME=%ROOT%\tools\hermes-codex-home"
set "CODEX_RUNTIME_HOME=%ROOT%\temp\codex-home"
set "CODEX_RUNTIME_AUTH=%CODEX_RUNTIME_HOME%\auth.json"
set "ROOT_CODEX_AUTH=%ROOT%\auth.json"
set "NODE_EXE=%DRV%\PortableApps\tools\nodejs\node.exe"
set "NPM_GLOBAL_BIN=%DRV%\PortableApps\tools\nodejs\npm-global"
set "NODE_PATH=%DRV%\PortableApps\tools\nodejs-v20-backup"
set "UV_PATH=%DRV%\PortableApps\tools\uv"
set "HERMES_CODEX_BASE_URL=https://chatgpt.com/backend-api/codex"
set "HERMES_CODEX_MODEL=gpt-5.4"
set "HERMES_DASHBOARD_HOST=127.0.0.1"
set "HERMES_DASHBOARD_PORT=9119"
set "HERMES_DASHBOARD_URL=http://%HERMES_DASHBOARD_HOST%:%HERMES_DASHBOARD_PORT%/"
set "HERMES_DASHBOARD_CHAT_URL=http://%HERMES_DASHBOARD_HOST%:%HERMES_DASHBOARD_PORT%/chat"
set "HERMES_DASHBOARD_TUI=1"

if /I "%~1"=="--help" goto :help
if /I "%~1"=="-h" goto :help
if /I "%~1"=="help" goto :help

if not exist "%HERMES_EXE%" (
    echo [-] Hermes executable not found: %HERMES_EXE%
    echo [*] Expected install root: %HERMES_AGENT_ROOT%
    endlocal & exit /b 127
)

set LANG=ko_KR.UTF-8
set LC_ALL=ko_KR.UTF-8
set LESSCHARSET=utf-8
set CHARSET=UTF-8
set PYTHONIOENCODING=utf-8:replace
set PYTHONUTF8=1
set CODEX_HOME=%CODEX_RUNTIME_HOME%
set HOME=%CODEX_RUNTIME_HOME%
set USERPROFILE=%CODEX_RUNTIME_HOME%
set NPM_CONFIG_CACHE=%ROOT%\npm-cache
set NPM_CONFIG_PREFIX=%NPM_GLOBAL_BIN%
set NPM_CONFIG_USERCONFIG=%ROOT%\.npmrc
set TEMP=%CODEX_RUNTIME_HOME%\temp
set TMP=%CODEX_RUNTIME_HOME%\temp
set TMPDIR=%CODEX_RUNTIME_HOME%\temp
set PATH=%HERMES_AGENT_ROOT%\.venv\Scripts;%UV_PATH%;%DRV%\PortableApps\tools\nodejs;%NPM_GLOBAL_BIN%;%NODE_PATH%;%NODE_PATH%\node_modules\.bin;%DRV%\PortableApps\tools\git\bin;%PATH%

call :ensure_runtime
if errorlevel 1 (
    set "ERR=%ERRORLEVEL%"
    endlocal & exit /b %ERR%
)

cd /d "%ROOT%"

if /I "%~1"=="--setup" (
    echo [*] Opening Hermes model setup. Choose OpenAI Codex to use Codex OAuth.
    call "%HERMES_EXE%" model
    endlocal & exit /b %ERRORLEVEL%
)

if /I "%~1"=="--model" (
    call "%HERMES_EXE%" model
    endlocal & exit /b %ERRORLEVEL%
)

if /I "%~1"=="--auth" (
    echo [*] Starting a fresh OpenAI Codex device-code login for Hermes.
    call "%HERMES_EXE%" auth add openai-codex
    endlocal & exit /b %ERRORLEVEL%
)

if /I "%~1"=="--doctor" (
    call "%HERMES_EXE%" doctor
    endlocal & exit /b %ERRORLEVEL%
)

if /I "%~1"=="--mcp-list" (
    call "%HERMES_EXE%" mcp list
    endlocal & exit /b %ERRORLEVEL%
)

if /I "%~1"=="--where" (
    echo ROOT=%ROOT%
    echo HERMES_AGENT_ROOT=%HERMES_AGENT_ROOT%
    echo HERMES_HOME=%HERMES_HOME%
    echo CODEX_HOME=%CODEX_HOME%
    echo HERMES_EXE=%HERMES_EXE%
    echo HERMES_DASHBOARD_URL=%HERMES_DASHBOARD_URL%
    echo HERMES_DASHBOARD_CHAT_URL=%HERMES_DASHBOARD_CHAT_URL%
    endlocal & exit /b 0
)

if /I "%~1"=="--dashboard-status" (
    call "%HERMES_EXE%" dashboard --status
    endlocal & exit /b %ERRORLEVEL%
)

if /I "%~1"=="--chat" (
    call :open_browser_chat
    set "HERMES_EXIT=!ERRORLEVEL!"
    endlocal & exit /b !HERMES_EXIT!
)

if /I "%~1"=="--browser" (
    call :open_browser_chat
    set "HERMES_EXIT=!ERRORLEVEL!"
    endlocal & exit /b !HERMES_EXIT!
)

if /I "%~1"=="--no-dashboard" (
    shift
    goto :skip_dashboard
)

call :ensure_dashboard
if errorlevel 1 (
    echo [!] Dashboard startup check failed; continuing Hermes CLI anyway.
)

:skip_dashboard
call "%HERMES_EXE%" %*
set "HERMES_EXIT=%ERRORLEVEL%"
endlocal & exit /b %HERMES_EXIT%

:ensure_runtime
if not exist "%HERMES_HOME%" mkdir "%HERMES_HOME%" >nul 2>&1
if errorlevel 1 (
    echo [-] Failed to create HERMES_HOME: %HERMES_HOME%
    exit /b 1
)

if not exist "%CODEX_RUNTIME_HOME%" mkdir "%CODEX_RUNTIME_HOME%" >nul 2>&1
if not exist "%TEMP%" mkdir "%TEMP%" >nul 2>&1

if not exist "%CODEX_RUNTIME_AUTH%" (
    if exist "%ROOT_CODEX_AUTH%" (
        copy /Y "%ROOT_CODEX_AUTH%" "%CODEX_RUNTIME_AUTH%" >nul 2>&1
    )
)

if not exist "%HERMES_HOME%\config.yaml" call :write_config
if errorlevel 1 exit /b 1

if not exist "%HERMES_HOME%\SOUL.md" call :write_soul
if errorlevel 1 exit /b 1

exit /b 0

:ensure_dashboard
curl.exe -fsS --max-time 2 "%HERMES_DASHBOARD_CHAT_URL%" >nul 2>&1
if not errorlevel 1 (
    echo [*] Hermes browser chat already reachable: %HERMES_DASHBOARD_CHAT_URL%
    exit /b 0
)

call "%HERMES_EXE%" dashboard --status 2>nul | findstr /I "127.0.0.1:%HERMES_DASHBOARD_PORT% localhost:%HERMES_DASHBOARD_PORT% %HERMES_DASHBOARD_PORT%" >nul 2>&1
if not errorlevel 1 (
    echo [*] Hermes dashboard already running: %HERMES_DASHBOARD_URL%
    echo [*] Hermes browser chat: %HERMES_DASHBOARD_CHAT_URL%
    exit /b 0
)

echo [*] Starting Hermes dashboard with browser chat: %HERMES_DASHBOARD_CHAT_URL%
start "Hermes Dashboard" /B "%HERMES_EXE%" dashboard --host %HERMES_DASHBOARD_HOST% --port %HERMES_DASHBOARD_PORT% --tui
exit /b 0

:open_browser_chat
call :ensure_dashboard
if errorlevel 1 exit /b %ERRORLEVEL%
echo [*] Opening Hermes browser chat: %HERMES_DASHBOARD_CHAT_URL%
start "" "%HERMES_DASHBOARD_CHAT_URL%"
exit /b 0

:write_config
set "ROOT_YAML=%ROOT:\=/%"
(
    echo model:
    echo   provider: openai-codex
    echo   default: %HERMES_CODEX_MODEL%
    echo   base_url: %HERMES_CODEX_BASE_URL%
    echo   openai_runtime: auto
    echo.
    echo terminal:
    echo   backend: local
    echo   cwd: %ROOT_YAML%
    echo   timeout: 180
    echo   docker_mount_cwd_to_workspace: false
    echo   lifetime_seconds: 300
    echo.
    echo display:
    echo   compact: true
    echo   tool_progress: new
    echo   streaming: true
    echo   show_reasoning: false
    echo.
    echo tool_loop_guardrails:
    echo   warnings_enabled: true
    echo   hard_stop_enabled: true
    echo   warn_after:
    echo     exact_failure: 2
    echo     same_tool_failure: 3
    echo     idempotent_no_progress: 2
    echo   hard_stop_after:
    echo     exact_failure: 4
    echo     same_tool_failure: 6
    echo     idempotent_no_progress: 4
    echo.
    echo delegation:
    echo   max_iterations: 12
    echo   max_concurrent_children: 2
    echo   max_spawn_depth: 1
    echo   subagent_auto_approve: false
    echo.
    echo mcp_servers:
    echo   playwright:
    echo     command: npx
    echo     args:
    echo       - "-y"
    echo       - "@playwright/mcp@latest"
    echo       - "--allowed-hosts"
    echo       - "127.0.0.1,localhost"
    echo       - "--allowed-origins"
    echo       - "http://127.0.0.1:5175;http://localhost:5175"
    echo       - "--browser"
    echo       - "msedge"
) > "%HERMES_HOME%\config.yaml"
if errorlevel 1 (
    echo [-] Failed to write Hermes config: %HERMES_HOME%\config.yaml
    exit /b 1
)
exit /b 0

:write_soul
(
    echo # Hermes Codex Profile
    echo.
    echo Use this profile for local development with the OpenAI Codex provider.
    echo Keep gateway, cron, yolo-style execution, broad filesystem inspection, and production SOC actions disabled unless explicitly requested.
    echo Prefer draft-only analysis, bounded tool use, and local project context.
) > "%HERMES_HOME%\SOUL.md"
if errorlevel 1 (
    echo [-] Failed to write Hermes SOUL file: %HERMES_HOME%\SOUL.md
    exit /b 1
)
exit /b 0

:help
echo Hermes Codex OAuth launcher
echo.
echo Usage:
echo   hermes-codex.bat                Start Hermes with model.provider=openai-codex
echo   hermes-codex.bat --setup        Open Hermes model setup; choose OpenAI Codex
echo   hermes-codex.bat --auth         Start fresh OpenAI Codex device-code login
echo   hermes-codex.bat --doctor       Run Hermes diagnostics with this profile
echo   hermes-codex.bat --mcp-list     List MCP servers for this profile
echo   hermes-codex.bat --chat         Start/open browser chat at http://127.0.0.1:9119/chat
echo   hermes-codex.bat --browser      Alias of --chat
echo   hermes-codex.bat --dashboard-status  Show Hermes dashboard process status
echo   hermes-codex.bat --no-dashboard [args]  Start Hermes without auto-opening dashboard
echo   hermes-codex.bat --where        Show resolved portable paths
echo.
echo Notes:
echo   This launcher uses HERMES_HOME=tools\hermes-codex-home.
echo   It uses CODEX_HOME=temp\codex-home so Hermes can see the same Codex OAuth source as codex.bat.
echo   To use Codex CLI's own runtime inside Hermes, start Hermes and run: /codex-runtime codex_app_server
endlocal & exit /b 0
