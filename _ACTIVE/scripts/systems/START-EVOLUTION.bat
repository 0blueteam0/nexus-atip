@echo off
REM ============================================
REM  자가발전 AI 시스템 시작
REM  Evolution Engine Launcher
REM ============================================

title Evolution Engine - Self-Evolving AI
color 0E

cd /d K:\PortableApps\genai

echo ╔══════════════════════════════════════════════════════╗
echo ║      🧬 EVOLUTION ENGINE - 자가발전 AI 시스템 🧬      ║
echo ║           Self-Learning & Auto-Evolution              ║
echo ╚══════════════════════════════════════════════════════╝
echo.

REM Brain 디렉토리 생성
if not exist brain mkdir brain
if not exist brain\skills mkdir brain\skills
if not exist brain\capabilities mkdir brain\capabilities
if not exist brain\backups mkdir brain\backups

echo [INFO] Starting Evolution Engine...
echo.

REM Node.js 경로 설정
set PATH=K:\PortableApps\tools\nodejs;%PATH%

REM Evolution Engine 시작
echo ┌─────────────────────────────────────────────────────┐
echo │ 🧠 Brain Status:                                    │
echo │   - Knowledge Base: Initializing...                 │
echo │   - Pattern Recognition: Active                     │
echo │   - Skill Development: Ready                        │
echo │   - Self-Repair: Enabled                           │
echo │   - Auto-Evolution: Every 5 minutes                │
echo └─────────────────────────────────────────────────────┘
echo.

REM 데몬 모드로 실행
K:\PortableApps\tools\nodejs\node.exe K:\PortableApps\genai\evolution-engine.js daemon

pause