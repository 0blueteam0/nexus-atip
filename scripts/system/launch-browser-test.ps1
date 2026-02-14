# PowerShell 스크립트: 정확한 2560x1330 브라우저 테스트
Write-Host "[*] Playwright 브라우저 테스트 시작..." -ForegroundColor Cyan

# Chrome 브라우저를 정확한 크기로 실행
$chromeArgs = @(
    "--new-window"
    "--window-size=2560,1330"
    "--window-position=0,0"
    "--disable-web-security"
    "--allow-running-insecure-content"
    "--user-data-dir=K:/PortableApps/genai/chrome-temp"
    "http://localhost:5173"
)

Write-Host "[+] Chrome 실행 중..." -ForegroundColor Green
Write-Host "    크기: 2560 x 1330" -ForegroundColor Yellow
Write-Host "    URL: http://localhost:5173" -ForegroundColor Yellow

# Chrome 실행
Start-Process "chrome" -ArgumentList $chromeArgs

# 5초 대기
Write-Host "[*] 5초 대기 중..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "[+] 브라우저 실행 완료" -ForegroundColor Green
Write-Host "    수동으로 다음 테스트 진행:" -ForegroundColor Yellow
Write-Host "    1. 화면 크기 확인 (F12 - Console에서 window.innerWidth, window.innerHeight)" -ForegroundColor White
Write-Host "    2. 버튼 클릭 테스트" -ForegroundColor White
Write-Host "    3. 콘솔 에러 확인" -ForegroundColor White
Write-Host "    4. 기능 동작 확인" -ForegroundColor White

# 테스트 페이지도 함께 열기
Write-Host "[*] 테스트 페이지도 함께 실행..." -ForegroundColor Cyan
$testPageArgs = @(
    "--new-window"
    "--window-size=1280,720"
    "--window-position=100,100"
    "file:///K:/PortableApps/genai/browser-test.html"
)
Start-Process "chrome" -ArgumentList $testPageArgs