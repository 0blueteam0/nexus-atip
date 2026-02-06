@echo off
chcp 65001 >nul
echo [*] AI Stack Monitor 시작중...
cd /d K:\PortableApps\Claude-Code\dashboard
start "AI Stack Monitor Server" K:\PortableApps\tools\nodejs\node.exe server.js
timeout /t 2 /nobreak >nul
start http://localhost:13579
echo [+] 브라우저에서 http://localhost:13579 열림
echo [*] 서버 중지: Ctrl+C
pause
