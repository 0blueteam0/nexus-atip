@echo off
REM ============================================
REM  INTELLIGENT STARTUP MANAGER
REM  Single entry point for all startup tasks
REM  Choose what to enable/disable
REM ============================================

setlocal enabledelayedexpansion

echo ============================================
echo    INTELLIGENT STARTUP MANAGER
echo    Minimal Mode by Default
echo ============================================
echo.

REM Check for config file
if not exist startup-config.txt (
    echo Creating default startup config...
    call :CREATE_DEFAULT_CONFIG
)

REM Load configuration
set "ESSENTIAL_ONLY=1"
set "AUTO_CLEANUP=0"
set "HISTORY_WATCHDOG=0"
set "FOLDER_ORGANIZER=0"
set "ANOMALY_DETECTOR=0"

if exist startup-config.txt (
    for /f "tokens=1,2 delims==" %%a in (startup-config.txt) do (
        set "%%a=%%b"
    )
)

echo Current Configuration:
echo ----------------------
echo [%ESSENTIAL_ONLY%] Essential Only Mode
echo [%AUTO_CLEANUP%] Auto Cleanup
echo [%HISTORY_WATCHDOG%] History Watchdog  
echo [%FOLDER_ORGANIZER%] Folder Organizer
echo [%ANOMALY_DETECTOR%] Anomaly Detector
echo.

REM Quick start option
if "%1"=="quick" goto QUICK_START
if "%1"=="minimal" goto MINIMAL_START
if "%1"=="full" goto FULL_START

:MENU
echo Options:
echo [1] Quick Start (Essential only)
echo [2] Standard Start (Essential + Cleanup)
echo [3] Full Start (All features)
echo [4] Configure Features
echo [5] Exit
echo.
set /p choice="Select mode (1-5): "

if "%choice%"=="1" goto QUICK_START
if "%choice%"=="2" goto STANDARD_START
if "%choice%"=="3" goto FULL_START
if "%choice%"=="4" goto CONFIGURE
if "%choice%"=="5" exit /b

:QUICK_START
echo.
echo [*] Starting ESSENTIAL services only...
echo ----------------------------------------

REM Only the absolute minimum
echo [+] Setting environment variables...
set CLAUDE_HOME=K:\PortableApps\Claude-Code
set PATH=K:\PortableApps\tools\nodejs;K:\PortableApps\tools\python;%PATH%

echo [+] Quick JSON cleanup (one-time)...
K:\PortableApps\tools\nodejs\node.exe fix-claude-json-bug.js fix >nul 2>&1

echo.
echo [*] Essential startup complete!
echo [*] System ready with minimal overhead
pause
exit /b

:STANDARD_START
echo.
echo [*] Starting STANDARD services...
echo ----------------------------------------

REM Essential + basic maintenance
call :QUICK_START

echo [+] Enabling auto-cleanup (30-min intervals)...
start /min cmd /c "K:\PortableApps\tools\nodejs\node.exe systems\lightweight-cleaner.js"

echo.
echo [*] Standard startup complete!
pause
exit /b

:FULL_START
echo.
echo [*] Starting ALL services...
echo ----------------------------------------

call :STANDARD_START

echo [+] Starting history watchdog...
start /min cmd /c "K:\PortableApps\tools\nodejs\node.exe claude-history-watchdog.js"

echo [+] Starting folder organizer...
start /min cmd /c "K:\PortableApps\tools\nodejs\node.exe systems\folder-monitor.js"

echo [+] Starting anomaly detector...
start /min cmd /c "K:\PortableApps\tools\nodejs\node.exe systems\anomaly-detector.js"

echo.
echo [*] Full system startup complete!
echo [!] Warning: Multiple background processes running
pause
exit /b

:MINIMAL_START
REM Silent minimal start for scheduled tasks
set CLAUDE_HOME=K:\PortableApps\Claude-Code
set PATH=K:\PortableApps\tools\nodejs;K:\PortableApps\tools\python;%PATH%
K:\PortableApps\tools\nodejs\node.exe fix-claude-json-bug.js fix >nul 2>&1
exit /b

:CONFIGURE
echo.
echo Configure Startup Features:
echo ---------------------------
echo Current settings will be saved to startup-config.txt
echo.

set /p essential="Essential Only Mode (1=yes, 0=no) [%ESSENTIAL_ONLY%]: "
if not "%essential%"=="" set ESSENTIAL_ONLY=%essential%

if "%ESSENTIAL_ONLY%"=="0" (
    set /p cleanup="Auto Cleanup (1=yes, 0=no) [%AUTO_CLEANUP%]: "
    if not "!cleanup!"=="" set AUTO_CLEANUP=!cleanup!
    
    set /p watchdog="History Watchdog (1=yes, 0=no) [%HISTORY_WATCHDOG%]: "
    if not "!watchdog!"=="" set HISTORY_WATCHDOG=!watchdog!
    
    set /p organizer="Folder Organizer (1=yes, 0=no) [%FOLDER_ORGANIZER%]: "
    if not "!organizer!"=="" set FOLDER_ORGANIZER=!organizer!
    
    set /p anomaly="Anomaly Detector (1=yes, 0=no) [%ANOMALY_DETECTOR%]: "
    if not "!anomaly!"=="" set ANOMALY_DETECTOR=!anomaly!
)

REM Save configuration
echo ESSENTIAL_ONLY=%ESSENTIAL_ONLY%> startup-config.txt
echo AUTO_CLEANUP=%AUTO_CLEANUP%>> startup-config.txt
echo HISTORY_WATCHDOG=%HISTORY_WATCHDOG%>> startup-config.txt
echo FOLDER_ORGANIZER=%FOLDER_ORGANIZER%>> startup-config.txt
echo ANOMALY_DETECTOR=%ANOMALY_DETECTOR%>> startup-config.txt

echo.
echo [+] Configuration saved!
pause
goto MENU

:CREATE_DEFAULT_CONFIG
echo ESSENTIAL_ONLY=1> startup-config.txt
echo AUTO_CLEANUP=0>> startup-config.txt
echo HISTORY_WATCHDOG=0>> startup-config.txt
echo FOLDER_ORGANIZER=0>> startup-config.txt
echo ANOMALY_DETECTOR=0>> startup-config.txt
exit /b

:END
exit /b