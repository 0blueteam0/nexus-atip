@echo off
REM n8n 서비스 백그라운드 시작
start /B K:\PortableApps\tools\nodejs\npx.cmd n8n start
echo n8n service started in background
