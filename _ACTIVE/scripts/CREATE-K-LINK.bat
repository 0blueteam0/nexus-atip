@echo off
echo Creating /k link to K:\ drive
echo ================================

REM Create symbolic link /k -> K:\
if exist C:\k (
    echo C:\k already exists
) else (
    mklink /D C:\k K:\ 2>nul
    if %errorlevel% equ 0 (
        echo Created: C:\k -> K:\
    ) else (
        echo Failed - need admin rights
        echo Run as Administrator:
        echo   mklink /D C:\k K:\
    )
)

REM Test
if exist C:\k\PortableApps\Claude-Code (
    echo SUCCESS: /k path works!
) else (
    echo FAILED: /k path not working
)

pause