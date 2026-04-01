# CourseWorx Database Management Script
# This script handles database operations for testing environments
# Usage: .\DatabaseManager.ps1 [action] [options]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dump", "restore", "list", "cleanup")]
    [string]$Action,
    
    [string]$DatabaseName = "",
    [string]$OutputFile = "",
    [string]$InputFile = "",
    [string]$Version = ""
)

# Configuration
$PostgresHost = "localhost"
$PostgresPort = "5432"
$PostgresUser = "postgres"
$PostgresPassword = "password"  # Update this with your actual password
$DumpDirectory = "D:\dev\projects\CourseWorx\test\database-dumps"

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

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." $Cyan
    
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
    
    # Create dump directory if it doesn't exist
    if (-not (Test-Path $DumpDirectory)) {
        Write-ColorOutput "📁 Creating dump directory: $DumpDirectory" $Yellow
        New-Item -ItemType Directory -Path $DumpDirectory -Force | Out-Null
    }
}

function Get-DatabaseList {
    Write-ColorOutput "📋 Listing CourseWorx databases..." $Cyan
    $env:PGPASSWORD = $PostgresPassword
    
    $query = "SELECT datname FROM pg_database WHERE datname LIKE 'cx_%' ORDER BY datname;"
    $databases = $query | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres -t
    
    if ($databases) {
        Write-ColorOutput "🗄️  Available CourseWorx databases:" $Blue
        $databases -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object {
            $dbName = $_.Trim()
            if ($dbName) {
                Write-ColorOutput "  - $dbName" $Green
            }
        }
    } else {
        Write-ColorOutput "⚠️  No CourseWorx databases found" $Yellow
    }
}

function Dump-Database {
    param([string]$DatabaseName, [string]$OutputFile)
    
    if (-not $DatabaseName) {
        Write-ColorOutput "❌ Database name is required for dump operation" $Red
        return
    }
    
    # Check if database exists
    $env:PGPASSWORD = $PostgresPassword
    $checkQuery = "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName';"
    $exists = $checkQuery | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres -t
    
    if (-not $exists -or $exists.Trim() -eq "") {
        Write-ColorOutput "❌ Database '$DatabaseName' does not exist" $Red
        return
    }
    
    # Generate output filename if not provided
    if (-not $OutputFile) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $OutputFile = Join-Path $DumpDirectory "$DatabaseName`_$timestamp.sql"
    }
    
    Write-ColorOutput "📊 Dumping database: $DatabaseName" $Cyan
    Write-ColorOutput "📁 Output file: $OutputFile" $Blue
    
    # Create dump
    $env:PGPASSWORD = $PostgresPassword
    pg_dump -h $PostgresHost -p $PostgresPort -U $PostgresUser -d $DatabaseName --clean --create --if-exists > $OutputFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Database dump completed successfully" $Green
        Write-ColorOutput "📊 File size: $((Get-Item $OutputFile).Length / 1MB) MB" $Blue
    } else {
        Write-ColorOutput "❌ Database dump failed" $Red
    }
}

