@echo off
setlocal EnableDelayedExpansion

REM Clean Claude launcher - no Korean text
REM K-Drive complete separation environment

REM Set UTF-8 encoding
chcp 65001 >nul 2>&1

REM Environment setup
set NPM_CONFIG_CACHE=K:\PortableApps\genai\npm-cache
set NPM_CONFIG_PREFIX=K:\tools\nodejs\npm-global
set NPM_CONFIG_USERCONFIG=K:\PortableApps\genai\.npmrc
set TEMP=K:\PortableApps\genai\temp
set TMP=K:\PortableApps\genai\temp
set TMPDIR=K:\PortableApps\genai\temp
set HOME=K:\PortableApps\genai
set USERPROFILE=K:\PortableApps\genai

REM Claude settings
set CLAUDE_CODE_GIT_BASH_PATH=K:\tools\git\bin\bash.exe
set CLAUDE_CODE_SHELL=cmd.exe
set SHELL=cmd.exe
set CLAUDE_HOME=K:\PortableApps\genai
set CLAUDE_CONFIG_FILE=K:\PortableApps\genai\.claude.json
set CLAUDE_CONFIG_DIR=K:\PortableApps\genai
set CLAUDE_DISABLE_HISTORY=true
set CLAUDE_NO_PROJECT_HISTORY=true
set BASH_ENV=K:\PortableApps\genai\.bashrc
set NODE_PATH=K:\tools\nodejs
set PATH=%NODE_PATH%;%NODE_PATH%\node_modules\.bin;K:\tools\git\bin;%PATH%

REM Load API key
if exist "%CLAUDE_HOME%\.env" (
    for /f "tokens=1,2 delims==" %%a in (%CLAUDE_HOME%\.env) do set %%a=%%b
)

REM Execute Claude
cd /d K:\PortableApps\genai
K:\PortableApps\tools\nodejs\node.exe K:\PortableApps\genai\node_modules\@anthropic-ai\claude-code\cli.js %*

endlocal