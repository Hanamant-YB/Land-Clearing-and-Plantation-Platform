@echo off
echo 🚀 Starting Contractor Platform...
echo.

echo 📦 Starting ML API (Python)...
start "ML API" cmd /k "python ml_api.py"

echo ⏳ Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo 🔧 Starting Backend Server (Node.js)...
start "Backend Server" cmd /k "cd server && npm start"

echo ⏳ Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo 🌐 Starting Frontend (React)...
start "Frontend" cmd /k "cd client && npm start"

echo.
echo ✅ All services are starting...
echo.
echo 📱 Access URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    ML API:   http://localhost:5001
echo.
echo 🌐 For network access, use your IP address instead of localhost
echo.
pause 