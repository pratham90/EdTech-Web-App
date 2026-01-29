#!/bin/bash

# EdTech Platform Startup Script
# This script starts all services

echo "🚀 Starting EdTech Platform..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Start Python Service
echo "📡 Starting Python AI Service..."
cd python_models
if [ ! -f "unified_service.py" ]; then
    echo "❌ unified_service.py not found!"
    exit 1
fi

python3 unified_service.py &
PYTHON_PID=$!
echo "✅ Python service started (PID: $PYTHON_PID)"
cd ..

# Wait a bit for Python service to start
sleep 3

# Start Backend
echo "🔧 Starting Backend Server..."
cd backend
if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found!"
    kill $PYTHON_PID
    exit 1
fi

npm run dev &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
cd ..

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Frontend..."
cd frontend
if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found!"
    kill $PYTHON_PID $BACKEND_PID
    exit 1
fi

npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📡 Python Service: http://localhost:5001"
echo "🔧 Backend: http://localhost:5000"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping all services...'; kill $PYTHON_PID $BACKEND_PID $FRONTEND_PID; exit" INT

wait