function Restore-Database {
    param([string]$InputFile, [string]$DatabaseName)
    
    if (-not $InputFile) {
        Write-ColorOutput "❌ Input file is required for restore operation" $Red
        return
    }
    
    if (-not (Test-Path $InputFile)) {
        Write-ColorOutput "❌ Input file not found: $InputFile" $Red
        return
    }
    
    # Extract database name from file if not provided
    if (-not $DatabaseName) {
        $content = Get-Content $InputFile -Head 20
        $dbMatch = $content | Where-Object { $_ -match "CREATE DATABASE `"([^`"]+)`"" }
        if ($dbMatch) {
            $DatabaseName = ($dbMatch -split "`"")[1]
        } else {
            Write-ColorOutput "❌ Could not determine database name from dump file" $Red
            return
        }
    }
    
    Write-ColorOutput "📊 Restoring database: $DatabaseName" $Cyan
    Write-ColorOutput "📁 Input file: $InputFile" $Blue
    
    # Drop existing database if it exists
    Write-ColorOutput "🗑️  Dropping existing database if it exists..." $Yellow
    $env:PGPASSWORD = $PostgresPassword
    $dropQuery = "DROP DATABASE IF EXISTS `"$DatabaseName`";"
    $dropQuery | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres
    
    # Restore database
    Write-ColorOutput "🔄 Restoring database from dump..." $Cyan
    $env:PGPASSWORD = $PostgresPassword
    Get-Content $InputFile | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Database restore completed successfully" $Green
    } else {
        Write-ColorOutput "❌ Database restore failed" $Red
    }
}

function Cleanup-Databases {
    param([string]$Version)
    
    Write-ColorOutput "🧹 Cleaning up databases..." $Cyan
    
    $env:PGPASSWORD = $PostgresPassword
    
    if ($Version) {
        # Clean up specific version
        $DatabaseName = "cx_$Version"
        Write-ColorOutput "🗑️  Dropping database: $DatabaseName" $Yellow
        $dropQuery = "DROP DATABASE IF EXISTS `"$DatabaseName`";"
        $dropQuery | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Database $DatabaseName dropped successfully" $Green
        } else {
            Write-ColorOutput "❌ Failed to drop database $DatabaseName" $Red
        }
    } else {
        # Clean up all CourseWorx databases
        Write-ColorOutput "🗑️  Dropping all CourseWorx databases..." $Yellow
        $query = "SELECT datname FROM pg_database WHERE datname LIKE 'cx_%';"
        $databases = $query | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres -t
        
        if ($databases) {
            $databases -split "`n" | Where-Object { $_.Trim() -ne "" } | ForEach-Object {
                $dbName = $_.Trim()
                if ($dbName) {
                    Write-ColorOutput "🗑️  Dropping database: $dbName" $Yellow
                    $dropQuery = "DROP DATABASE IF EXISTS `"$dbName`";"
                    $dropQuery | psql -h $PostgresHost -p $PostgresPort -U $PostgresUser -d postgres
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-ColorOutput "✅ Database $dbName dropped successfully" $Green
                    } else {
                        Write-ColorOutput "❌ Failed to drop database $dbName" $Red
                    }
                }
            }
        } else {
            Write-ColorOutput "⚠️  No CourseWorx databases found to clean up" $Yellow
        }
    }
}

function Show-Usage {
    Write-ColorOutput "🎯 CourseWorx Database Manager" $Cyan
    Write-ColorOutput "=============================" $Cyan
    Write-ColorOutput ""
    Write-ColorOutput "Usage: .\DatabaseManager.ps1 [action] [options]" $Blue
    Write-ColorOutput ""
    Write-ColorOutput "Actions:" $Yellow
    Write-ColorOutput "  dump     - Create a database dump" $White
    Write-ColorOutput "  restore  - Restore a database from dump" $White
    Write-ColorOutput "  list     - List all CourseWorx databases" $White
    Write-ColorOutput "  cleanup  - Clean up databases" $White
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" $Yellow
    Write-ColorOutput "  .\DatabaseManager.ps1 dump -DatabaseName cx_2.0.4" $White
    Write-ColorOutput "  .\DatabaseManager.ps1 dump -DatabaseName cx_2.0.4 -OutputFile 'my-dump.sql'" $White
    Write-ColorOutput "  .\DatabaseManager.ps1 restore -InputFile 'cx_2.0.4_20241219_143000.sql'" $White
    Write-ColorOutput "  .\DatabaseManager.ps1 restore -InputFile 'my-dump.sql' -DatabaseName cx_2.0.5" $White
    Write-ColorOutput "  .\DatabaseManager.ps1 list" $White
    Write-ColorOutput "  .\DatabaseManager.ps1 cleanup" $White
    Write-ColorOutput "  .\DatabaseManager.ps1 cleanup -Version 2.0.4" $White
}

# Main execution
try {
    Write-ColorOutput "🎯 CourseWorx Database Manager" $Cyan
    Write-ColorOutput "==============================" $Cyan
    
    # Check prerequisites
    Test-Prerequisites
    
    # Execute action
    switch ($Action) {
        "dump" {
            Dump-Database -DatabaseName $DatabaseName -OutputFile $OutputFile
        }
        "restore" {
            Restore-Database -InputFile $InputFile -DatabaseName $DatabaseName
        }
        "list" {
            Get-DatabaseList
        }
        "cleanup" {
            Cleanup-Databases -Version $Version
        }
        default {
            Show-Usage
        }
    }
    
} catch {
    Write-ColorOutput "❌ Operation failed: $($_.Exception.Message)" $Red
    exit 1
}


