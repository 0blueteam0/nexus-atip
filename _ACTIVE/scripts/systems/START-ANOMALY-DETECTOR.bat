@echo off
:: 이상 감지 시스템 즉시 시작
echo ========================================
echo    이상 감지 및 자동 해결 시스템
echo ========================================
echo.
echo [시작] 이상 감지 시스템을 시작합니다...
echo.

:: Node.js로 직접 실행
start /B "Anomaly Detector" "K:\PortableApps\tools\nodejs\node.exe" "K:\PortableApps\Claude-Code\systems\anomaly-detector.js"

echo 시스템이 백그라운드에서 실행 중입니다.
echo.
echo 주요 기능:
echo - 환경 이상 자동 감지 및 해결
echo - 비효율 요소 자동 제거
echo - 불편 사항 즉시 개선
echo - 보안 위험 자동 차단
echo - 지침 자동 진화
echo.
timeout /t 3 >nul