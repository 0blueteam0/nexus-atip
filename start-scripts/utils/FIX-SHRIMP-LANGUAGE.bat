@echo off
REM ============================================
REM  FIX SHRIMP TASK MANAGER LANGUAGE
REM  Force Korean language instead of Chinese
REM ============================================

echo [*] Setting Korean language for Shrimp Task Manager...

REM Set language environment variables
set LANG=ko_KR.UTF-8
set LANGUAGE=ko:en
set LC_ALL=ko_KR.UTF-8

echo [+] Language variables set to Korean

REM Update MCP server config with language env
echo [*] Updating .claude.json to include Korean language...

pause