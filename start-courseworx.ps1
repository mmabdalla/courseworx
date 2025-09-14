# CourseWorx Start Script
Write-Host "Starting CourseWorx..." -ForegroundColor Green

# Function to check if a port is in use
function Test-PortInUse {
    param([int]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        # Only consider ports in use if they have actual application processes (PID > 4)
        $activeConnections = $connections | Where-Object { $_.OwningProcess -gt 4 }
        return $activeConnections -ne $null
    }
    catch {
        return $false
    }
}

# Function to kill processes using specific ports
function Kill-ProcessesOnPort {
    param([int]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($connection in $connections) {
                # Only kill non-system processes (PID > 4)
                if ($connection.OwningProcess -gt 4) {
                    $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "Killing process $($process.ProcessName) (PID: $($process.Id)) using port $Port" -ForegroundColor Yellow
                        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                    }
                }
            }
            Start-Sleep -Seconds 2
        }
    }
    catch {
        Write-Host "Warning: Could not kill processes on port $Port" -ForegroundColor Yellow
    }
}

# Function to kill all Node.js processes
function Kill-AllNodeProcesses {
    try {
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            Write-Host "Found $($nodeProcesses.Count) Node.js processes running. Killing them..." -ForegroundColor Yellow
            foreach ($process in $nodeProcesses) {
                Write-Host "Killing Node.js process (PID: $($process.Id))" -ForegroundColor Yellow
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 3
        } else {
            Write-Host "No Node.js processes found running." -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Warning: Could not kill Node.js processes" -ForegroundColor Yellow
    }
}

# Function to wait for port to be free
function Wait-ForPortFree {
    param([int]$Port, [int]$TimeoutSeconds = 30)
    $startTime = Get-Date
    while ((Get-Date) -lt $startTime.AddSeconds($TimeoutSeconds)) {
        if (-not (Test-PortInUse -Port $Port)) {
            Write-Host "Port $Port is now free." -ForegroundColor Green
            return $true
        }
        Write-Host "Waiting for port $Port to be free..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
    Write-Host "Timeout waiting for port $Port to be free." -ForegroundColor Red
    return $false
}

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

# Check for existing processes and ports
Write-Host "Checking for existing processes and ports..." -ForegroundColor Cyan

# Check if ports 3000 and 5000 are in use
$port3000InUse = Test-PortInUse -Port 3000
$port5000InUse = Test-PortInUse -Port 5000

if ($port3000InUse -or $port5000InUse) {
    Write-Host "Ports 3000 and/or 5000 are in use. Cleaning up..." -ForegroundColor Yellow
    
    if ($port3000InUse) {
        Write-Host "Port 3000 is in use. Killing processes..." -ForegroundColor Yellow
        Kill-ProcessesOnPort -Port 3000
    }
    
    if ($port5000InUse) {
        Write-Host "Port 5000 is in use. Killing processes..." -ForegroundColor Yellow
        Kill-ProcessesOnPort -Port 5000
    }
    
    # Kill all Node.js processes to ensure clean state
    Kill-AllNodeProcesses
    
    # Wait for ports to be free
    Write-Host "Waiting for ports to be free..." -ForegroundColor Cyan
    $port3000Free = Wait-ForPortFree -Port 3000
    $port5000Free = Wait-ForPortFree -Port 5000
    
    if (-not $port3000Free -or -not $port5000Free) {
        Write-Host "ERROR: Could not free up required ports. Please check manually." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "Ports 3000 and 5000 are free." -ForegroundColor Green
}

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

# Final port check before starting
Write-Host "Final port availability check..." -ForegroundColor Cyan
if (Test-PortInUse -Port 3000) {
    Write-Host "ERROR: Port 3000 is still in use after cleanup!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (Test-PortInUse -Port 5000) {
    Write-Host "ERROR: Port 5000 is still in use after cleanup!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "All ports are free. Starting CourseWorx..." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Network Access:" -ForegroundColor Cyan
Write-Host "  Frontend: http://10.0.0.96:3000" -ForegroundColor Cyan
Write-Host "  Backend: http://10.0.0.96:5000" -ForegroundColor Cyan

# Start both frontend and backend
Write-Host "Starting application..." -ForegroundColor Green
npm run start
