@echo off
REM SuperClaude K-Drive Launcher - Zero C-Drive Dependency
set PYTHONPATH=K:\PortableApps\genai\superclaude
set PATH=K:\PortableApps\tools\python-portable;%PATH%

echo [*] SuperClaude K-Drive Launcher
echo [*] Using K-Drive Python Only
K:\PortableApps\tools\python-portable\python.exe -m SuperClaude %*
