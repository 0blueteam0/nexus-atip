@echo off
echo [*] Starting MCP Auto Backup System...
echo.

REM Create backup directory
if not exist "backups\mcp-configs" (
    mkdir "backups\mcp-configs"
    echo [+] Created backup directory
)

REM Start the backup system
echo [*] Monitoring .claude.json for changes
echo [*] Backups will be saved to: backups\mcp-configs\
echo [*] Press Ctrl+C to stop
echo.

"K:\PortableApps\tools\nodejs\node.exe" "systems\auto-backup-mcp.js"

pause