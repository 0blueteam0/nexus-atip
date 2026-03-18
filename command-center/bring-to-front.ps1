Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

$procs = Get-Process | Where-Object { $_.MainWindowTitle -like '*Command Center*' }
foreach ($p in $procs) {
    Write-Host "Found: $($p.MainWindowTitle) PID=$($p.Id)"
    [Win32]::ShowWindow($p.MainWindowHandle, 9) | Out-Null
    [Win32]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
}
if (-not $procs) { Write-Host "No Command Center window found" }

Start-Sleep -Seconds 2

# Take screenshot
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
$bitmap.Save("K:\PortableApps\genai\command-center\screenshot2.png")
$graphics.Dispose()
$bitmap.Dispose()
Write-Host "Screenshot saved"
