@echo off
echo [*] MCP Config Restore Tool
echo.
dir /b backups\mcp-configs\*.json
echo.
echo [?] Copy backup file to .claude.json to restore
pause