@echo off
set CLAUDE_CODE_GIT_BASH_PATH=K:\PortableApps\tools\git\bin\bash.exe
set CLAUDE_HOME=K:\PortableApps\Claude-Code
set CLAUDE_CONFIG_FILE=K:\PortableApps\Claude-Code\.claude.json
set CLAUDE_CONFIG_DIR=K:\PortableApps\Claude-Code
set HOME=K:\PortableApps\Claude-Code
set USERPROFILE=K:\PortableApps\Claude-Code
set NODE_PATH=K:\PortableApps\tools\nodejs
set PATH=%NODE_PATH%;%NODE_PATH%\node_modules\.bin;K:\PortableApps\tools\git\bin;%PATH%

echo Running Claude doctor...
K:\PortableApps\tools\nodejs\node.exe K:\PortableApps\Claude-Code\node_modules\@anthropic-ai\claude-code\cli.js doctor