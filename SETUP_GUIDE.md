# 🚀 Complete Setup & Run Guide

Follow these steps to run and test your EdTech platform.

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Node.js (v18 or higher) - [Download](https://nodejs.org/)
- ✅ Python (v3.8 or higher) - [Download](https://www.python.org/)
- ✅ MongoDB (local or cloud) - [Download](https://www.mongodb.com/try/download/community)
- ✅ OpenAI API Key - [Get it here](https://platform.openai.com/api-keys)

## 🔧 Step 1: Install Dependencies

### 1.1 Install Backend Dependencies
```bash
cd Edtech/backend
npm install
```

### 1.2 Install Frontend Dependencies
```bash
cd Edtech/frontend
npm install
```

### 1.3 Install Python Dependencies
```bash
cd Edtech/python_models
pip install -r requirements.txt
```

**Important:** Install spaCy model:
```bash
python -m spacy download en_core_web_sm
```

## 🔐 Step 2: Configure Environment Variables

### 2.1 Backend Configuration
Create `Edtech/backend/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edtech
FRONTEND_URL=http://localhost:3000
PYTHON_SERVICE_URL=http://localhost:5001
JWT_SECRET=your_super_secret_jwt_key_here_change_this
```

### 2.2 Python Service Configuration
Create `Edtech/python_models/.env` file:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
MONGO_URI=mongodb://localhost:27017/edtech_ai
PYTHON_SERVICE_PORT=5001
```

### 2.3 Frontend Configuration
Create `Edtech/frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🗄️ Step 3: Start MongoDB

### Option A: Local MongoDB
```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
# or
mongod
```

### Option B: MongoDB Atlas (Cloud)
- Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get connection string
- Update `MONGO_URI` in Python `.env` and `MONGODB_URI` in backend `.env`

## 🚀 Step 4: Run All Services

You need to run **3 services** in **3 separate terminal windows**.

### Terminal 1: Python AI Service
```bash
cd Edtech/python_models
python unified_service.py
```

**Expected Output:**
```
🚀 Starting Unified EdTech AI Service...
✅ All models integrated and ready!
📡 Service running on http://localhost:5001
```

### Terminal 2: Backend Server
```bash
cd Edtech/backend
npm run dev
```

**Expected Output:**
```
🚀 Backend server is running on http://localhost:5000
📡 Python service URL: http://localhost:5001
DB is connected
```

### Terminal 3: Frontend Development Server
```bash
cd Edtech/frontend
npm run dev
```

**Expected Output:**
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## ✅ Step 5: Verify Services Are Running

1. **Python Service:** Open http://localhost:5001/api/health
   - Should show: `{"status": "healthy", ...}`

2. **Backend:** Open http://localhost:5000/api/health
   - Should show: `{"status": "ok", "service": "EdTech Backend"}`

3. **Frontend:** Open http://localhost:3000
   - Should show the login page

## 🧪 Step 6: Test the Application

### 6.1 Create an Account
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Enter:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Select Role: `Student` or `Teacher`
4. Click "Create Account"

### 6.2 Test Student Features

**Parse Syllabus:**
1. Go to "Study" tab
2. Click "Question Generator"
3. Choose input method (Text/Upload/Voice)
4. Enter topic or upload a PDF file
5. Click "Parse Syllabus First" (if uploaded)
6. Click "Generate Questions"

**Mock Interview:**
1. Go to "Interview Prep" tab
2. Select interview type (Technical/HR/Domain-specific)
3. Answer questions
4. View AI feedback

**Progress Tracking:**
1. Go to "Progress" tab
2. View your test history
3. Check recommendations
4. Download progress report

### 6.3 Test Teacher Features

**Generate Question Paper:**
1. Login as Teacher
2. Go to "Paper Creator" tab
3. Enter subject: `Database Management Systems`
4. Select exam type: `Midterm`
5. Set number of questions: `8`
6. Click "Generate Paper"
7. Download PDF

**View Analytics:**
1. Go to "Analytics" tab
2. View class average
3. See top students
4. Check weak topics

## 🐛 Troubleshooting

### Issue: Python service won't start
**Solution:**
- Check if port 5001 is available: `netstat -an | findstr 5001` (Windows) or `lsof -i :5001` (Mac/Linux)
- Verify OPENAI_API_KEY is set correctly
- Check Python dependencies: `pip list`

### Issue: Backend won't connect to Python service
**Solution:**
- Verify Python service is running on port 5001
- Check `PYTHON_SERVICE_URL` in backend `.env`
- Test Python service: `curl http://localhost:5001/api/health`

### Issue: Frontend can't connect to backend
**Solution:**
- Check `VITE_API_URL` in frontend `.env`
- Verify backend is running on port 5000
- Check browser console for CORS errors

### Issue: MongoDB connection failed
**Solution:**
- Verify MongoDB is running: `mongosh` or `mongo`
- Check connection string in `.env` files
- For Atlas: Ensure IP is whitelisted

### Issue: File upload not working
**Solution:**
- Check file size (max 50MB)
- Verify file type is supported (PDF, TXT, MP3, WAV, M4A)
- Check backend `uploads/` folder exists

### Issue: OpenAI API errors
**Solution:**
- Verify API key is valid
- Check API quota/credits
- Ensure key has proper permissions

## 📝 Quick Test Checklist

- [ ] All 3 services running without errors
- [ ] Can create account (Student/Teacher)
- [ ] Can login
- [ ] Can parse syllabus (text/file)
- [ ] Can generate questions
- [ ] Can start mock interview
- [ ] Can view progress (student)
- [ ] Can generate paper (teacher)
- [ ] Can view analytics (teacher)

## 🎯 Quick Start Scripts

### Windows (PowerShell)
```powershell
# Run all services
cd Edtech
.\start.bat
```

### Linux/Mac
```bash
# Make script executable
chmod +x Edtech/start.sh

# Run all services
cd Edtech
./start.sh
```

## 📞 Need Help?

If you encounter issues:
1. Check all terminal outputs for error messages
2. Verify all `.env` files are configured correctly
3. Ensure all dependencies are installed
4. Check that ports 5000, 5001, and 3000 are not in use

## 🎉 Success!

Once all services are running, you should see:
- ✅ Python service on port 5001
- ✅ Backend on port 5000
- ✅ Frontend on port 3000

Open http://localhost:3000 and start testing!

