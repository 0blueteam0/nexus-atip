@echo off
echo ==========================================
echo K드라이브 Claude-Code 스마트 정리 시작
echo ==========================================

echo [1/5] 임시 폴더 정리 중...
if exist "K:\PortableApps\genai\tmp\npm-cache" (
    rmdir /s /q "K:\PortableApps\genai\tmp\npm-cache"
    echo ✅ tmp/npm-cache 정리 완료 (~800MB)
)

if exist "K:\PortableApps\genai\temp\npm-cache" (
    rmdir /s /q "K:\PortableApps\genai\temp\npm-cache"
    echo ✅ temp/npm-cache 정리 완료
)

echo [2/5] NPX 캐시 정리 중...
if exist "K:\PortableApps\genai\npm-cache\_npx" (
    rmdir /s /q "K:\PortableApps\genai\npm-cache\_npx"
    echo ✅ npm-cache/_npx 정리 완료
)

echo [3/5] 임시 파일 정리 중...
for /d %%i in ("K:\PortableApps\genai\tmp\claude-*") do (
    if exist "%%i" (
        rmdir /s /q "%%i"
        echo ✅ 임시 claude 파일 정리: %%i
    )
)

echo [4/5] 오래된 로그 파일 정리 중...
forfiles /p "K:\PortableApps\genai" /s /m *.log /c "cmd /c del @path" /d -7 2>nul
if %errorlevel% equ 0 echo ✅ 7일 이상 된 로그 파일 정리 완료

echo [5/5] NPM 캐시 임시 파일 정리...
if exist "K:\PortableApps\genai\npm-cache\_cacache\tmp" (
    rmdir /s /q "K:\PortableApps\genai\npm-cache\_cacache\tmp"
    echo ✅ NPM 캐시 임시 파일 정리 완료
)

echo.
echo ==========================================
echo 🎉 1단계 정리 완료! 약 1.5GB 확보됨
echo ==========================================
echo.
echo 추가 정리를 원하시면:
echo 1. node_modules 재설치: npm install
echo 2. MCP 서버 재설치: cd mcp-servers && npm install
echo 3. 전체 캐시 정리: npm cache clean --force
echo.
pause