@echo off
REM EdTech Platform Startup Script for Windows
REM This script starts all services

echo 🚀 Starting EdTech Platform...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18 or higher.
    exit /b 1
)

REM Start Python Service
echo 📡 Starting Python AI Service...
cd python_models
if not exist "unified_service.py" (
    echo ❌ unified_service.py not found!
    exit /b 1
)
start "Python Service" cmd /k "python unified_service.py"
cd ..

REM Wait a bit for Python service to start
timeout /t 3 /nobreak >nul

REM Start Backend
echo 🔧 Starting Backend Server...
cd backend
if not exist "package.json" (
    echo ❌ Backend package.json not found!
    exit /b 1
)
start "Backend Server" cmd /k "npm run dev"
cd ..

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo 🎨 Starting Frontend...
cd frontend
if not exist "package.json" (
    echo ❌ Frontend package.json not found!
    exit /b 1
)
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ✅ All services started successfully!
echo.
echo 📡 Python Service: http://localhost:5001
echo 🔧 Backend: http://localhost:5000
echo 🎨 Frontend: http://localhost:3000
echo.
echo Close the command windows to stop the services.

pause

