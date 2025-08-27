@echo off
echo ============================================
echo   NPM 캐시 문제 완전 해결
echo ============================================
echo.
echo 🔴 경고: npm-cache 폴더가 시스템 성능을 심각하게 저하시킵니다!
echo.

echo 1단계: 현재 크기 확인...
powershell -Command "(Get-ChildItem 'K:\PortableApps\Claude-Code\npm-cache' -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB"
echo MB 사용 중

echo.
echo 2단계: 완전 삭제 (시간이 걸립니다)...
echo 정말 삭제하시겠습니까? 
pause

echo 삭제 중... (수천 개 파일 때문에 오래 걸립니다)
rmdir /s /q K:\PortableApps\Claude-Code\npm-cache

echo.
echo 3단계: 환경변수 수정...
echo NPM 캐시를 C드라이브 임시 폴더로 변경
setx NPM_CONFIG_CACHE "%TEMP%\npm-cache"

echo.
echo ✅ 완료! 다음 효과:
echo - K드라이브 속도 회복
echo - 디스크 공간 확보  
echo - 시스템 성능 향상
echo.
echo 🎯 claude.bat도 수정이 필요합니다!
pause