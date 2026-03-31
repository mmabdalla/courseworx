# CourseWorx Deployment Script
# This script deploys a specific version of CourseWorx to a test environment
# Usage: .\Deploy.ps1 [version] [test-data-source]

param(
    [string]$Version = "",
    [string]$TestDataSource = ""
)

# Configuration
$TestBaseDir = "test"
$PostgresHost = "localhost"
$PostgresPort = "5432"
$PostgresUser = "postgres"
$PostgresPassword = "password"  # Update this with your actual password
$FrontendPort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "3050" }
$BackendPort = if ($env:PORT) { $env:PORT } else { "5000" }

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-CurrentVersion {
    # Extract version from version.txt
    $versionContent = Get-Content "version.txt" -Raw
    if ($versionContent -match "CourseWorx v(\d+\.\d+\.\d+)") {
        return $matches[1]
    }
    return "unknown"
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." $Cyan
    
    # Check if we're in the right directory
    if (-not (Test-Path "version.txt")) {
        Write-ColorOutput "❌ Error: version.txt not found. Please run this script from the CourseWorx root directory." $Red
        exit 1
    }
    
    # Check if test directory exists
    if (-not (Test-Path $TestBaseDir)) {
        Write-ColorOutput "📁 Creating test directory: $TestBaseDir" $Yellow
        New-Item -ItemType Directory -Path $TestBaseDir -Force | Out-Null
    }
    
    # Check PostgreSQL connection
    Write-ColorOutput "🐘 Testing PostgreSQL connection..." $Cyan
    try {
        $env:PGPASSWORD = $PostgresPassword
        $testQuery = "SELECT version();" | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres -t
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ PostgreSQL connection successful" $Green
        } else {
            Write-ColorOutput "❌ PostgreSQL connection failed" $Red
            exit 1
        }
    } catch {
        Write-ColorOutput "❌ PostgreSQL not accessible. Please ensure PostgreSQL is running." $Red
        exit 1
    }
    
    # Check if ports are available
    Write-ColorOutput "🔌 Checking port availability..." $Cyan
    $frontendProcess = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue
    $backendProcess = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
    
    if ($frontendProcess) {
        Write-ColorOutput "⚠️  Port $FrontendPort is in use. Will attempt to kill process..." $Yellow
        $process = Get-Process -Id $frontendProcess.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            $process.Kill()
            Write-ColorOutput "✅ Killed process on port $FrontendPort" $Green
        }
    }
    
    if ($backendProcess) {
        Write-ColorOutput "⚠️  Port $BackendPort is in use. Will attempt to kill process..." $Yellow
        $process = Get-Process -Id $backendProcess.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            $process.Kill()
            Write-ColorOutput "✅ Killed process on port $BackendPort" $Green
        }
    }
}

function Deploy-Version {
    param([string]$Version)
    
    Write-ColorOutput "🚀 Starting deployment for version $Version..." $Cyan
    
    # Create version directory
    $VersionDir = Join-Path $TestBaseDir $Version
    if (Test-Path $VersionDir) {
        Write-ColorOutput "⚠️  Version directory already exists. Removing..." $Yellow
        Remove-Item $VersionDir -Recurse -Force
    }
    
    Write-ColorOutput "📁 Creating version directory: $VersionDir" $Cyan
    New-Item -ItemType Directory -Path $VersionDir -Force | Out-Null
    
    # Copy project files (excluding node_modules, uploads, etc.)
    Write-ColorOutput "📋 Copying project files..." $Cyan
    $excludePatterns = @(
        "node_modules",
        "backend\uploads",
        "frontend\build",
        ".git",
        "test",
        "screenrecordings"
    )
    
    Get-ChildItem -Path "." -Recurse | Where-Object {
        $item = $_
        $shouldExclude = $false
        foreach ($pattern in $excludePatterns) {
            if ($item.FullName -like "*\$pattern\*") {
                $shouldExclude = $true
                break
            }
        }
        return -not $shouldExclude
    } | ForEach-Object {
        $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 1)
        $targetPath = Join-Path $VersionDir $relativePath
        
        if ($_.PSIsContainer) {
            if (-not (Test-Path $targetPath)) {
                New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
            }
        } else {
            $targetDir = Split-Path $targetPath -Parent
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            Copy-Item $_.FullName $targetPath -Force
        }
    }
    
    Write-ColorOutput "✅ Project files copied successfully" $Green
    return $VersionDir
}

function Setup-Database {
    param([string]$Version, [string]$VersionDir)
    
    $DatabaseName = "cx_$Version"
    
    Write-ColorOutput "🗄️  Setting up database: $DatabaseName" $Cyan
    
    # Drop database if it exists
    Write-ColorOutput "🗑️  Dropping existing database if it exists..." $Yellow
    $env:PGPASSWORD = $PostgresPassword
    $dropQuery = "DROP DATABASE IF EXISTS `"$DatabaseName`";"
    $dropQuery | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres
    
    # Create new database
    Write-ColorOutput "🆕 Creating new database..." $Cyan
    $createQuery = "CREATE DATABASE `"$DatabaseName`";"
    $createQuery | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Database created successfully" $Green
    } else {
        Write-ColorOutput "❌ Database creation failed" $Red
        exit 1
    }
    
    # Update database configuration in the deployed version
    $dbConfigPath = Join-Path $VersionDir "backend\config\database.js"
    if (Test-Path $dbConfigPath) {
        Write-ColorOutput "🔧 Updating database configuration..." $Cyan
        $dbConfig = Get-Content $dbConfigPath -Raw
        $dbConfig = $dbConfig -replace 'database:\s*["\''][^"\''"]*["\''']', "database: `"$DatabaseName`""
        $dbConfig = $dbConfig -replace 'host:\s*["\''][^"\''"]*["\''']', "host: `"$PostgresHost`""
        $dbConfig = $dbConfig -replace 'port:\s*["\''][^"\''"]*["\''']', "port: `"$PostgresPort`""
        $dbConfig = $dbConfig -replace 'username:\s*["\''][^"\''"]*["\''']', "username: `"$PostgresUser`""
        $dbConfig = $dbConfig -replace 'password:\s*["\''][^"\''"]*["\''']', "password: `"$PostgresPassword`""
        Set-Content $dbConfigPath $dbConfig
        Write-ColorOutput "✅ Database configuration updated" $Green
    }
    
    return $DatabaseName
}

