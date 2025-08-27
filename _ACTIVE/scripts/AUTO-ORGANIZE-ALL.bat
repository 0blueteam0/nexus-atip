@echo off
REM ============================================
REM  AUTO-ORGANIZE-ALL
REM  Automatically organizes ALL files & folders
REM  into systematic subfolders
REM ============================================
setlocal EnableDelayedExpansion

echo ============================================
echo    AUTO-ORGANIZE EVERYTHING
echo    Date: %date% %time%
echo ============================================
echo.

REM Create organized structure
echo [*] Creating organized folder structure...

REM Main categories
mkdir "K:\PortableApps\Claude-Code\_SYSTEM" 2>nul
mkdir "K:\PortableApps\Claude-Code\_ACTIVE" 2>nul
mkdir "K:\PortableApps\Claude-Code\_ARCHIVE" 2>nul
mkdir "K:\PortableApps\Claude-Code\_TEMP" 2>nul

REM System subfolders
mkdir "K:\PortableApps\Claude-Code\_SYSTEM\mcp-servers" 2>nul
mkdir "K:\PortableApps\Claude-Code\_SYSTEM\tools" 2>nul
mkdir "K:\PortableApps\Claude-Code\_SYSTEM\configs" 2>nul
mkdir "K:\PortableApps\Claude-Code\_SYSTEM\documentation" 2>nul

REM Active subfolders
mkdir "K:\PortableApps\Claude-Code\_ACTIVE\scripts" 2>nul
mkdir "K:\PortableApps\Claude-Code\_ACTIVE\projects" 2>nul
mkdir "K:\PortableApps\Claude-Code\_ACTIVE\data" 2>nul

REM Archive subfolders by date
set TODAY=%date:~0,4%-%date:~5,2%-%date:~8,2%
mkdir "K:\PortableApps\Claude-Code\_ARCHIVE\%TODAY%" 2>nul
mkdir "K:\PortableApps\Claude-Code\_ARCHIVE\old" 2>nul

REM ========================================
REM STEP 1: Move system folders
REM ========================================
echo.
echo [1/5] Organizing system folders...

if exist "mcp-servers" move "mcp-servers" "_SYSTEM\" >nul 2>&1
if exist "tools" move "tools" "_SYSTEM\" >nul 2>&1
if exist "documentation" move "documentation" "_SYSTEM\" >nul 2>&1
if exist "node_modules" echo    [!] Keeping node_modules (required)

REM ========================================
REM STEP 2: Move active folders
REM ========================================
echo [2/5] Organizing active folders...

if exist "systems" move "systems" "_ACTIVE\scripts\" >nul 2>&1
if exist "scripts" move "scripts" "_ACTIVE\scripts\" >nul 2>&1
if exist "hooks" move "hooks" "_ACTIVE\scripts\" >nul 2>&1
if exist "projects" move "projects" "_ACTIVE\" >nul 2>&1
if exist "ShrimpData" move "ShrimpData" "_ACTIVE\data\" >nul 2>&1
if exist "data" move "data" "_ACTIVE\data\" >nul 2>&1
if exist "statsig" move "statsig" "_ACTIVE\data\" >nul 2>&1

REM ========================================
REM STEP 3: Clean temp folder
REM ========================================
echo [3/5] Cleaning temp folder...

if exist "temp" (
    cd temp
    del /Q *.xml 2>nul
    del /Q *.tmp 2>nul
    del /Q *.log 2>nul
    cd ..
    REM Keep temp folder but empty
)

if exist "npm-cache" rmdir /S /Q "npm-cache" 2>nul

REM ========================================
REM STEP 4: Archive old folders
REM ========================================
echo [4/5] Archiving old folders...

if exist "ARCHIVE" move "ARCHIVE" "_ARCHIVE\old\" >nul 2>&1
if exist "BACKUP-*" move "BACKUP-*" "_ARCHIVE\old\" >nul 2>&1
if exist "ESSENTIAL-BACKUP" move "ESSENTIAL-BACKUP" "_ARCHIVE\old\" >nul 2>&1
if exist "FULL-BACKUP-*" move "FULL-BACKUP-*" "_ARCHIVE\old\" >nul 2>&1
if exist "old" move "old" "_ARCHIVE\old\" >nul 2>&1
if exist "todos" move "todos" "_ARCHIVE\old\" >nul 2>&1

REM ========================================
REM STEP 5: Move all loose files
REM ========================================
echo [5/5] Organizing loose files...

REM Keep essential files in root
REM Everything else goes to organized folders

REM Move all .bat files (except essential ones)
for %%f in (*.bat) do (
    if not "%%f"=="claude.bat" (
    if not "%%f"=="AUTO-ORGANIZE-ALL.bat" (
        move "%%f" "_ACTIVE\scripts\" >nul 2>&1
    ))
)

REM Move all .txt files to archive
for %%f in (*.txt) do (
    move "%%f" "_ARCHIVE\%TODAY%\" >nul 2>&1
)

REM Move all .md files (except CLAUDE.md)
for %%f in (*.md) do (
    if not "%%f"=="CLAUDE.md" (
        move "%%f" "_SYSTEM\documentation\" >nul 2>&1
    )
)

REM Move all .js files
for %%f in (*.js) do (
    move "%%f" "_ACTIVE\scripts\" >nul 2>&1
)

REM Move all .py files
for %%f in (*.py) do (
    move "%%f" "_ARCHIVE\%TODAY%\" >nul 2>&1
)

REM Move all .ps1 files
for %%f in (*.ps1) do (
    move "%%f" "_ARCHIVE\%TODAY%\" >nul 2>&1
)

REM ========================================
REM Final cleanup
REM ========================================
echo.
echo [*] Final cleanup...

REM Delete nul file
if exist "nul" del "nul" 2>nul

REM Count remaining files
set /a count=0
for %%f in (*.*) do set /a count+=1

echo.
echo ========================================
echo    ORGANIZATION COMPLETE!
echo ========================================
echo.
echo Root directory now has only !count! files
echo All files and folders organized into:
echo   _SYSTEM/  - System files (mcp, tools, docs)
echo   _ACTIVE/  - Active projects and scripts
echo   _ARCHIVE/ - Old and temporary files
echo   _TEMP/    - Temporary workspace (auto-cleaned)
echo.
echo [+] Auto-organization completed!
pause