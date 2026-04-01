@echo off
echo.
echo ========================================
echo    CourseWorx - Starting Application
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

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing root dependencies...
    npm install
)

if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

echo.

REM Check for port conflicts
echo 🔍 Checking for port conflicts...

netstat -an | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 5000 is already in use
    echo    This might be another CourseWorx instance or different application
    set /p choice="Do you want to continue anyway? (y/N): "
    if /i not "%choice%"=="y" (
        echo Stopping startup process...
        pause
        exit /b 1
    )
)

netstat -an | findstr ":3050" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 3050 is already in use
    echo    This might be another CourseWorx instance or different application
    set /p choice="Do you want to continue anyway? (y/N): "
    if /i not "%choice%"=="y" (
        echo Stopping startup process...
        pause
        exit /b 1
    )
)

echo ✅ Port check completed
echo.

echo 🚀 Starting CourseWorx...
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