# Troubleshooting

## 🚨 Common Issues and Solutions

This guide helps you resolve common problems when using the Land Clearing and Plantation Platform.

## 🔧 Installation Issues

### **Node.js Installation Problems**

#### **"Node.js is not recognized"**
**Problem**: Node.js not installed or not in PATH
**Solution**:
```bash
# Download and install Node.js from https://nodejs.org/
# Restart your terminal/command prompt
node --version
npm --version
```

#### **"npm install fails"**
**Problem**: Network issues or corrupted cache
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# If still failing, try using a different registry
npm config set registry https://registry.npmjs.org/
```

### **Python Installation Problems**

#### **"Python is not recognized"**
**Problem**: Python not installed or not in PATH
**Solution**:
```bash
# Download and install Python from https://python.org/
# Make sure to check "Add Python to PATH" during installation
python --version
pip --version
```

#### **"pip install fails"**
**Problem**: Package conflicts or network issues
**Solution**:
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install with verbose output
pip install -r requirements.txt -v

# If specific packages fail, install individually
pip install flask scikit-learn pandas numpy joblib
```

### **MongoDB Installation Problems**

#### **"MongoDB service not running"**
**Problem**: MongoDB not started or not installed
**Solution**:

**Windows**:
```bash
# Start MongoDB service
net start MongoDB

# If service doesn't exist, install MongoDB first
# Download from https://mongodb.com/
```

**macOS/Linux**:
```bash
# Start MongoDB service
sudo systemctl start mongod

# Check status
sudo systemctl status mongod

# If not installed
sudo apt-get install mongodb  # Ubuntu/Debian
brew install mongodb-community  # macOS
```

## 🌐 Application Startup Issues

### **Port Already in Use**

#### **"Port 3000 is already in use"**
**Problem**: Another application using the port
**Solution**:
```bash
# Find process using port (Windows)
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <process_id> /F

# Alternative: Use different port
cd client
set PORT=3001 && npm start
```

#### **"Port 5000 is already in use"**
**Problem**: Backend server port conflict
**Solution**:
```bash
# Find and kill process
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Or change port in .env file
PORT=5001
```

### **Database Connection Issues**

#### **"MongoDB connection failed"**
**Problem**: Database not accessible
**Solution**:
```bash
# Check MongoDB is running
mongo --eval "db.runCommand('ping')"

# Verify connection string in .env
MONGO_URI=mongodb://localhost:27017/contractor-platform

# Test connection
mongo "mongodb://localhost:27017/contractor-platform"
```

#### **"Authentication failed"**
**Problem**: Wrong credentials or database permissions
**Solution**:
```bash
# Check if database exists
mongo --eval "use contractor-platform; db.stats()"

# Create database if it doesn't exist
mongo --eval "use contractor-platform; db.createCollection('users')"
```

## 🔐 Authentication Issues

### **Login Problems**

#### **"Invalid credentials"**
**Problem**: Wrong email/password
**Solution**:
- Verify email address is correct
- Check password (case-sensitive)
- Try password reset if forgotten
- Ensure account is not suspended

#### **"Account not found"**
**Problem**: Email not registered
**Solution**:
- Register new account at /register
- Check for typos in email address
- Verify email verification is complete

### **Registration Issues**

#### **"Email already exists"**
**Problem**: Account already registered
**Solution**:
- Try logging in instead
- Use password reset if forgotten
- Contact admin if account is locked

#### **"Password too weak"**
**Problem**: Password doesn't meet requirements
**Solution**:
- Use at least 8 characters
- Include uppercase and lowercase letters
- Add numbers and special characters
- Avoid common passwords

## 🤖 AI System Issues

### **AI Scoring Problems**

#### **"AI scores showing 0%"**
**Problem**: ML API not responding or scoring error
**Solution**:
```bash
# Check ML API is running
curl http://localhost:5001/health

# Restart ML API
python ml_api.py

# Check ML API logs for errors
```

#### **"AI shortlist not generating"**
**Problem**: No contractors available or scoring failed
**Solution**:
- Ensure contractors are registered
- Check contractor profiles are complete
- Verify ML API is accessible
- Check server logs for errors

### **ML API Issues**

#### **"ML API connection failed"**
**Problem**: Python service not running
**Solution**:
```bash
# Start ML API
python ml_api.py

# Check if port 5001 is available
netstat -ano | findstr :5001

# Verify requirements are installed
pip list | grep -E "(flask|scikit-learn|pandas)"
```

## 💳 Payment Issues

### **Razorpay Integration**

#### **"Payment gateway error"**
**Problem**: Razorpay configuration issue
**Solution**:
- Verify Razorpay keys in .env file
- Check keys are for correct environment (test/live)
- Ensure account is active and verified
- Test with small amounts first

