@echo off
:: Auto-clean shell snapshots every 30 seconds
:loop
if exist "K:\PortableApps\Claude-Code\shell-snapshots" (
    for /f %%a in ('dir /b "K:\PortableApps\Claude-Code\shell-snapshots" 2^>nul ^| find /c /v ""') do (
        if %%a GTR 0 (
            echo [%date% %time%] Cleaning %%a snapshot files...
            del /Q "K:\PortableApps\Claude-Code\shell-snapshots\*" 2>nul
        )
    )
)
timeout /t 30 /nobreak >nul
goto loop