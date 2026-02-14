$targetFolder = "K:\새 폴더"
if (Test-Path -LiteralPath $targetFolder) {
    Write-Host "Deleting: $targetFolder"
    Remove-Item -LiteralPath $targetFolder -Recurse -Force -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $targetFolder) {
        Write-Host "Still exists, trying robocopy purge..."
        $emptyDir = "K:\EMPTY_TEMP"
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
        robocopy $emptyDir $targetFolder /MIR /R:1 /W:1 | Out-Null
        Remove-Item -LiteralPath $targetFolder -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $emptyDir -Force -ErrorAction SilentlyContinue
        if (Test-Path -LiteralPath $targetFolder) {
            Write-Host "FAILED - folder still exists"
        } else {
            Write-Host "SUCCESS - folder deleted via robocopy purge"
        }
    } else {
        Write-Host "SUCCESS - folder deleted"
    }
} else {
    Write-Host "Folder not found"
}
