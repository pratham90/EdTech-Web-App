@echo off
echo ========================================
echo   Starting EdTech Backend Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing/Updating dependencies...
call npm install

echo.
echo Starting backend server...
echo.
echo Backend will run on: http://localhost:5000
echo CORS is configured to allow localhost origins
echo.
echo Press Ctrl+C to stop the server
echo.

REM Ensure NODE_ENV is set for development
set NODE_ENV=development
node main.js

pause


