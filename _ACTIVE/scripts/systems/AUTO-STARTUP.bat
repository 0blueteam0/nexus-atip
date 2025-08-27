@echo off
:: 완전 자동 시작 - 사용자 개입 불필요
:: This runs EVERYTHING automatically

echo [AUTO-STARTUP] Starting autonomous systems...

:: 1. 환경 자동 설정
set CLAUDE_HOME=K:\PortableApps\Claude-Code
set TMPDIR=%CLAUDE_HOME%\tmp
set TEMP=%CLAUDE_HOME%\tmp
mkdir %CLAUDE_HOME%\tmp 2>nul

:: 2. 모든 자율 시스템 백그라운드 시작
start /B node "%CLAUDE_HOME%\systems\anomaly-detector.js" 2>nul
start /B node "%CLAUDE_HOME%\systems\evolution-engine.js" 2>nul
start /B node "%CLAUDE_HOME%\systems\memory-optimizer.js" 2>nul
start /B node "%CLAUDE_HOME%\systems\forensic-logger.js" 2>nul
start /B node "%CLAUDE_HOME%\systems\watchdog.js" 2>nul
start /B node "%CLAUDE_HOME%\systems\auto-executor.js" 2>nul

:: 3. 자동 정리 및 최적화
powershell -Command "& {
    # 오래된 파일 자동 아카이브
    $oldFiles = Get-ChildItem -Path 'K:\PortableApps\Claude-Code' -File | Where {$_.LastWriteTime -lt (Get-Date).AddDays(-30)}
    if ($oldFiles) {
        $archivePath = 'K:\PortableApps\Claude-Archive\auto-' + (Get-Date -Format 'yyyyMMdd')
        New-Item -ItemType Directory -Path $archivePath -Force | Out-Null
        $oldFiles | Move-Item -Destination $archivePath -Force
    }
    
    # 메모리 자동 최적화
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
    [System.GC]::Collect()
}" 2>nul

:: 4. Claude Code 자동 시작 (에러 무시)
start /B cmd /c "K:\PortableApps\tools\nodejs\node.exe K:\PortableApps\Claude-Code\node_modules\@anthropic-ai\claude-code\cli.js 2>nul"

echo [AUTO-STARTUP] All systems running autonomously
exit /b 0