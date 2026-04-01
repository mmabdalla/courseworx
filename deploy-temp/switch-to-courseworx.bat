@echo off
echo Switching to CourseWorx database...

echo # Server Configuration > backend\.env
echo PORT=5000 >> backend\.env
echo NODE_ENV=development >> backend\.env
echo. >> backend\.env
echo # Database Configuration >> backend\.env
echo DB_HOST=localhost >> backend\.env
echo DB_PORT=5432 >> backend\.env
echo DB_NAME=courseworx >> backend\.env
echo DB_USER=mabdalla >> backend\.env
echo DB_PASSWORD=7ouDa-123q >> backend\.env
echo. >> backend\.env
echo # JWT Configuration >> backend\.env
echo JWT_SECRET=your_jwt_secret_key_here >> backend\.env
echo JWT_EXPIRES_IN=7d >> backend\.env
echo. >> backend\.env
echo # File Upload Configuration >> backend\.env
echo UPLOAD_PATH=./uploads >> backend\.env
echo MAX_FILE_SIZE=10485760 >> backend\.env
echo. >> backend\.env
echo # CORS Configuration >> backend\.env
echo CORS_ORIGIN=http://localhost:3050 >> backend\.env

echo ✅ Environment file created with CourseWorx database
echo Now restart your server to use the CourseWorx database
pause
