# CourseWorx Stop Script
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    CourseWorx - Stopping Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Looking for Node.js processes..." -ForegroundColor Yellow

# Get all Node.js processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Yellow
    
    # Stop all Node.js processes
    try {
        Stop-Process -Name "node" -Force
        Write-Host "✅ All Node.js processes stopped successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error stopping Node.js processes: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️  No Node.js processes were running" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 CourseWorx has been stopped" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to continue" 