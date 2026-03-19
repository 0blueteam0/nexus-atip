@echo off
setlocal EnableDelayedExpansion

REM setup-drive.bat - Patch all configs for current drive letter (K: or J:)
REM Called by claude.bat on startup, or manually after sync
REM Usage: setup-drive.bat [silent]

chcp 65001 >nul 2>&1

set "DRV=%~d0"
set "SILENT=%1"
set "GENAI=%DRV%\PortableApps\genai"

REM Determine the OTHER drive letter
if /i "%DRV%"=="K:" (
    set "OTHER=K:"
    set "OTHER_LOW=k"
    set "CUR_LOW=k"
    REM If already K:, check if configs reference J:
    set "OTHER=J:"
    set "OTHER_LOW=j"
) else if /i "%DRV%"=="J:" (
    set "OTHER=K:"
    set "OTHER_LOW=k"
    set "CUR_LOW=j"
) else (
    if not "%SILENT%"=="silent" echo [!] Unknown drive: %DRV% - expected K: or J:
    goto :EOF
)

REM Files to patch (all configs with drive-letter references)
set "FILES="
set "FILES=%FILES% %GENAI%\.claude.json"
set "FILES=%FILES% %GENAI%\.claude\settings.local.json"
set "FILES=%FILES% %GENAI%\.bashrc"
set "FILES=%FILES% %GENAI%\CLAUDE.md"
set "FILES=%FILES% %GENAI%\.claude\CLAUDE.md"
set "FILES=%FILES% %GENAI%\.claude\rules\environment.md"
set "FILES=%FILES% %GENAI%\.claude\rules\workflow-protocol.md"
set "FILES=%FILES% %GENAI%\.claude\rules\nexus-gateway.md"
set "FILES=%FILES% %GENAI%\.claude\rules\f-architecture.md"

set "PATCHED=0"

for %%F in (%FILES%) do (
    if exist "%%F" (
        findstr /i /c:"%OTHER%\PortableApps" "%%F" >nul 2>&1
        if not errorlevel 1 (
            if not "%SILENT%"=="silent" echo [*] Patching: %%~nxF
            powershell -NoProfile -Command ^
                "$f = '%%F'; " ^
                "$c = [IO.File]::ReadAllText($f); " ^
                "$c = $c.Replace('%OTHER%\PortableApps', '%DRV%\PortableApps'); " ^
                "$c = $c.Replace('%OTHER%/PortableApps', '%DRV%/PortableApps'); " ^
                "$c = $c.Replace('%OTHER%\\PortableApps', '%DRV%\\PortableApps'); " ^
                "[IO.File]::WriteAllText($f, $c)"
            set /a PATCHED+=1
        ) else (
            REM Also check forward-slash variant
            findstr /i /c:"%OTHER%/PortableApps" "%%F" >nul 2>&1
            if not errorlevel 1 (
                if not "%SILENT%"=="silent" echo [*] Patching: %%~nxF
                powershell -NoProfile -Command ^
                    "$f = '%%F'; " ^
                    "$c = [IO.File]::ReadAllText($f); " ^
                    "$c = $c.Replace('%OTHER%/PortableApps', '%DRV%/PortableApps'); " ^
                    "$c = $c.Replace('%OTHER%\PortableApps', '%DRV%\PortableApps'); " ^
                    "$c = $c.Replace('%OTHER%\\PortableApps', '%DRV%\\PortableApps'); " ^
                    "[IO.File]::WriteAllText($f, $c)"
                set /a PATCHED+=1
            )
        )
    )
)

REM Patch bash-style paths (/k/ -> /j/ or vice versa)
if exist "%GENAI%\.bashrc" (
    findstr /i /c:"/%OTHER_LOW%/PortableApps" "%GENAI%\.bashrc" >nul 2>&1
    if not errorlevel 1 (
        if not "%SILENT%"=="silent" echo [*] Patching .bashrc unix paths: /%OTHER_LOW%/ -^> /%CUR_LOW%/
        powershell -NoProfile -Command ^
            "$f = '%GENAI%\.bashrc'; " ^
            "$c = [IO.File]::ReadAllText($f); " ^
            "$c = $c.Replace('/%OTHER_LOW%/', '/%CUR_LOW%/'); " ^
            "[IO.File]::WriteAllText($f, $c)"
        set /a PATCHED+=1
    )
)

if not "%SILENT%"=="silent" (
    if %PATCHED% GTR 0 (
        echo [+] %PATCHED% files patched for %DRV%
    ) else (
        echo [*] All configs already set for %DRV%
    )
)

endlocal
