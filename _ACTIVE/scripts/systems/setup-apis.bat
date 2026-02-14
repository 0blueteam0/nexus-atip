@echo off
REM API 키 자동 설정 도우미

echo ╔════════════════════════════════════════════════════════╗
echo ║           🔑 API KEY SETUP WIZARD 🔑                  ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo 필요한 API 키:
echo.
echo 1. Context7 API (Upstash)
echo    👉 https://console.upstash.com
echo    - 무료 계정 생성
echo    - Settings → Management API → Create API key
echo.
echo 2. YouTube Data API v3 (Google)
echo    👉 https://console.cloud.google.com
echo    - 새 프로젝트 생성
echo    - YouTube Data API v3 활성화
echo    - 사용자 인증 정보 → API 키 생성
echo.
echo ════════════════════════════════════════════════════════
echo.

set /p CONTEXT7_KEY="Context7 API Key 입력 (Enter 건너뛰기): "
set /p YOUTUBE_KEY="YouTube API Key 입력 (Enter 건너뛰기): "

if not "%CONTEXT7_KEY%"=="" (
    echo Setting Context7 API key...
    powershell -Command "(Get-Content K:\PortableApps\genai\.claude.json) -replace 'YOUR_CONTEXT7_API_KEY_HERE', '%CONTEXT7_KEY%' | Set-Content K:\PortableApps\genai\.claude.json"
    echo ✅ Context7 API key set!
)

if not "%YOUTUBE_KEY%"=="" (
    echo Setting YouTube API key...
    powershell -Command "(Get-Content K:\PortableApps\genai\.claude.json) -replace 'YOUR_YOUTUBE_API_KEY_HERE', '%YOUTUBE_KEY%' | Set-Content K:\PortableApps\genai\.claude.json"
    echo ✅ YouTube API key set!
)

echo.
echo 🎉 API keys configured!
echo 🔄 Restart Claude Code to apply changes.
pause