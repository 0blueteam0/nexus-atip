@echo off
echo ====================================
echo   K드라이브 Live Server 시작
echo ====================================
echo.
echo Python HTTP Server를 시작합니다...
echo 브라우저에서 http://localhost:8000 접속
echo.
cd /d K:\PortableApps\Claude-Code
python -m http.server 8000
pause