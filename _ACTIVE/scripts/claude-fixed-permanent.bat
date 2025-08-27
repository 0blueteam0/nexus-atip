@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

REM ===== PERMANENT BASH FIX FOR CLAUDE CODE =====
REM No snapshots, no echo, no problems

REM Core environment
set CLAUDE_HOME=K:\PortableApps\Claude-Code
set CLAUDE_CONFIG_FILE=K:\PortableApps\Claude-Code\.claude.json
set NODE_PATH=K:\PortableApps\tools\nodejs
set GIT_PATH=K:\PortableApps\tools\git

REM Force CMD shell (NO BASH SNAPSHOTS)
set SHELL=cmd.exe
set CLAUDE_CODE_SHELL=cmd.exe
set COMSPEC=C:\Windows\System32\cmd.exe

REM Disable bash environment
set BASH_ENV=
set BASHRC=
set BASH_PROFILE=

REM Clean paths
set PATH=%NODE_PATH%;%NODE_PATH%\node_modules\.bin;%GIT_PATH%\bin;%SystemRoot%\system32;%SystemRoot%

REM Temp directories
set TEMP=K:\PortableApps\Claude-Code\temp
set TMP=K:\PortableApps\Claude-Code\temp
set TMPDIR=K:\PortableApps\Claude-Code\temp

REM NPM config
set NPM_CONFIG_CACHE=%TEMP%\npm-cache
set NPM_CONFIG_PREFIX=%NODE_PATH%\npm-global

REM Load API keys from .env
if exist "%CLAUDE_HOME%\.env" (
    for /f "tokens=1,2 delims==" %%a in (%CLAUDE_HOME%\.env) do set %%a=%%b
)

REM Clean snapshots before starting
if exist "%CLAUDE_HOME%\shell-snapshots" (
    rmdir /S /Q "%CLAUDE_HOME%\shell-snapshots" 2>nul
)

REM Execute Claude with all arguments
cd /d %CLAUDE_HOME%
%NODE_PATH%\node.exe %CLAUDE_HOME%\node_modules\@anthropic-ai\claude-code\cli.js %*

endlocal