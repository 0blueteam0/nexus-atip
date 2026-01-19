@echo off
echo [*] 스크린샷 촬영 중...

REM PowerShell을 사용한 스크린샷
set "timestamp=%date:~10,4%%date:~4,2%%date:~7,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "timestamp=%timestamp: =0%"
set "filename=K:/PortableApps/Claude-Code/screenshot-%timestamp%.png"

powershell -Command "& {Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $Screen = [System.Windows.Forms.SystemInformation]::VirtualScreen; $bitmap = New-Object System.Drawing.Bitmap $Screen.Width, $Screen.Height; $graphic = [System.Drawing.Graphics]::FromImage($bitmap); $graphic.CopyFromScreen($Screen.Left, $Screen.Top, 0, 0, $bitmap.Size); $bitmap.Save('%filename%'); $graphic.Dispose(); $bitmap.Dispose(); Write-Host '[+] 스크린샷 저장: %filename%'}"

echo [+] 스크린샷 촬영 완료
dir "screenshot-*.png" 2>nul && echo [+] 스크린샷 파일 발견 || echo [-] 스크린샷 파일 없음
pause