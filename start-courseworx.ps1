# CourseWorx Start Script
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    CourseWorx - Starting Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR: npm is not installed or not in PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "🚀 Starting CourseWorx..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend API will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To stop the application, press Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Start both frontend and backend
npm run start 