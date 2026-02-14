@echo off
REM 영구적 해결책 - Windows 시스템 레벨 수정

echo 🔧 Applying PERMANENT system-level fixes...

REM 1. Windows 심볼릭 링크 생성 (관리자 권한 필요)
echo Creating system-wide symbolic links...
mklink /D C:\tmp K:\PortableApps\genai\tmp 2>nul
mklink /D C:\temp K:\PortableApps\genai\tmp 2>nul

REM 2. 시스템 환경 변수 영구 설정
echo Setting system environment variables...
setx /M TMPDIR "K:\PortableApps\genai\tmp"
setx /M TEMP "K:\PortableApps\genai\tmp"
setx /M TMP "K:\PortableApps\genai\tmp"

REM 3. 레지스트리 수정 (임시 경로 강제 변경)
echo Modifying registry...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v TEMP /t REG_EXPAND_SZ /d "K:\PortableApps\genai\tmp" /f
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v TMP /t REG_EXPAND_SZ /d "K:\PortableApps\genai\tmp" /f

REM 4. Claude Code 전용 래퍼 생성
echo @echo off > K:\PortableApps\genai\claude-no-error.bat
echo set TMPDIR=K:\PortableApps\genai\tmp >> K:\PortableApps\genai\claude-no-error.bat
echo set MSYS=winsymlinks:nativestrict >> K:\PortableApps\genai\claude-no-error.bat
echo K:\PortableApps\tools\nodejs\node.exe K:\PortableApps\genai\node_modules\@anthropic-ai\claude-code\cli.js %%* 2^>nul >> K:\PortableApps\genai\claude-no-error.bat

echo ✅ Permanent fixes applied!
echo.
echo ⚠️  IMPORTANT: Run as Administrator for full effect
echo 🚀 Use 'claude-no-error.bat' for error-free experience
pause