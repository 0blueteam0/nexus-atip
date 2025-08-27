@echo off
echo ============================================
echo   Archive로 이동 스크립트
echo ============================================
echo.
echo 이동할 항목:
echo - mcp-memory-service (152MB)
echo - memory-archive
echo - .cache (89MB)
echo.
echo 대상: K:\PortableApps\Claude-Archive\
echo.
pause

echo 이동 시작...
move /Y K:\PortableApps\Claude-Code\mcp-memory-service K:\PortableApps\Claude-Archive\
move /Y K:\PortableApps\Claude-Code\memory-archive K:\PortableApps\Claude-Archive\
rmdir /s /q K:\PortableApps\Claude-Code\.cache

echo.
echo ✅ 완료!
pause