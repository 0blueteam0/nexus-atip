@echo off
chcp 65001 >nul 2>&1
REM ============================================
REM  Self-Evolution AI System Launcher
REM  Instruction Evolution Engine
REM ============================================

title Evolution Engine - Self-Evolving AI
color 0E

cd /d K:\PortableApps\Claude-Code

echo ========================================
echo    EVOLUTION ENGINE - Self-Evolving AI
echo    Self-Learning and Auto-Evolution
echo ========================================
echo.

REM Set Node.js path
set PATH=K:\PortableApps\Claude-Code\tools\nodejs;%PATH%

echo [INFO] Starting Evolution Engine...
echo.

echo Features:
echo   - Knowledge Base: Learning
echo   - Pattern Recognition
echo   - Skill Development
echo   - Self-Repair
echo   - Auto-Evolution
echo.

REM Run instruction-evolution.js
K:\PortableApps\Claude-Code\tools\nodejs\node.exe K:\PortableApps\Claude-Code\systems\instruction-evolution.js

pause
