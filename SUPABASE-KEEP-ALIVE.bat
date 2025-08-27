@echo off
chcp 65001 >nul 2>&1
echo =====================================
echo   Supabase Keep-Alive System
echo   프로젝트 자동 활성화 유지
echo =====================================
echo.

REM Node.js로 스크립트 실행
K:\PortableApps\tools\nodejs\node.exe systems\supabase-keep-alive.js

echo.
echo [*] 완료! 
echo [*] 스케줄러로 등록하려면 INSTALL-SUPABASE-SCHEDULER.bat 실행
pause