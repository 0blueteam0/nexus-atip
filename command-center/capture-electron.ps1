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

$procs = Get-Process -Name electron -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }
if (-not $procs) { Write-Host "No Electron window found"; exit 1 }

$p = $procs | Select-Object -First 1
Write-Host "Found Electron: PID=$($p.Id)"

# SW_MAXIMIZE = 3
[Win32]::ShowWindow($p.MainWindowHandle, 3) | Out-Null
Start-Sleep -Milliseconds 500
[Win32]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
Start-Sleep -Seconds 3

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$screen = [System.Windows.Forms.Screen]::PrimaryScreen
$bitmap = New-Object System.Drawing.Bitmap($screen.Bounds.Width, $screen.Bounds.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Bounds.Location, [System.Drawing.Point]::Empty, $screen.Bounds.Size)
$bitmap.Save("K:\PortableApps\genai\command-center\screenshot5.png")
$graphics.Dispose()
$bitmap.Dispose()
Write-Host "Screenshot saved: screenshot5.png"
