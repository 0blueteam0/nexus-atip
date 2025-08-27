@echo off
REM Dynamic Date Helper for Claude Code
REM Prevents hardcoding mistakes

REM Get current date in various formats
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do (
    set YEAR=%%c
    set MONTH=%%a
    set DAY=%%b
)

REM Get current time
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (
    set HOUR=%%a
    set MINUTE=%%b
)

REM Export formatted dates
set ISO_DATE=%YEAR%-%MONTH%-%DAY%
set KR_DATE=%YEAR%년 %MONTH%월 %DAY%일
set US_DATE=%MONTH%/%DAY%/%YEAR%

REM Display if called directly
if "%1"=="" (
    echo ========================================
    echo Dynamic Date Helper
    echo ========================================
    echo ISO Format: %ISO_DATE%
    echo Korean: %KR_DATE%
    echo US Format: %US_DATE%
    echo Time: %HOUR%:%MINUTE%
    echo ========================================
)

REM Return specific format if requested
if "%1"=="iso" echo %ISO_DATE%
if "%1"=="kr" echo %KR_DATE%
if "%1"=="us" echo %US_DATE%
if "%1"=="time" echo %HOUR%:%MINUTE%