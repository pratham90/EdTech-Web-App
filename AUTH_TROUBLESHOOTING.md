# 🔐 Authentication Troubleshooting Guide

## Issues Fixed

I've fixed several bugs in the authentication system:

### ✅ Fixed Issues:
1. **Signup sending duplicate responses** - Fixed
2. **Auth middleware using wrong query** - Fixed (`findOne` → `findById`)
3. **Typo in middleware** - Fixed (`json9` → `json`)
4. **Better error messages** - Added
5. **Frontend error handling** - Improved with toast notifications

## 🔍 Common Issues & Solutions

### Issue 1: "MongoDB connection error"
**Solution:**
1. Make sure MongoDB is running:
   ```bash
   mongod
   ```

2. Check your `.env` file has:
   ```env
   MONGODB_URI=mongodb://localhost:27017/edtech
   ```

### Issue 2: "JWT_SECRET not configured"
**Solution:**
Add to `Edtech/backend/.env`:
```env
JWT_SECRET=your_super_secret_key_here_make_it_long_and_random
```

### Issue 3: "User already exists" (but you're trying to sign up)
**Solution:**
- The email is already in the database
- Try a different email
- Or delete the user from MongoDB:
  ```bash
  mongosh
  use edtech
  db.users.deleteOne({ email: "your-email@example.com" })
  ```

### Issue 4: "All fields are required"
**Solution:**
- Make sure you're filling all fields:
  - Email
  - Password (min 8 characters)
  - Role (student or teacher)
  - Name (for signup)

### Issue 5: "Operation buffering timed out"
**Solution:**
- MongoDB is not running or not reachable
- Start MongoDB: `mongod`
- Or check your connection string

## ✅ Quick Checklist

Before testing login/signup, make sure:

- [ ] MongoDB is running (`mongod`)
- [ ] Backend `.env` has `MONGODB_URI` and `JWT_SECRET`
- [ ] Backend is running on port 5000
- [ ] Frontend is running on port 3000
- [ ] No console errors in browser

## 🧪 Test Steps

1. **Start MongoDB:**
   ```bash
   mongod
   ```

2. **Start Backend:**
   ```bash
   cd Edtech/backend
   npm run dev
   ```
   Should see: `✅ MongoDB connected successfully`

3. **Start Frontend:**
   ```bash
   cd Edtech/frontend
   npm run dev
   ```

4. **Test Signup:**
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Fill all fields
   - Click "Create Account"
   - Should see success message

5. **Test Login:**
   - Use the same email/password
   - Click "Sign In"
   - Should redirect to dashboard

## 🐛 Debug Tips

**Check Backend Console:**
- Look for error messages
- Check if MongoDB connection succeeded
- Check if JWT_SECRET is loaded

**Check Browser Console:**
- Open DevTools (F12)
- Go to Console tab
- Look for API errors
- Check Network tab for failed requests

**Check Network Requests:**
1. Open DevTools → Network tab
2. Try to sign up/login
3. Look for `/api/auth/signup` or `/api/auth/login` request
4. Check the response - it will show the exact error

## 📝 Required .env Configuration

**Backend** (`Edtech/backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edtech
FRONTEND_URL=http://localhost:3000
PYTHON_SERVICE_URL=http://localhost:5001
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
```

**Important:** JWT_SECRET must be set! Use a long random string.

## 🎯 Quick Fix

If nothing works, try this:

1. **Stop all services** (Ctrl+C)

2. **Start MongoDB:**
   ```bash
   mongod
   ```

3. **Create/Update `.env` files** (see above)

4. **Restart backend:**
   ```bash
   cd Edtech/backend
   npm run dev
   ```

5. **Check for success message:**
   ```
   ✅ MongoDB connected successfully
   📊 Database: edtech
   ```

6. **Try signup/login again**

If you still see errors, check the backend console for the exact error message!

