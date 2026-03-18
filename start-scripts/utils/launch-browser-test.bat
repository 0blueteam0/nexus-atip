@echo off
echo [*] Playwright 브라우저 테스트 시작...
echo [+] Chrome 실행 중...
echo     크기: 2560 x 1330
echo     URL: http://localhost:5173

REM Chrome 브라우저를 정확한 크기로 실행
start chrome --new-window --window-size=2560,1330 --window-position=0,0 --user-data-dir=K:/PortableApps/genai/chrome-temp http://localhost:5173

echo [*] 5초 대기 중...
timeout /t 5 /nobreak >nul

echo [+] 브라우저 실행 완료
echo     수동으로 다음 테스트 진행:
echo     1. 화면 크기 확인 (F12 - Console에서 window.innerWidth, window.innerHeight)
echo     2. 버튼 클릭 테스트
echo     3. 콘솔 에러 확인
echo     4. 기능 동작 확인

echo [*] 테스트 페이지도 함께 실행...
start chrome --new-window --window-size=1280,720 --window-position=100,100 file:///K:/PortableApps/genai/browser-test.html

echo [+] 모든 브라우저 실행 완료
pause