@echo off
:: Maintain bash fix - Run this at Windows startup or periodically
:: This ensures the snapshot blocker stays in place

:check
if exist "K:\PortableApps\Claude-Code\shell-snapshots" (
    :: Check if it's a file (not directory)
    dir /a-d "K:\PortableApps\Claude-Code\shell-snapshots" >nul 2>&1
    if %errorlevel% == 0 (
        echo [OK] Snapshot blocker file exists
    ) else (
        echo [FIXING] shell-snapshots is a folder, removing...
        rmdir /S /Q "K:\PortableApps\Claude-Code\shell-snapshots" 2>nul
        echo This file prevents snapshot folder creation > "K:\PortableApps\Claude-Code\shell-snapshots"
        attrib +R "K:\PortableApps\Claude-Code\shell-snapshots"
        echo [FIXED] Recreated blocker file
    )
) else (
    echo [CREATING] Creating snapshot blocker...
    echo This file prevents snapshot folder creation > "K:\PortableApps\Claude-Code\shell-snapshots"
    attrib +R "K:\PortableApps\Claude-Code\shell-snapshots"
    echo [CREATED] Blocker file created
)

:: Keep running in background (optional - uncomment to enable)
:: timeout /t 300 /nobreak >nul
:: goto check

echo.
echo Status maintained. Press any key to exit...
pause >nul