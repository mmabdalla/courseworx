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
echo 📋 Step 1: Stopping Node.js processes on 3000, 3050, 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3050 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
echo ✅ Processes stopped

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
set FRONTEND_PORT=3050
set BACKEND_PORT=5000
echo.
echo 📱 Frontend will be available at: http://localhost:%FRONTEND_PORT%
echo 🔧 Backend API will be available at: http://localhost:%BACKEND_PORT%
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
