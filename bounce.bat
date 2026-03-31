@echo off
echo.
echo ========================================
echo    CourseWorx - Bounce (Restart)
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo 🔄 Bouncing CourseWorx servers...
echo.

REM Step 1: Kill all Node.js processes
echo 📋 Step 1: Stopping all Node.js processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Found Node.js processes. Stopping them...
    taskkill /F /IM node.exe >nul 2>&1
    echo ✅ All Node.js processes stopped
) else (
    echo ℹ️  No Node.js processes found
)

REM Step 2: Wait a moment for ports to clear
echo.
echo 📋 Step 2: Waiting for ports to clear...
timeout /t 3 /nobreak >nul
echo ✅ Port clearing wait completed

REM Step 3: Check if ports are now free
echo.
echo 📋 Step 3: Checking port availability...
netstat -an | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 5000 is still in use
    echo    Attempting to force clear...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

netstat -an | findstr ":3050" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 3050 is still in use
    echo    Attempting to force clear...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3050"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo ✅ Port check completed
echo.

REM Step 4: Start the servers
echo 📋 Step 4: Starting CourseWorx servers...
echo.
echo 📱 Frontend will be available at: http://localhost:3050
echo 🔧 Backend API will be available at: http://localhost:5000
echo.
echo 💡 To stop the application, press Ctrl+C
echo.

REM Start both frontend and backend
npm run start
if %errorlevel% neq 0 (
    echo ❌ Error starting CourseWorx
    echo Please check the error messages above and try again
    pause
    exit /b 1
)

pause
