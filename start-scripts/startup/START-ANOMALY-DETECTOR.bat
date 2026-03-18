@echo off
chcp 65001 >nul 2>&1
:: Anomaly Detector - Auto detection and resolution

echo ========================================
echo    Anomaly Detection System
echo ========================================
echo.
echo [START] Starting anomaly detector...
echo.

cd /d K:\PortableApps\genai

:: Set Node.js path
set PATH=K:\PortableApps\genai\tools\nodejs;%PATH%

:: Run with Node.js
start /B "Anomaly Detector" "K:\PortableApps\genai\tools\nodejs\node.exe" "K:\PortableApps\genai\systems\anomaly-detector.js"

echo System running in background.
echo.
echo Features:
echo - Auto detect and resolve environment issues
echo - Auto remove inefficient elements
echo - Instant improvement of inconveniences
echo - Auto block security risks
echo - Auto evolve instructions
echo.
timeout /t 3 >nul
