# ⚡ Quick Start Guide

## 🎯 Fastest Way to Run

### 1. Install Everything (One Time)
```bash
# Backend
cd Edtech/backend && npm install && cd ../..

# Frontend  
cd Edtech/frontend && npm install && cd ../..

# Python
cd Edtech/python_models && pip install -r requirements.txt && python -m spacy download en_core_web_sm && cd ../..
```

### 2. Create .env Files

**Backend** (`Edtech/backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edtech
FRONTEND_URL=http://localhost:3000
PYTHON_SERVICE_URL=http://localhost:5001
JWT_SECRET=change_this_secret_key
```

**Python** (`Edtech/python_models/.env`):
```env
OPENAI_API_KEY=sk-your-key-here
MONGO_URI=mongodb://localhost:27017/edtech_ai
```

**Frontend** (`Edtech/frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start MongoDB
```bash
# Start MongoDB (if local)
mongod
```

### 4. Run All Services

**Open 3 Terminal Windows:**

**Terminal 1:**
```bash
cd Edtech/python_models
python unified_service.py
```

**Terminal 2:**
```bash
cd Edtech/backend
npm run dev
```

**Terminal 3:**
```bash
cd Edtech/frontend
npm run dev
```

### 5. Open Browser
Go to: **http://localhost:3000**

## ✅ Verify It's Working

1. **Python Service:** http://localhost:5001/api/health
2. **Backend:** http://localhost:5000/api/health  
3. **Frontend:** http://localhost:3000

All should return success messages!

## 🧪 Quick Test

1. Open http://localhost:3000
2. Sign up as Student
3. Go to "Study" → "Question Generator"
4. Enter topic: "Operating Systems"
5. Click "Generate Questions"
6. See AI-generated questions!

## 🐛 Common Issues

**Port already in use?**
- Change ports in `.env` files
- Or kill process: `lsof -ti:5001 | xargs kill` (Mac/Linux)

**Module not found?**
- Run `npm install` or `pip install -r requirements.txt` again

**MongoDB error?**
- Start MongoDB: `mongod`
- Or use MongoDB Atlas (cloud)

**OpenAI error?**
- Check API key in `python_models/.env`
- Verify you have credits

---

That's it! 🎉

