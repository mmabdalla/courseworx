# CourseWorx DEV Deployment Script - 7oudalt
# Target Host : 10.0.0.50
# Destination : /opt/courseworx

# ---- Configuration ----
$RemoteUser = "root"
$RemoteHost = "10.0.0.50"
$DestDir = "/opt/courseworx"
$DbHost = "localhost"
$DbPort = "5432"
$DbName = "courseworx_dev"
$DbUser = "courseworx"
$DbPassword = "7ouDa-123q"
$AppPort = "3050"
# -----------------------

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Blue = "Blue"
$Cyan = "Cyan"

Write-ColorOutput "==================================================" $Cyan
Write-ColorOutput "  CourseWorx DEV Deployment to $RemoteHost" $Cyan
Write-ColorOutput "==================================================" $Cyan

# 1. Prepare local staging directory
$StagingDir = "deploy-temp-dev"
$ArchiveName = "deploy-archive-dev.tar.gz"

if (Test-Path $StagingDir) { Remove-Item $StagingDir  -Recurse -Force }
if (Test-Path $ArchiveName) { Remove-Item $ArchiveName -Force }

New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null
Write-ColorOutput "Copying project files to staging..." $Cyan

$excludePatterns = @(
    "node_modules",
    "backend\uploads",
    "frontend",
    ".git",
    "test",
    "screenrecordings",
    "deploy-temp",
    "deploy-dev"
)

Get-ChildItem -Path "." -Recurse | Where-Object {
    $item = $_
    $exclude = $false
    foreach ($p in $excludePatterns) {
        if ($item.FullName -like "*\$p*") { $exclude = $true; break }
    }
    return -not $exclude
} | ForEach-Object {
    $rel = $_.FullName.Substring((Get-Location).Path.Length + 1)
    $target = Join-Path $StagingDir $rel
    if ($_.PSIsContainer) {
        if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null }
    }
    else {
        $dir = Split-Path $target -Parent
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
        Copy-Item $_.FullName $target -Force
    }
}

Write-ColorOutput "Building React Frontend for DEV..." $Cyan
Push-Location "frontend"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput "ERROR: Frontend build failed." $Red
    Pop-Location
    exit 1
}
Pop-Location

Write-ColorOutput "Copying minified frontend to staging..." $Cyan
$frontendBuildDest = Join-Path $StagingDir "frontend\build"
New-Item -ItemType Directory -Path $frontendBuildDest -Force | Out-Null
Copy-Item "frontend\build\*" $frontendBuildDest -Recurse -Force

# 2. Patch environment config in staging copy
$envPath = Join-Path $StagingDir "backend\.env"
if (Test-Path $envPath) {
    Write-ColorOutput "Patching DEV environment configuration (.env)..." $Cyan
    $envContent = Get-Content $envPath -Raw
    
    $keysToUpdate = @{
        "DB_NAME" = $DbName
        "DB_HOST" = $DbHost
        "DB_PORT" = $DbPort
        "DB_USER" = $DbUser
        "DB_PASSWORD" = $DbPassword
        "PORT" = $AppPort
        "NODE_ENV" = "development"
        "CORS_ORIGIN" = "http://10.0.0.50:3050,http://localhost:3050"
    }

    foreach ($key in $keysToUpdate.Keys) {
        $val = $keysToUpdate[$key]
        if ($envContent -match "(?m)^$key=.*`$") {
            $envContent = $envContent -replace "(?m)^$key=.*`$", "$key=$val"
        } else {
            $envContent += "`n$key=$val"
        }
    }
    
    Set-Content $envPath $envContent
    Write-ColorOutput "Environment config patched." $Green
}

# 3. Compress staging directory
Write-ColorOutput "Compressing staging directory..." $Cyan
Push-Location $StagingDir
tar -czf "..\$ArchiveName" .
Pop-Location

# 4. Upload and Extract
Write-ColorOutput "Uploading and extracting on $RemoteHost..." $Cyan
ssh ${RemoteUser}@${RemoteHost} "mkdir -p $DestDir"
scp $ArchiveName "${RemoteUser}@${RemoteHost}:/tmp/$ArchiveName"
ssh ${RemoteUser}@${RemoteHost} "tar -xzf /tmp/$ArchiveName -C $DestDir && rm /tmp/$ArchiveName"
ssh ${RemoteUser}@${RemoteHost} "cd $DestDir/backend && npm ci --no-fund --no-audit"

# 5. Cleanup
Remove-Item $StagingDir  -Recurse -Force
Remove-Item $ArchiveName -Force

Write-ColorOutput "DEV Deployment to $RemoteHost COMPLETE!" $Green
