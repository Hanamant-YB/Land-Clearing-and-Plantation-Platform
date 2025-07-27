# 🚀 Git Setup Guide for Contractor Platform

## 📋 Initial Git Setup

### Step 1: Initialize Git Repository
```bash
cd contractor-platform
git init
```

### Step 2: Add All Files
```bash
git add .
```

### Step 3: Make Initial Commit
```bash
git commit -m "Initial commit: Contractor Platform with AI/ML features"
```

## 🌐 Remote Repository Setup

### Option 1: GitHub (Recommended)

#### Create GitHub Repository:
1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Name: `contractor-platform`
4. Description: "AI-powered contractor-landowner matching platform"
5. Make it **Public** (for easy sharing) or **Private** (for security)
6. Don't initialize with README (we already have one)

#### Connect to GitHub:
```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/contractor-platform.git
git branch -M main
git push -u origin main
```

### Option 2: GitLab
```bash
git remote add origin https://gitlab.com/YOUR_USERNAME/contractor-platform.git
git branch -M main
git push -u origin main
```

### Option 3: Bitbucket
```bash
git remote add origin https://bitbucket.org/YOUR_USERNAME/contractor-platform.git
git branch -M main
git push -u origin main
```

## 👥 Sharing with Your Friend

### For Your Friend to Clone:
```bash
# Replace with your actual repository URL
git clone https://github.com/YOUR_USERNAME/contractor-platform.git
cd contractor-platform
```

### For Updates:
```bash
# You make changes and push
git add .
git commit -m "Description of changes"
git push

# Your friend pulls updates
git pull origin main
```

## 🔄 Daily Git Workflow

### Making Changes:
```bash
# 1. Check status
git status

# 2. Add changes
git add .

# 3. Commit with descriptive message
git commit -m "Add new feature: AI shortlist improvements"

# 4. Push to remote
git push origin main
```

### Getting Updates:
```bash
# Pull latest changes
git pull origin main
```

## 🌿 Branching Strategy

### Create Feature Branch:
```bash
git checkout -b feature/ai-enhancements
# Make changes
git add .
git commit -m "Enhance AI scoring algorithm"
git push origin feature/ai-enhancements
```

### Merge Feature Branch:
```bash
git checkout main
git merge feature/ai-enhancements
git push origin main
```

## 📝 Commit Message Guidelines

### Good Commit Messages:
```bash
git commit -m "Add AI-powered contractor recommendations"
git commit -m "Fix payment processing bug in Razorpay integration"
git commit -m "Update ML model with new training data"
git commit -m "Improve responsive design for mobile devices"
```

### Bad Commit Messages:
```bash
git commit -m "fix"
git commit -m "update"
git commit -m "changes"
```

## 🔧 Git Configuration

### Set Your Identity:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Set Default Editor:
```bash
# For VS Code
git config --global core.editor "code --wait"

# For Nano
git config --global core.editor "nano"

# For Vim
git config --global core.editor "vim"
```

## 🚨 Important Notes

### Files NOT Tracked by Git:
- `node_modules/` (dependencies)
- `.env` (environment variables)
- `uploads/` (user uploaded files)
- `*.log` (log files)
- `__pycache__/` (Python cache)

### Environment Setup:
Your friend will need to create their own `.env` file:
```bash
# Copy example environment file
cp .env.example .env
# Edit with their own values
nano .env
```

## 📊 Git Commands Cheat Sheet

```bash
# Basic Commands
git status                    # Check repository status
git add .                     # Add all changes
git commit -m "message"       # Commit changes
git push                      # Push to remote
git pull                      # Pull from remote

# Branching
git branch                    # List branches
git checkout -b new-branch    # Create and switch to new branch
git checkout main             # Switch to main branch
git merge branch-name         # Merge branch into current

# History
git log                       # View commit history
git log --oneline            # Compact history
git show commit-hash         # Show specific commit

# Undo Changes
git checkout -- filename      # Undo changes in file
git reset HEAD filename       # Unstage file
git reset --hard HEAD~1      # Undo last commit
```

## 🎯 Quick Start for Your Friend

### First Time Setup:
```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/contractor-platform.git
cd contractor-platform

# 2. Install dependencies
npm install
cd server && npm install
cd ../client && npm install

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Set up environment
cp .env.example .env
# Edit .env with your values

# 5. Start the project
# Windows: Double-click start_project.bat
# Mac/Linux: ./start_project.sh
```

### Regular Updates:
```bash
git pull origin main
```

## 🔐 Security Considerations

### For Public Repositories:
- Never commit `.env` files
- Don't include API keys or secrets
- Use environment variables for sensitive data

### For Private Repositories:
- More secure for sensitive data
- Still follow best practices
- Consider using GitHub Secrets for CI/CD

## 📞 Troubleshooting

### Common Issues:

1. **Permission Denied:**
   ```bash
   # Set correct permissions
   chmod +x start_project.sh
   ```

2. **Merge Conflicts:**
   ```bash
   # Resolve conflicts manually
   git status
   # Edit conflicted files
   git add .
   git commit -m "Resolve merge conflicts"
   ```

3. **Large Files:**
   ```bash
   # Use Git LFS for large files
   git lfs track "*.pkl"
   git add .gitattributes
   ```

---

**Happy Coding with Git! 🚀** 