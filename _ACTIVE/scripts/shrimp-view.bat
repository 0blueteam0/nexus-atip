@echo off
:: Shrimp Task 깔끔한 뷰어
:: 사용법: shrimp-view.bat [--simple]

setlocal enabledelayedexpansion

echo.
K:\PortableApps\tools\nodejs\node.exe K:\PortableApps\Claude-Code\systems\shrimp-formatter.js %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [오류] Task 표시 실패
    echo 직접 파일 확인: K:\PortableApps\Claude-Code\ShrimpData\current-tasks.json
)

endlocal