function Install-Dependencies {
    param([string]$VersionDir)
    
    Write-ColorOutput "📦 Installing dependencies..." $Cyan
    
    # Install backend dependencies
    Write-ColorOutput "🔧 Installing backend dependencies..." $Yellow
    Push-Location (Join-Path $VersionDir "backend")
    try {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Backend dependencies installed" $Green
        } else {
            Write-ColorOutput "❌ Backend dependency installation failed" $Red
            exit 1
        }
    } finally {
        Pop-Location
    }
    
    # Install frontend dependencies
    Write-ColorOutput "🎨 Installing frontend dependencies..." $Yellow
    Push-Location (Join-Path $VersionDir "frontend")
    try {
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Frontend dependencies installed" $Green
        } else {
            Write-ColorOutput "❌ Frontend dependency installation failed" $Red
            exit 1
        }
    } finally {
        Pop-Location
    }
}

function Start-Services {
    param([string]$VersionDir, [string]$DatabaseName)
    
    Write-ColorOutput "🚀 Starting services..." $Cyan
    
    # Start backend
    Write-ColorOutput "🔧 Starting backend server..." $Yellow
    Push-Location (Join-Path $VersionDir "backend")
    try {
        $backendJob = Start-Job -ScriptBlock {
            param($dir, $db)
            Set-Location $dir
            $env:NODE_ENV = "development"
            npm start
        } -ArgumentList (Get-Location), $DatabaseName
        
        Write-ColorOutput "✅ Backend server started (Job ID: $($backendJob.Id))" $Green
        
        # Wait a bit for backend to start
        Start-Sleep -Seconds 5
        
        # Start frontend
        Write-ColorOutput "🎨 Starting frontend server..." $Yellow
        Push-Location (Join-Path $VersionDir "frontend")
        try {
            $frontendJob = Start-Job -ScriptBlock {
                param($dir)
                Set-Location $dir
                $env:BROWSER = "none"
                npm start
            } -ArgumentList (Get-Location)
            
            Write-ColorOutput "✅ Frontend server started (Job ID: $($frontendJob.Id))" $Green
            
            # Wait for frontend to start
            Start-Sleep -Seconds 10
            
            # Open browser
            Write-ColorOutput "🌐 Opening browser..." $Cyan
            Start-Process "http://localhost:$FrontendPort"
            
            Write-ColorOutput "🎉 Deployment completed successfully!" $Green
            Write-ColorOutput "📊 Backend: http://localhost:$BackendPort" $Blue
            Write-ColorOutput "🎨 Frontend: http://localhost:$FrontendPort" $Blue
            Write-ColorOutput "🗄️  Database: $DatabaseName" $Blue
            Write-ColorOutput "📁 Version Directory: $VersionDir" $Blue
            
            # Save job IDs for later reference
            $jobInfo = @{
                Version = $Version
                VersionDir = $VersionDir
                DatabaseName = $DatabaseName
                BackendJobId = $backendJob.Id
                FrontendJobId = $frontendJob.Id
                StartTime = Get-Date
            }
            $jobInfo | ConvertTo-Json | Set-Content (Join-Path $TestBaseDir "deployment-info.json")
            
        } finally {
            Pop-Location
        }
    } finally {
        Pop-Location
    }
}

function Restore-TestData {
    param([string]$DatabaseName, [string]$TestDataSource)
    
    if (-not $TestDataSource) {
        Write-ColorOutput "⚠️  No test data source specified. Skipping data restoration." $Yellow
        return
    }
    
    Write-ColorOutput "📊 Restoring test data from: $TestDataSource" $Cyan
    
    if (Test-Path $TestDataSource) {
        $env:PGPASSWORD = $PostgresPassword
        Get-Content $TestDataSource | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $DatabaseName
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Test data restored successfully" $Green
        } else {
            Write-ColorOutput "❌ Test data restoration failed" $Red
        }
    } else {
        Write-ColorOutput "❌ Test data source not found: $TestDataSource" $Red
    }
}

# Main execution
try {
    Write-ColorOutput "🎯 CourseWorx Deployment Script" $Cyan
    Write-ColorOutput "==============================" $Cyan
    
    # Determine version
    if (-not $Version) {
        $Version = Get-CurrentVersion
        Write-ColorOutput "📋 Using current version: $Version" $Blue
    } else {
        Write-ColorOutput "📋 Using specified version: $Version" $Blue
    }
    
    # Check prerequisites
    Test-Prerequisites
    
    # Deploy version
    $VersionDir = Deploy-Version -Version $Version
    
    # Setup database
    $DatabaseName = Setup-Database -Version $Version -VersionDir $VersionDir
    
    # Install dependencies
    Install-Dependencies -VersionDir $VersionDir
    
    # Restore test data if specified
    if ($TestDataSource) {
        Restore-TestData -DatabaseName $DatabaseName -TestDataSource $TestDataSource
    }
    
    # Start services
    Start-Services -VersionDir $VersionDir -DatabaseName $DatabaseName
    
} catch {
    Write-ColorOutput "❌ Deployment failed: $($_.Exception.Message)" $Red
    exit 1
}
