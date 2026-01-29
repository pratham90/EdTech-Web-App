@echo off
echo ========================================
echo   Restarting EdTech Backend Server
echo ========================================
echo.

cd /d "%~dp0"

echo Stopping any existing backend processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo Starting backend server with updated CORS configuration...
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

