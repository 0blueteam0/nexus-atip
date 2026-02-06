@echo off
chcp 65001 >nul
echo [*] AI Stack 컴팩트 위젯 시작...

REM 서버 확인 및 시작
tasklist /FI "WINDOWTITLE eq AI Stack Monitor Server" | find "node.exe" >nul
if errorlevel 1 (
    cd /d K:\PortableApps\Claude-Code\dashboard
    start "AI Stack Monitor Server" /MIN K:\PortableApps\tools\nodejs\node.exe server.js
    timeout /t 2 /nobreak >nul
)

REM Chrome/Edge 찾기
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set BROWSER="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set BROWSER="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else (
    set BROWSER="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

echo [+] 컴팩트 위젯 열기 (400x700)...
%BROWSER% --app=http://localhost:13579 --window-size=400,700 --window-position=1500,50
