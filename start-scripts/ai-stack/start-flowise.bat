@echo off
REM Flowise 서비스 백그라운드 시작
start /B K:\PortableApps\tools\nodejs\npx.cmd flowise start
echo Flowise service started in background
