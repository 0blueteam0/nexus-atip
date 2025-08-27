@echo off
echo ============================================
echo   NPM 캐시 정리 도구
echo ============================================
echo.
echo 현재 npm-cache 크기 확인 중...

REM 크기 확인
dir K:\PortableApps\Claude-Code\npm-cache /s | findstr "File(s)"

echo.
echo 정리를 시작하시겠습니까?
pause

echo.
echo 1. 임시 파일 정리 중...
rmdir /s /q K:\PortableApps\Claude-Code\npm-cache\_cacache\tmp 2>nul
mkdir K:\PortableApps\Claude-Code\npm-cache\_cacache\tmp

echo 2. 오래된 로그 삭제 중...
del /q K:\PortableApps\Claude-Code\npm-cache\_logs\*.log 2>nul

echo 3. NPX 캐시 정리 중...
rmdir /s /q K:\PortableApps\Claude-Code\npm-cache\_npx 2>nul

echo.
echo ✅ 정리 완료!
echo.
echo 정리 후 크기:
dir K:\PortableApps\Claude-Code\npm-cache /s | findstr "File(s)"

pause