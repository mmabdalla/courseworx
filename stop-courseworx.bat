@echo off
echo.
echo ========================================
echo    CourseWorx - Stopping Application
echo ========================================
echo.

echo 🔍 Looking for Node.js processes...

REM Kill all Node.js processes (this will stop both frontend and backend)
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ All Node.js processes stopped successfully
) else (
    echo ℹ️  No Node.js processes were running
)

echo.
echo 🎉 CourseWorx has been stopped
echo.
pause 