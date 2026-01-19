@echo off
chcp 65001 > nul
cd /d K:\
for /d %%i in (*) do (
    echo Checking: %%i
    echo %%i | findstr /r "^[a-zA-Z\$\.]" > nul
    if errorlevel 1 (
        echo Found non-ASCII folder: %%i
        rd /s /q "%%i" 2>nul
        if exist "%%i" (
            echo Still exists - trying robocopy purge
            mkdir K:\EMPTY_TEMP 2>nul
            robocopy K:\EMPTY_TEMP "K:\%%i" /MIR /R:0 /W:0 > nul 2>&1
            rd /s /q "K:\%%i" 2>nul
            rd K:\EMPTY_TEMP 2>nul
        )
    )
)
echo Done!
dir K:\
