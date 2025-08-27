@echo off
echo ============================================
echo    ADD BASH FIX TO WINDOWS STARTUP
echo ============================================
echo.

echo Creating startup task...

:: Create scheduled task that runs at login
schtasks /create /tn "ClaudeCodeBashFix" /tr "K:\PortableApps\Claude-Code\MAINTAIN-BASH-FIX.bat" /sc onlogon /rl highest /f >nul 2>&1

if %errorlevel% == 0 (
    echo [SUCCESS] Task created successfully!
    echo.
    echo The bash fix will now run automatically when Windows starts.
    echo.
    echo To remove: schtasks /delete /tn "ClaudeCodeBashFix" /f
) else (
    echo [ALTERNATIVE] Creating startup shortcut...
    
    :: Alternative: Add to Startup folder
    copy "K:\PortableApps\Claude-Code\MAINTAIN-BASH-FIX.bat" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ClaudeCodeBashFix.bat" >nul 2>&1
    
    if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ClaudeCodeBashFix.bat" (
        echo [SUCCESS] Added to Startup folder!
    ) else (
        echo [FAILED] Could not add to startup. Run MAINTAIN-BASH-FIX.bat manually.
    )
)

echo.
pause