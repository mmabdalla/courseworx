# CourseWorx Stop Deployment Script
# This script stops running deployments and cleans up resources
# Usage: .\Stop-Deployment.ps1 [version]

param(
    [string]$Version = "",
    [string]$FrontendPort = "3050",
    [string]$BackendPort = "5000"
)

# Configuration
$TestBaseDir = "D:\dev\projects\CourseWorx\test"

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

function Stop-Services {
    Write-ColorOutput "🛑 Stopping CourseWorx services..." $Cyan
    
    # Stop processes on frontend port
    $frontendProcesses = Get-NetTCPConnection -LocalPort $FrontendPort -ErrorAction SilentlyContinue
    if ($frontendProcesses) {
        Write-ColorOutput "🔌 Stopping frontend processes on port $FrontendPort..." $Yellow
        $frontendProcesses | ForEach-Object {
            $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-ColorOutput "🛑 Stopping process: $($process.ProcessName) (PID: $($process.Id))" $Yellow
                $process.Kill()
                Write-ColorOutput "✅ Process stopped" $Green
            }
        }
    } else {
        Write-ColorOutput "ℹ️  No processes found on port $FrontendPort" $Blue
    }
    
    # Stop processes on backend port
    $backendProcesses = Get-NetTCPConnection -LocalPort $BackendPort -ErrorAction SilentlyContinue
    if ($backendProcesses) {
        Write-ColorOutput "🔌 Stopping backend processes on port $BackendPort..." $Yellow
        $backendProcesses | ForEach-Object {
            $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-ColorOutput "🛑 Stopping process: $($process.ProcessName) (PID: $($process.Id))" $Yellow
                $process.Kill()
                Write-ColorOutput "✅ Process stopped" $Green
            }
        }
    } else {
        Write-ColorOutput "ℹ️  No processes found on port $BackendPort" $Blue
    }
    
    # Stop PowerShell jobs
    Write-ColorOutput "🔧 Stopping PowerShell jobs..." $Yellow
    $jobs = Get-Job
    if ($jobs) {
        $jobs | ForEach-Object {
            Write-ColorOutput "🛑 Stopping job: $($_.Name) (ID: $($_.Id))" $Yellow
            Stop-Job $_.Id
            Remove-Job $_.Id
            Write-ColorOutput "✅ Job stopped and removed" $Green
        }
    } else {
        Write-ColorOutput "ℹ️  No PowerShell jobs found" $Blue
    }
}

function Cleanup-Deployment {
    param([string]$Version)
    
    if (-not $Version) {
        Write-ColorOutput "⚠️  No version specified. Skipping deployment cleanup." $Yellow
        return
    }
    
    $VersionDir = Join-Path $TestBaseDir $Version
    if (Test-Path $VersionDir) {
        Write-ColorOutput "🗑️  Removing deployment directory: $VersionDir" $Yellow
        Remove-Item $VersionDir -Recurse -Force
        Write-ColorOutput "✅ Deployment directory removed" $Green
    } else {
        Write-ColorOutput "ℹ️  Deployment directory not found: $VersionDir" $Blue
    }
}

function Cleanup-Database {
    param([string]$Version)
    
    if (-not $Version) {
        Write-ColorOutput "⚠️  No version specified. Skipping database cleanup." $Yellow
        return
    }
    
    $DatabaseName = "cx_$Version"
    Write-ColorOutput "🗄️  Dropping database: $DatabaseName" $Yellow
    
    try {
        $PostgresHost = "localhost"
        $PostgresPort = "5432"
        $PostgresUser = "postgres"
        $PostgresPassword = "password"  # Update this with your actual password
        
        $env:PGPASSWORD = $PostgresPassword
        $dropQuery = "DROP DATABASE IF EXISTS `"$DatabaseName`";"
        $dropQuery | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Database $DatabaseName dropped successfully" $Green
        } else {
            Write-ColorOutput "❌ Failed to drop database $DatabaseName" $Red
        }
    } catch {
        Write-ColorOutput "❌ Database cleanup failed: $($_.Exception.Message)" $Red
    }
}

function Show-DeploymentInfo {
    $deploymentInfoPath = Join-Path $TestBaseDir "deployment-info.json"
    if (Test-Path $deploymentInfoPath) {
        Write-ColorOutput "📊 Current deployment information:" $Cyan
        $deploymentInfo = Get-Content $deploymentInfoPath | ConvertFrom-Json
        Write-ColorOutput "  Version: $($deploymentInfo.Version)" $Blue
        Write-ColorOutput "  Directory: $($deploymentInfo.VersionDir)" $Blue
        Write-ColorOutput "  Database: $($deploymentInfo.DatabaseName)" $Blue
        Write-ColorOutput "  Started: $($deploymentInfo.StartTime)" $Blue
        Write-ColorOutput "  Backend Job ID: $($deploymentInfo.BackendJobId)" $Blue
        Write-ColorOutput "  Frontend Job ID: $($deploymentInfo.FrontendJobId)" $Blue
    } else {
        Write-ColorOutput "ℹ️  No deployment information found" $Blue
    }
}

# Main execution
try {
    Write-ColorOutput "🛑 CourseWorx Stop Deployment Script" $Cyan
    Write-ColorOutput "====================================" $Cyan
    
    # Show current deployment info
    Show-DeploymentInfo
    
    # Stop services
    Stop-Services
    
    # Cleanup deployment if version specified
    if ($Version) {
        Cleanup-Deployment -Version $Version
        Cleanup-Database -Version $Version
    }
    
    Write-ColorOutput "✅ All services stopped successfully" $Green
    
} catch {
    Write-ColorOutput "❌ Stop operation failed: $($_.Exception.Message)" $Red
    exit 1
}


