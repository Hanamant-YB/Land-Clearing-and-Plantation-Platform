# 🏗️ Contractor Platform

A comprehensive contractor-landowner matching platform with AI-powered recommendations.

## 🚀 Quick Start

### Option 1: One-Click Start (Windows)
```bash
# Double-click this file:
start_project.bat
```

### Option 2: One-Click Start (Mac/Linux)
```bash
# Make executable and run:
chmod +x start_project.sh
./start_project.sh
```

### Option 3: Manual Start
```bash
# Terminal 1: ML API
python ml_api.py

# Terminal 2: Backend
cd server && npm start

# Terminal 3: Frontend
cd client && npm start
```

## 📱 Access URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **ML API:** http://localhost:5001

## 🌐 Network Access

To access from another device on the same network:

1. Find your IP address:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Use your IP instead of localhost:
   - Frontend: `http://YOUR_IP:3000`
   - Backend: `http://YOUR_IP:5000`
   - ML API: `http://YOUR_IP:5001`

## 📋 Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- MongoDB (v4.4+)

## 🔧 Setup

See `setup_for_sharing.md` for detailed setup instructions.

## 🎯 Features

- ✅ AI-powered contractor recommendations
- ✅ Real-time notifications
- ✅ Payment processing
- ✅ File uploads
- ✅ Progress tracking
- ✅ Admin dashboard
- ✅ Mobile responsive

## 📞 Support

If you encounter issues, check the console logs and refer to `setup_for_sharing.md` for troubleshooting.

---

**Happy Coding! 🚀**
