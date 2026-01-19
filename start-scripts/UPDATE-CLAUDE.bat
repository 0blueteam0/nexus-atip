@echo off
echo [*] Claude Code Portable Update Script
echo [*] Checking current version...
for /f "tokens=*" %%i in ('K:\PortableApps\Claude-Code\claude.bat --version 2^>nul') do set CURRENT_VERSION=%%i
echo [*] Current: %CURRENT_VERSION%
echo [*] Installing latest version...
echo.
echo [!] IMPORTANT: Please close Claude Code first!
echo [!] WARNING: This will update Claude Code in portable environment
echo [!] Make sure to backup your settings first
echo.
echo Press any key AFTER closing Claude Code...
pause

echo [*] Backing up critical files...
copy ".claude.json" ".claude.json.backup" >nul 2>&1
copy "claude.bat" "claude.bat.backup" >nul 2>&1
xcopy /E /I /Y ".claude" ".claude-backup" >nul 2>&1

echo [*] Updating Claude Code...
K:\PortableApps\tools\nodejs\npm.cmd install @anthropic-ai/claude-code@latest --save

echo.
echo [*] Update complete! 
echo [*] Run 'claude.bat --version' to verify
pause