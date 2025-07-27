#!/bin/bash

echo "🚀 Starting Contractor Platform..."
echo

echo "📦 Starting ML API (Python)..."
python ml_api.py &
ML_PID=$!

echo "⏳ Waiting 3 seconds..."
sleep 3

echo "🔧 Starting Backend Server (Node.js)..."
cd server && npm start &
BACKEND_PID=$!

echo "⏳ Waiting 3 seconds..."
sleep 3

echo "🌐 Starting Frontend (React)..."
cd ../client && npm start &
FRONTEND_PID=$!

echo
echo "✅ All services are starting..."
echo
echo "📱 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   ML API:   http://localhost:5001"
echo
echo "🌐 For network access, use your IP address instead of localhost"
echo
echo "Press Ctrl+C to stop all services"
echo

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping all services..."
    kill $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handler
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait 