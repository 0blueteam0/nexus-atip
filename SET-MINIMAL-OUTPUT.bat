@echo off
REM ============================================
REM  SET MINIMAL OUTPUT MODE
REM  Disable verbose MCP tool display
REM ============================================

echo [*] Setting minimal output mode for Claude Code...

REM Disable verbose logging
set ANTHROPIC_LOG=error
set CLAUDE_VERBOSE=false
set MCP_VERBOSE=false
set DISABLE_TOOL_PARAMETER_DISPLAY=true

echo [+] Environment variables set

REM Add to .env file
echo ANTHROPIC_LOG=error >> .env
echo CLAUDE_VERBOSE=false >> .env
echo MCP_VERBOSE=false >> .env
echo DISABLE_TOOL_PARAMETER_DISPLAY=true >> .env

echo [+] Settings saved to .env

echo.
echo [*] Minimal output mode activated!
echo [*] Restart Claude Code for changes to take effect
pause