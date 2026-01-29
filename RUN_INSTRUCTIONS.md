# 🚀 How to Run Your EdTech Platform

## Quick Summary

Your frontend runs on **port 3000**, backend on **port 5000**, and Python service on **port 5001**.

## 📝 Step-by-Step Instructions

### 1. Create Environment Files

**Backend** (`Edtech/backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edtech
FRONTEND_URL=http://localhost:3000
PYTHON_SERVICE_URL=http://localhost:5001
JWT_SECRET=your_secret_key_here
```

**Python** (`Edtech/python_models/.env`):
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
MONGO_URI=mongodb://localhost:27017/edtech_ai
PYTHON_SERVICE_PORT=5001
```

**Frontend** (`Edtech/frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Install Dependencies (One Time)

```bash
# Backend
cd Edtech/backend
npm install

# Frontend
cd ../frontend
npm install

# Python
cd ../python_models
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 3. Start MongoDB

Make sure MongoDB is running (local or cloud).

### 4. Run All 3 Services

**Open 3 separate terminal windows:**

**Terminal 1 - Python Service:**
```bash
cd Edtech/python_models
python unified_service.py
```
✅ Should see: `📡 Service running on http://localhost:5001`

**Terminal 2 - Backend:**
```bash
cd Edtech/backend
npm run dev
```
✅ Should see: `🚀 Backend server is running on http://localhost:5000`

**Terminal 3 - Frontend:**
```bash
cd Edtech/frontend
npm run dev
```
✅ Should see: `Local: http://localhost:3000/`

### 5. Open Your Browser

Go to: **http://localhost:3000**

## ✅ Verify Everything Works

1. **Python Service:** http://localhost:5001/api/health
2. **Backend:** http://localhost:5000/api/health
3. **Frontend:** http://localhost:3000

## 🧪 Quick Test

1. Open http://localhost:3000
2. Sign up as Student or Teacher
3. Test the features!

## 🎯 Port Summary

- **Frontend:** Port 3000 (configured in `vite.config.ts`)
- **Backend:** Port 5000
- **Python Service:** Port 5001

All configuration files have been updated to use port 3000 for the frontend!

