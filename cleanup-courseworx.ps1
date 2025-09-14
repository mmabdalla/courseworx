# CourseWorx Cleanup Script
Write-Host "CourseWorx Cleanup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

Write-Host "Killing all Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js processes. Killing them..." -ForegroundColor Red
    foreach ($process in $nodeProcesses) {
        Write-Host "Killing Node.js process (PID: $($process.Id))" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 3
    Write-Host "All Node.js processes killed." -ForegroundColor Green
} else {
    Write-Host "No Node.js processes found." -ForegroundColor Green
}

Write-Host "`nCleanup completed!" -ForegroundColor Green
Write-Host "You can now run start-courseworx.ps1" -ForegroundColor Cyan
Write-Host "`nPress Enter to exit..." -ForegroundColor Yellow
Read-Host
