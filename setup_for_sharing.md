# 🚀 Contractor Platform - Setup Guide for Sharing

## 📋 Prerequisites

### Required Software
- **Node.js** (v14 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (v4.4 or higher)
- **Git** (for cloning)

### Required Python Packages
```bash
pip install flask pandas scikit-learn joblib pymongo
```

### Required Node.js Packages
```bash
npm install
cd server && npm install
cd ../client && npm install
```

## 🔧 Setup Instructions

### Step 1: Clone/Download the Project
```bash
# Option A: Using Git (Recommended)
git clone https://github.com/YOUR_USERNAME/contractor-platform.git
cd contractor-platform

# Option B: Download ZIP from GitHub
# 1. Go to your GitHub repository
# 2. Click "Code" → "Download ZIP"
# 3. Extract the ZIP file
# 4. Rename folder to "contractor-platform"
```

### Step 2: Environment Setup

#### Create `.env` file in the root directory:
```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your values
nano .env  # or use any text editor
```

**Required Environment Variables:**
```env
# Database
MONGO_URI=mongodb://localhost:27017/contractor-platform

# JWT Secret (Change this!)
JWT_SECRET=your-super-secret-jwt-key-here

# Email Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Frontend API URL
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=your-razorpay-key
```

### Step 3: Database Setup
```bash
# Start MongoDB
mongod

# Or if using MongoDB as a service
sudo systemctl start mongod
```

### Step 4: Start the Services

#### Terminal 1: Start the ML API (Python)
```bash
cd contractor-platform
python ml_api.py
```
**Expected Output:** `Running on http://0.0.0.0:5001`

#### Terminal 2: Start the Backend Server (Node.js)
```bash
cd contractor-platform/server
npm start
```
**Expected Output:** `Server running on port 5000 and accessible from network`

#### Terminal 3: Start the Frontend (React)
```bash
cd contractor-platform/client
npm start
```
**Expected Output:** `Local: http://localhost:3000`

## 🌐 Network Access Setup

### For Local Network Access:

1. **Find Your IP Address:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **Update Frontend Environment:**
   Create `.env` file in `client/` directory:
   ```env
   REACT_APP_API_URL=http://YOUR_IP_ADDRESS:5000/api
   ```

3. **Access URLs:**
   - **Frontend:** `http://YOUR_IP_ADDRESS:3000`
   - **Backend API:** `http://YOUR_IP_ADDRESS:5000`
   - **ML API:** `http://YOUR_IP_ADDRESS:5001`

### For Internet Access (Advanced):

#### Option A: Using ngrok (Temporary)
```bash
# Install ngrok
npm install -g ngrok

# Expose your services
ngrok http 3000  # Frontend
ngrok http 5000  # Backend
ngrok http 5001  # ML API
```

#### Option B: Using Cloud Deployment
- Deploy to Heroku, Vercel, or AWS
- Update environment variables accordingly

## 🔐 Default Admin Account

After first run, create an admin account:
```javascript
// In MongoDB shell or Compass
db.users.insertOne({
  name: "Admin User",
  email: "admin@gmail.com",
  password: "$2a$10$hashedpassword", // Use bcrypt to hash
  role: "admin"
})
```

## 📱 Test Accounts

### Landowner Account:
- Email: `landowner@gmail.com`
- Password: `Landowner123!`

### Contractor Account:
- Email: `contractor@gmail.com`
- Password: `Contractor123!`

## 🚨 Troubleshooting

### Common Issues:

1. **Port Already in Use:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:5000 | xargs kill -9
   ```

2. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file
   - Verify database permissions

3. **CORS Errors:**
   - Check if all services are running
   - Verify API URLs in frontend .env

4. **ML API Not Responding:**
   - Ensure Python dependencies are installed
   - Check if model file exists: `contractor_shortlist_model.pkl`

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all services are running on correct ports
3. Ensure all environment variables are set correctly
4. Check network connectivity and firewall settings

## 🎯 Quick Start Commands

```bash
# One-command setup (after prerequisites)
cd contractor-platform
python ml_api.py & cd server && npm start & cd ../client && npm start
```

## 📊 Project Structure

```
contractor-platform/
├── client/                 # React Frontend
├── server/                 # Node.js Backend
├── ml_api.py              # Python ML API
├── contractor_shortlist_model.pkl  # Trained ML Model
├── ml_training_data.csv   # Training Dataset
└── setup_for_sharing.md   # This file
```

## 🎉 Success Indicators

✅ All services running without errors
✅ Frontend accessible at http://localhost:3000
✅ Backend API responding at http://localhost:5000
✅ ML API responding at http://localhost:5001
✅ Database connected and accessible
✅ Can register/login users
✅ AI shortlist feature working
✅ File uploads working
✅ Payment system functional

---

**Happy Coding! 🚀** 