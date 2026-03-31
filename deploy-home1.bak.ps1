# CourseWorx Remote Deployment Script - home1
# Target Host : 10.0.0.10
# Destination : /opt/courseworx

# ---- Configuration ----
$RemoteUser = "root"
$RemoteHost = "10.0.0.10"
$DestDir = "/opt/courseworx"
$DbHost = "localhost"
$DbPort = "5432"
$DbName = "courseworx"
$DbUser = "courseworx"
$DbPassword = "7ouDa-123q"
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
Write-ColorOutput "  CourseWorx Remote Deployment to $RemoteHost" $Cyan
Write-ColorOutput "==================================================" $Cyan

# ------------------------------------------------------------------
# 1. Prepare local staging directory
# ------------------------------------------------------------------
$StagingDir = "deploy-temp"
$ArchiveName = "deploy-archive.tar.gz"

if (Test-Path $StagingDir) { Remove-Item $StagingDir  -Recurse -Force }
if (Test-Path $ArchiveName) { Remove-Item $ArchiveName -Force }

New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null
Write-ColorOutput "Copying project files to staging..." $Cyan

$excludePatterns = @(
    "node_modules",
    "backend\uploads",
    "frontend\build",
    ".git",
    "test",
    "screenrecordings",
    "deploy-temp",
    "deploy-archive.tar.gz"
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
Write-ColorOutput "Files staged." $Green

# ------------------------------------------------------------------
# 2. Patch environment config in staging copy
# ------------------------------------------------------------------
$envPath = Join-Path $StagingDir "backend\.env"
if (Test-Path $envPath) {
    Write-ColorOutput "Patching remote environment configuration (.env)..." $Cyan
    $envContent = Get-Content $envPath -Raw
    
    $keysToUpdate = @{
        "DB_NAME" = $DbName
        "DB_HOST" = $DbHost
        "DB_PORT" = $DbPort
        "DB_USER" = $DbUser
        "DB_PASSWORD" = $DbPassword
        "NODE_ENV" = "production"
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
else {
    Write-ColorOutput "WARNING: .env not found at $envPath - ensure pm2 ecosystem handles credentials." $Yellow
}

# ------------------------------------------------------------------
# 3. Compress staging directory
# ------------------------------------------------------------------
Write-ColorOutput "Compressing staging directory..." $Cyan
Push-Location $StagingDir
try {
    tar -czf "..\$ArchiveName" .
    if ($LASTEXITCODE -ne 0) { throw "tar failed (exit $LASTEXITCODE)" }
}
catch {
    Write-ColorOutput "ERROR: $_" $Red
    Pop-Location
    exit 1
}
Pop-Location
Write-ColorOutput "Archive created: $ArchiveName" $Green

# ------------------------------------------------------------------
# 4. Upload archive to remote host
# ------------------------------------------------------------------
Write-ColorOutput "Creating remote directory $DestDir ..." $Cyan
ssh ${RemoteUser}@${RemoteHost} "mkdir -p $DestDir"
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput "ERROR: SSH connection to $RemoteHost failed." $Red
    exit 1
}

Write-ColorOutput "Uploading archive via SCP..." $Cyan
scp $ArchiveName "${RemoteUser}@${RemoteHost}:/tmp/$ArchiveName"
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput "ERROR: SCP upload failed." $Red
    exit 1
}

# ------------------------------------------------------------------
# 5. Extract and install on remote
# ------------------------------------------------------------------
Write-ColorOutput "Extracting archive on remote..." $Cyan
ssh ${RemoteUser}@${RemoteHost} "tar -xzf /tmp/$ArchiveName -C $DestDir && rm /tmp/$ArchiveName"
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput "ERROR: Extraction failed on remote host." $Red
    exit 1
}

Write-ColorOutput "Installing backend dependencies..." $Cyan
ssh ${RemoteUser}@${RemoteHost} "cd $DestDir/backend && npm ci --omit=dev --no-fund --no-audit"

Write-ColorOutput "Installing frontend dependencies..." $Cyan
ssh ${RemoteUser}@${RemoteHost} "cd $DestDir/frontend && npm ci --legacy-peer-deps --no-fund --no-audit"

# ------------------------------------------------------------------
# 6. Cleanup local temp files
# ------------------------------------------------------------------
Write-ColorOutput "Cleaning up local staging files..." $Yellow
Remove-Item $StagingDir  -Recurse -Force
Remove-Item $ArchiveName -Force

Write-ColorOutput "" $Green
Write-ColorOutput "==================================================" $Green
Write-ColorOutput "  Deployment to $RemoteHost COMPLETE!" $Green
Write-ColorOutput "  App directory : $DestDir" $Green
Write-ColorOutput "  DB user       : $DbUser @ $DbName" $Green
Write-ColorOutput "==================================================" $Green
Write-ColorOutput "NOTE: Start the app on the server (e.g. pm2 restart courseworx)." $Yellow
