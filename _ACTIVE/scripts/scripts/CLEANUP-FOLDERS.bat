@echo off
echo ============================================
echo   폴더 구조 정리 스크립트
echo ============================================
echo.

echo 삭제할 폴더들:
echo - .cache (AI 모델 캐시)
echo - .claude-server-commander (사용 안함)
echo - .local (불필요)
echo - .ssh (빈 폴더)
echo - shell-snapshots (사용 안함)
echo - npm-cache (성능 문제)
echo.

echo 정말 삭제하시겠습니까?
pause

echo.
echo 삭제 시작...

rmdir /s /q .cache 2>nul
rmdir /s /q .claude-server-commander 2>nul
rmdir /s /q .local 2>nul
rmdir /s /q .ssh 2>nul
rmdir /s /q shell-snapshots 2>nul
rmdir /s /q npm-cache 2>nul

echo.
echo ✅ 정리 완료!
pause