@echo off
setlocal EnableDelayedExpansion

REM Clean Claude launcher - no Korean text
REM K-Drive complete separation environment

REM Set UTF-8 encoding
chcp 65001 >nul 2>&1

REM Environment setup
set NPM_CONFIG_CACHE=%TEMP%\npm-cache
set NPM_CONFIG_PREFIX=K:\tools\nodejs\npm-global
set NPM_CONFIG_USERCONFIG=K:\PortableApps\Claude-Code\.npmrc
set TEMP=K:\PortableApps\Claude-Code\temp
set TMP=K:\PortableApps\Claude-Code\temp
set TMPDIR=K:\PortableApps\Claude-Code\temp
set HOME=K:\PortableApps\Claude-Code
set USERPROFILE=K:\PortableApps\Claude-Code

REM Claude settings
set CLAUDE_CODE_GIT_BASH_PATH=K:\tools\git\bin\bash.exe
set CLAUDE_CODE_SHELL=cmd.exe
set SHELL=cmd.exe
set CLAUDE_HOME=K:\PortableApps\Claude-Code
set CLAUDE_CONFIG_FILE=K:\PortableApps\Claude-Code\.claude.json
set CLAUDE_CONFIG_DIR=K:\PortableApps\Claude-Code
set CLAUDE_DISABLE_HISTORY=true
set CLAUDE_NO_PROJECT_HISTORY=true
set BASH_ENV=K:\PortableApps\Claude-Code\.bashrc
set NODE_PATH=K:\tools\nodejs
set PATH=%NODE_PATH%;%NODE_PATH%\node_modules\.bin;K:\tools\git\bin;%PATH%

REM Load API key
if exist "%CLAUDE_HOME%\.env" (
    for /f "tokens=1,2 delims==" %%a in (%CLAUDE_HOME%\.env) do set %%a=%%b
)

REM Execute Claude
cd /d K:\PortableApps\Claude-Code
K:\tools\nodejs\node.exe K:\PortableApps\Claude-Code\node_modules\@anthropic-ai\claude-code\cli.js %*

endlocal