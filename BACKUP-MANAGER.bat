@echo off
REM === Vite 백업 관리 시스템 ===
REM 사용법: BACKUP-MANAGER.bat [backup|restore|list]

set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

if "%1"=="backup" goto :backup
if "%1"=="restore" goto :restore
if "%1"=="list" goto :list
goto :help

:backup
echo [+] Creating backup: backup-%TIMESTAMP%.html
copy K:\PortableApps\Claude-Code\vite-app\index.html K:\PortableApps\Claude-Code\backups\vite\backup-%TIMESTAMP%.html
echo [+] Backup created successfully!
goto :end

:restore
echo [+] Available backups:
dir /b K:\PortableApps\Claude-Code\backups\vite\*.html
set /p BACKUP_NAME="Enter backup filename to restore: "
copy K:\PortableApps\Claude-Code\backups\vite\%BACKUP_NAME% K:\PortableApps\Claude-Code\vite-app\index.html
echo [+] Restored from %BACKUP_NAME%
goto :end

:list
echo [*] Available backups:
dir /b /od K:\PortableApps\Claude-Code\backups\vite\*.html
goto :end

:help
echo.
echo BACKUP MANAGER - Vite Project Safety System
echo ============================================
echo Usage:
echo   BACKUP-MANAGER.bat backup   - Create new backup
echo   BACKUP-MANAGER.bat restore  - Restore from backup
echo   BACKUP-MANAGER.bat list     - List all backups
echo.
echo Current project: vite-app/index.html
echo Backup location: backups/vite/
echo.

:end