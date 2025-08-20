# CourseWorx Start Script
Write-Host "Starting CourseWorx..."

# Check if Node.js is installed
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Check if npm is installed
$npmVersion = npm --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm is not installed or not in PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "npm version: $npmVersion" -ForegroundColor Green

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing root dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host "Starting CourseWorx..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan

# Start both frontend and backend
npm run start
