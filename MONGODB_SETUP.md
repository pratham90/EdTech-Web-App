# 🗄️ MongoDB Setup Guide

## The Error You're Seeing

```
MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster
```

This means your backend is trying to connect to MongoDB but can't reach it.

## 🔧 Solution Options

### Option 1: Use Local MongoDB (Recommended for Development)

**Step 1: Install MongoDB Locally**
- Download from: https://www.mongodb.com/try/download/community
- Or use Homebrew: `brew install mongodb-community` (Mac)
- Or use Chocolatey: `choco install mongodb` (Windows)

**Step 2: Start MongoDB**
```bash
# Windows
mongod

# Mac/Linux
sudo systemctl start mongod
# or
mongod
```

**Step 3: Update Backend .env**
Create/Update `Edtech/backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/edtech
```

**Step 4: Update Python .env**
Create/Update `Edtech/python_models/.env`:
```env
MONGO_URI=mongodb://localhost:27017/edtech_ai
```

**Step 5: Restart Backend**
```bash
cd Edtech/backend
npm run dev
```

### Option 2: Use MongoDB Atlas (Cloud)

**Step 1: Create MongoDB Atlas Account**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free
3. Create a new cluster (Free tier is fine)

**Step 2: Whitelist Your IP**
1. Go to "Network Access" in Atlas dashboard
2. Click "Add IP Address"
3. Click "Add Current IP Address" (or add `0.0.0.0/0` for all IPs - less secure)

**Step 3: Get Connection String**
1. Go to "Database Access" → Create database user
2. Go to "Clusters" → Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string

**Step 4: Update .env Files**

**Backend** (`Edtech/backend/.env`):
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/edtech?retryWrites=true&w=majority
```

**Python** (`Edtech/python_models/.env`):
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/edtech_ai?retryWrites=true&w=majority
```

Replace `username` and `password` with your Atlas credentials!

**Step 5: Restart Services**
```bash
# Restart backend
cd Edtech/backend
npm run dev

# Restart Python service
cd Edtech/python_models
python unified_service.py
```

## ✅ Verify Connection

After setup, you should see:
```
✅ MongoDB connected successfully
📊 Database: edtech
```

## 🐛 Troubleshooting

### "Connection timeout"
- **Local MongoDB:** Make sure `mongod` is running
- **Atlas:** Check IP whitelist and connection string

### "Authentication failed"
- Check username/password in connection string
- Make sure database user exists in Atlas

### "Network is unreachable"
- Check internet connection (for Atlas)
- Check firewall settings
- Verify MongoDB port 27017 is open (for local)

## 📝 Quick Fix (Use Local MongoDB)

If you just want to get started quickly:

1. **Install MongoDB locally** (or skip if already installed)

2. **Start MongoDB:**
   ```bash
   mongod
   ```

3. **Update `.env` files:**
   
   `Edtech/backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/edtech
   ```
   
   `Edtech/python_models/.env`:
   ```env
   MONGO_URI=mongodb://localhost:27017/edtech_ai
   ```

4. **Restart backend:**
   ```bash
   cd Edtech/backend
   npm run dev
   ```

That's it! 🎉

