@echo off
:loop
cls
echo ========================================
echo    Node.js 프로세스 실시간 모니터링
echo ========================================
echo.

REM 전체 Node.js 프로세스 수
for /f %%a in ('wmic process where "name='node.exe'" get processid ^| find /c /v ""') do set total=%%a
set /a total=%total%-1

REM 고아 프로세스 수
for /f %%b in ('wmic process where "name='node.exe' and ParentProcessId=0" get processid ^| find /c /v ""') do set orphan=%%b
set /a orphan=%orphan%-1

REM Bitdefender 메모리 사용량
for /f "tokens=5" %%c in ('wmic process where "name like '%%bdservicehost%%'" get WorkingSetSize ^| findstr /r "[0-9]"') do set bdmem=%%c
if not defined bdmem set bdmem=0
set /a bdmem_mb=%bdmem%/1048576

echo [상태] %date% %time%
echo ----------------------------------------
echo Total Node.js 프로세스: %total%개
echo 고아 프로세스: %orphan%개
echo Bitdefender 메모리: %bdmem_mb%MB
echo ----------------------------------------
echo.

if %total% GTR 30 (
    echo [경고] Node.js 프로세스가 30개를 초과했습니다!
    echo [조치] 고아 프로세스를 정리하시겠습니까? (Y/N)
    choice /c YN /t 10 /d N
    if errorlevel 2 goto skip
    if errorlevel 1 (
        echo [실행] 고아 프로세스 정리 중...
        for /f "skip=3 tokens=2 delims= " %%d in ('wmic process where "name='node.exe' and ParentProcessId=0" get ProcessId') do (
            taskkill /PID %%d /F 2>nul
        )
    )
)

:skip
echo.
echo 10초 후 다시 확인... (Ctrl+C로 종료)
timeout /t 10 /nobreak >nul
goto loop