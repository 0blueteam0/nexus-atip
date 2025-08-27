@echo off
echo ============================================
echo   NPM 캐시 영구 해결
echo ============================================
echo.

echo 1. npm-cache 폴더 완전 삭제...
rmdir /s /q K:\PortableApps\Claude-Code\npm-cache

echo.
echo 2. NPM 글로벌 설정 변경...
npm config set cache C:\Windows\Temp\npm-cache --global

echo.
echo 3. 로컬 .npmrc 생성...
echo cache=C:\Windows\Temp\npm-cache > K:\PortableApps\Claude-Code\.npmrc

echo.
echo 4. 환경 변수 영구 설정...
setx NPM_CONFIG_CACHE "C:\Windows\Temp\npm-cache"

echo.
echo ✅ 완료! 이제 npm-cache가 K드라이브에 생성되지 않습니다.
echo.
echo 확인:
npm config get cache

pause