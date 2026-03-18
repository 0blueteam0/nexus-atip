// 스크린샷 촬영을 위한 간단한 테스트
const { exec } = require('child_process');

console.log('[*] 스크린샷 촬영 테스트...');

// Windows PowerShell을 사용한 스크린샷
const powershellCommand = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$Screen = [System.Windows.Forms.SystemInformation]::VirtualScreen
$Width = $Screen.Width
$Height = $Screen.Height
$Left = $Screen.Left
$Top = $Screen.Top
$bitmap = New-Object System.Drawing.Bitmap $Width, $Height
$graphic = [System.Drawing.Graphics]::FromImage($bitmap)
$graphic.CopyFromScreen($Left, $Top, 0, 0, $bitmap.Size)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$filepath = "K:/PortableApps/genai/screenshot-$timestamp.png"
$bitmap.Save($filepath)
Write-Host "[+] 스크린샷 저장: $filepath"
$graphic.Dispose()
$bitmap.Dispose()
`;

exec(`powershell -Command "${powershellCommand}"`, (error, stdout, stderr) => {
    if (error) {
        console.log(`[-] 오류: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`[-] 오류: ${stderr}`);
        return;
    }
    console.log(stdout);
    console.log('[+] 스크린샷 촬영 완료');
});