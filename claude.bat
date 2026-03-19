@echo off
setlocal EnableDelayedExpansion

REM Portable Claude launcher - auto-detect drive letter
REM Works on both K: (home) and J: (external) drives

REM Set UTF-8 encoding
chcp 65001 >nul 2>&1

REM Auto-detect drive letter from script location
set "DRV=%~d0"

REM Force UTF-8 console output
set LANG=ko_KR.UTF-8
set LC_ALL=ko_KR.UTF-8
set LESSCHARSET=utf-8
set CHARSET=UTF-8

REM Environment setup (drive-agnostic)
set NPM_CONFIG_CACHE=%DRV%\PortableApps\genai\npm-cache
set NPM_CONFIG_PREFIX=%DRV%\PortableApps\tools\nodejs\npm-global
set NPM_CONFIG_USERCONFIG=%DRV%\PortableApps\genai\.npmrc
set TEMP=%DRV%\PortableApps\genai\temp
set TMP=%DRV%\PortableApps\genai\temp
set TMPDIR=%DRV%\PortableApps\genai\temp
set HOME=%DRV%\PortableApps\genai
set USERPROFILE=%DRV%\PortableApps\genai

REM Python UTF-8 encoding
set PYTHONIOENCODING=utf-8:replace
set PYTHONUTF8=1

REM Claude settings (drive-agnostic)
set CLAUDE_CODE_GIT_BASH_PATH=%DRV%\PortableApps\tools\git\bin\bash.exe
set CLAUDE_CODE_SHELL=cmd.exe
set SHELL=cmd.exe
set CLAUDE_HOME=%DRV%\PortableApps\genai
set CLAUDE_CONFIG_FILE=%DRV%\PortableApps\genai\.claude.json
set CLAUDE_CONFIG_DIR=%DRV%\PortableApps\genai
set CLAUDE_DISABLE_HISTORY=true
set CLAUDE_NO_PROJECT_HISTORY=true
set BASH_ENV=%DRV%\PortableApps\genai\.bashrc
set NODE_PATH=%DRV%\PortableApps\tools\nodejs-v20-backup
set UV_PATH=%DRV%\PortableApps\tools\uv
set UV_TOOLS_BIN=%DRV%\PortableApps\genai\.local\bin
set NPM_GLOBAL_BIN=%DRV%\PortableApps\tools\nodejs\npm-global
set PATH=%UV_TOOLS_BIN%;%UV_PATH%;%NPM_GLOBAL_BIN%;%NODE_PATH%;%NODE_PATH%\node_modules\.bin;%DRV%\PortableApps\tools\git\bin;%PATH%

REM Claude Code features
set CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=60
set CLAUDE_CODE_SUBAGENT_MODEL=claude-haiku-4-5-20251001
set CLAUDE_AUTO_BACKGROUND_TASKS=1
set CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
set CLAUDE_SKILL_DIR=%DRV%\PortableApps\genai\.claude\skills

REM Patch .claude.json for current drive (if needed)
call "%DRV%\PortableApps\genai\setup-drive.bat" silent

REM Load API key
if exist "%CLAUDE_HOME%\.env" (
    for /f "tokens=1,2 delims==" %%a in (%CLAUDE_HOME%\.env) do set %%a=%%b
)

REM Execute Claude
cd /d %DRV%\PortableApps\genai
%DRV%\PortableApps\tools\nodejs-v20-backup\node.exe %DRV%\PortableApps\tools\nodejs\npm-global\node_modules\@anthropic-ai\claude-code\cli.js %*

endlocal
