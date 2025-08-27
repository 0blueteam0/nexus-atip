@echo off
REM ============================================
REM  MINIMAL STARTUP - For scheduled tasks
REM  Absolute minimum, no UI, no prompts
REM ============================================

REM Set environment silently
set CLAUDE_HOME=K:\PortableApps\Claude-Code
set PATH=K:\PortableApps\tools\nodejs;K:\PortableApps\tools\python;%PATH%

REM Quick JSON cleanup (once)
K:\PortableApps\tools\nodejs\node.exe fix-claude-json-bug.js fix >nul 2>&1

REM Exit silently
exit /b 0