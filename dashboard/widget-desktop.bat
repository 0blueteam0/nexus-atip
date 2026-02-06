@echo off
chcp 65001 >nul
echo [*] Starting AI Stack Desktop Widget...

REM Check if server is already running
tasklist /FI "WINDOWTITLE eq AI Stack Monitor Server" | find "node.exe" >nul
if errorlevel 1 (
    echo [*] Starting server...
    cd /d K:\PortableApps\Claude-Code\dashboard
    start "AI Stack Monitor Server" /MIN K:\PortableApps\tools\nodejs\node.exe server.js
    timeout /t 2 /nobreak >nul
)

REM Find Chrome or Edge
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else (
    set CHROME="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

echo [+] Opening widget window...
REM App mode with small window (top right, 600x800)
%CHROME% --app=http://localhost:13579 --window-size=600,800 --window-position=1300,50

echo [+] Widget started!
