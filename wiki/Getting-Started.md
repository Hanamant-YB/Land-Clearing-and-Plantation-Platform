# Getting Started

## 📋 Prerequisites

Before setting up the Land Clearing and Plantation Platform, ensure you have the following installed:

### **Required Software**
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **MongoDB** (v4.4 or higher) - [Download here](https://mongodb.com/)
- **Git** - [Download here](https://git-scm.com/)

### **Optional but Recommended**
- **Visual Studio Code** - For code editing
- **Postman** - For API testing
- **MongoDB Compass** - For database management

## 🚀 Installation Steps

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/Hanamant-YB/Land-Clearing-and-Plantation-Platform.git
cd Land-Clearing-and-Plantation-Platform
```

### **Step 2: Install Dependencies**

#### **Install Python Dependencies**
```bash
pip install -r requirements.txt
```

#### **Install Node.js Dependencies**
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### **Step 3: Environment Configuration**

#### **Create Environment File**
```bash
# Copy the example environment file
cp env.example .env
```

#### **Configure Environment Variables**
Edit the `.env` file with your configuration:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/contractor-platform

# JWT Secret (Change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=your-razorpay-key-id

# Server Configuration
PORT=5000
NODE_ENV=development

# ML API Configuration
ML_API_URL=http://localhost:5001

# Optional: Cloudinary for image uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### **Step 4: Start MongoDB**

#### **Windows**
```bash
# Start MongoDB service
net start MongoDB
```

#### **macOS/Linux**
```bash
# Start MongoDB service
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### **Step 5: Start the Application**

#### **Option A: Using Scripts (Recommended)**

**Windows:**
```bash
.\start_project.bat
```

**macOS/Linux:**
```bash
chmod +x start_project.sh
./start_project.sh
```

#### **Option B: Manual Start**

**Terminal 1 - ML API:**
```bash
python ml_api.py
```

**Terminal 2 - Backend Server:**
```bash
cd server
npm start
```

**Terminal 3 - Frontend Client:**
```bash
cd client
npm start
```

## 🌐 Access the Application

Once all services are running, you can access:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML API**: http://localhost:5001

## 👤 Initial Setup

### **Create Admin Account**
1. Register a new account at http://localhost:3000/register
2. Choose "Admin" role during registration
3. Login and access the admin dashboard

### **Add Sample Data (Optional)**
```bash
# Import sample jobs
mongoimport --db contractor-platform --collection jobs --file jobs.json

# Import sample users
mongoimport --db contractor-platform --collection users --file users.json
```

## 🔧 Configuration Options

### **Database Configuration**
- **Local MongoDB**: Use `mongodb://localhost:27017/contractor-platform`
- **MongoDB Atlas**: Use your Atlas connection string
- **Custom Database**: Update `MONGO_URI` in `.env`

### **Email Configuration**
- **Gmail**: Use app password (not regular password)
- **Other Providers**: Update SMTP settings in server configuration

### **Payment Gateway**
- **Razorpay**: Get test keys from Razorpay dashboard
- **Production**: Replace test keys with live keys

## 🚨 Troubleshooting

### **Common Issues**

#### **Port Already in Use**
```bash
# Find process using port
netstat -ano | findstr :3000
# Kill process
taskkill /PID <process_id> /F
```

#### **MongoDB Connection Error**
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify database permissions

#### **Python Dependencies Error**
```bash
# Upgrade pip
python -m pip install --upgrade pip
# Install with verbose output
pip install -r requirements.txt -v
```

#### **Node.js Dependencies Error**
```bash
# Clear npm cache
npm cache clean --force
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](Troubleshooting) guide
2. Review error logs in terminal output
3. Verify all prerequisites are installed
4. Ensure environment variables are correctly set

## 🎯 Next Steps

After successful installation:

1. **[User Manuals](User-Manuals)** - Learn how to use the platform
2. **[AI Features](AI-Features)** - Understand the intelligent matching system
3. **[API Documentation](API-Documentation)** - Explore technical details

---

**Ready to start?** Visit http://localhost:3000 and create your first account! 