#### **"Payment not processing"**
**Problem**: Network or configuration issue
**Solution**:
- Check internet connection
- Verify Razorpay service status
- Clear browser cache and cookies
- Try different payment method

## 📧 Email Issues

### **Email Notifications**

#### **"Emails not sending"**
**Problem**: SMTP configuration issue
**Solution**:
- Verify Gmail credentials in .env
- Use app password, not regular password
- Check Gmail security settings
- Test SMTP connection

#### **"OTP not received"**
**Problem**: Email delivery issue
**Solution**:
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes for delivery
- Try resending OTP

## 🖼️ File Upload Issues

### **Image Upload Problems**

#### **"Image upload failed"**
**Problem**: File size or format issue
**Solution**:
- Use images under 5MB
- Supported formats: JPG, PNG, GIF
- Check file is not corrupted
- Try different image

#### **"Upload directory error"**
**Problem**: Server storage issue
**Solution**:
```bash
# Check uploads directory exists
ls -la server/uploads/

# Create directory if missing
mkdir -p server/uploads

# Set proper permissions
chmod 755 server/uploads
```

## 🔄 Data Issues

### **Database Problems**

#### **"Data not loading"**
**Problem**: Database connection or query issue
**Solution**:
```bash
# Check database connection
mongo --eval "use contractor-platform; db.stats()"

# Verify collections exist
mongo --eval "use contractor-platform; show collections"

# Import sample data if needed
mongoimport --db contractor-platform --collection jobs --file jobs.json
mongoimport --db contractor-platform --collection users --file users.json
```

#### **"Data corruption"**
**Problem**: Database integrity issue
**Solution**:
```bash
# Backup current data
mongodump --db contractor-platform

# Repair database
mongo --eval "use contractor-platform; db.repairDatabase()"

# Restore from backup if needed
mongorestore --db contractor-platform dump/contractor-platform/
```

## 🌐 Network Issues

### **Local Network Access**

#### **"Can't access from other devices"**
**Problem**: Server not configured for network access
**Solution**:
```bash
# Check server is listening on 0.0.0.0
netstat -ano | findstr :5000

# Verify firewall settings
# Allow Node.js and Python through firewall

# Get your IP address
ipconfig  # Windows
ifconfig  # macOS/Linux
```

#### **"CORS errors"**
**Problem**: Cross-origin request blocked
**Solution**:
- Check CORS configuration in server
- Verify frontend URL is allowed
- Clear browser cache
- Check browser console for errors

## 📱 Browser Issues

### **Frontend Problems**

#### **"Page not loading"**
**Problem**: React app not starting
**Solution**:
```bash
# Check if React app is running
curl http://localhost:3000

# Restart React app
cd client
npm start

# Clear browser cache
# Try different browser
```

#### **"JavaScript errors"**
**Problem**: Code or dependency issue
**Solution**:
- Check browser console for errors
- Clear browser cache and cookies
- Update browser to latest version
- Try incognito/private mode

## 🔍 Debugging Tools

### **Server Logs**
```bash
# Check server logs
cd server
npm start

# Check ML API logs
python ml_api.py

# Check React app logs
cd client
npm start
```

### **Database Debugging**
```bash
# Connect to MongoDB
mongo contractor-platform

# Check collections
show collections

# Query data
db.users.find().limit(5)
db.jobs.find().limit(5)
```

### **Network Debugging**
```bash
# Test API endpoints
curl http://localhost:5000/api/health
curl http://localhost:5001/health

# Check ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5001
```

## 📞 Getting Help

### **Before Contacting Support**
1. **Check this troubleshooting guide**
2. **Review error messages carefully**
3. **Try basic solutions first**
4. **Gather relevant information**

### **Information to Provide**
- **Error message**: Exact text of error
- **Steps to reproduce**: What you were doing
- **Environment**: OS, browser, Node.js version
- **Screenshots**: Visual evidence of issue
- **Logs**: Console or server logs

### **Contact Methods**
- **GitHub Issues**: Create issue in repository
- **Email Support**: Contact platform administrator
- **Documentation**: Check wiki pages for solutions

## 🛠️ Maintenance

### **Regular Maintenance**
```bash
# Update dependencies
npm update
pip install --upgrade -r requirements.txt

# Clear caches
npm cache clean --force
pip cache purge

# Backup database
mongodump --db contractor-platform --out backup/

# Check disk space
df -h  # Linux/macOS
dir     # Windows
```

### **Performance Optimization**
- Monitor server resources
- Optimize database queries
- Update dependencies regularly
- Clean up old files and logs

---

**Still having issues?** Contact support with detailed information about your problem. 