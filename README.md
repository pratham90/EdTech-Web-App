# EdTech Platform - Complete Integration Guide

A comprehensive EdTech platform that provides online studying, syllabus parsing, question generation, mock tests, and assessment paper creation for both students and teachers.

## 🚀 Features

### For Students:
- 📚 Upload syllabus in PDF, text, or voice format
- 🎯 Select exam patterns and get personalized study material
- 📝 Generate practice questions
- 🧪 Take mock tests with AI-powered evaluation
- 💬 Practice with AI interview bot
- 📊 Track progress and analytics
- 🎓 Get personalized recommendations

### For Teachers:
- 📄 Generate question papers automatically
- 📊 View class analytics and student performance
- 📝 Create assignments and assessments
- 🤖 AI-powered teaching assistant
- 📈 Track student progress

## 📁 Project Structure

```
Edtech/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── routes/      # API routes
│   │   ├── services/    # Python service integration
│   │   ├── models/      # Database models
│   │   └── middleware/   # Auth middleware
│   └── main.js          # Entry point
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API service
│   │   └── contexts/    # React contexts
│   └── package.json
│
└── python_models/        # Python AI models
    ├── unified_service.py  # Single unified service
    └── requirements.txt     # Python dependencies
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- MongoDB (local or cloud)
- OpenAI API key

### 1. Backend Setup

```bash
cd Edtech/backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edtech
FRONTEND_URL=http://localhost:3000
PYTHON_SERVICE_URL=http://localhost:5001
JWT_SECRET=your_jwt_secret_key_here
```

Start backend:
```bash
npm run dev
```

### 2. Python Service Setup

```bash
cd Edtech/python_models
pip install -r requirements.txt
```

**Important**: Install spaCy model:
```bash
python -m spacy download en_core_web_sm
```

Create `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
MONGO_URI=mongodb://localhost:27017/edtech_ai
```

Start Python service:
```bash
python unified_service.py
```

The service will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd Edtech/frontend
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🎯 Running the Complete System

### Option 1: Run All Services Separately

1. **Terminal 1 - Python Service:**
   ```bash
   cd Edtech/python_models
   python unified_service.py
   ```

2. **Terminal 2 - Backend:**
   ```bash
   cd Edtech/backend
   npm run dev
   ```

3. **Terminal 3 - Frontend:**
   ```bash
   cd Edtech/frontend
   npm run dev
   ```

### Option 2: Use Process Manager (PM2)

Install PM2:
```bash
npm install -g pm2
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'python-service',
      script: 'python',
      args: 'unified_service.py',
      cwd: './python_models',
      interpreter: 'python3'
    },
    {
      name: 'backend',
      script: 'npm',
      args: 'run dev',
      cwd: './backend'
    },
    {
      name: 'frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend'
    }
  ]
};
```

Run all services:
```bash
pm2 start ecosystem.config.js
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - User signup
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/check` - Check authentication

### AI Services
- `POST /api/ai/parse-syllabus` - Parse syllabus from file/text
- `POST /api/ai/generate-questions` - Generate questions
- `POST /api/ai/generate-answer` - Generate answers
- `POST /api/ai/evaluate-mock` - Evaluate mock test
- `POST /api/ai/evaluate-student` - Smart evaluation
- `POST /api/ai/generate-paper` - Generate question paper
- `GET /api/ai/list-papers` - List all papers
- `POST /api/ai/interview/start` - Start interview
- `POST /api/ai/interview/submit` - Submit interview answer
- `POST /api/ai/save-progress` - Save student progress
- `GET /api/ai/get-progress/:studentId` - Get progress
- `POST /api/ai/adaptive/analyze` - Adaptive learning analysis
- `GET /api/ai/recommend/:studentId` - Get recommendations
- `GET /api/ai/report/:studentId` - Download report
- `GET /api/ai/teacher/dashboard` - Teacher dashboard

## 🔧 Configuration

### Python Service Ports
The unified Python service runs on port `5001` by default (configurable via `PYTHON_SERVICE_PORT`). All models are integrated into this single service.

### Backend Port
The Node.js backend runs on port `5000` by default. The Python service runs on port `5001` to avoid conflicts.

### Frontend Port
The React frontend runs on port `3000` by default (configured in vite.config.ts).

## 🐛 Troubleshooting

### Python Service Issues
1. **Missing dependencies**: Run `pip install -r requirements.txt`
2. **spaCy model missing**: Run `python -m spacy download en_core_web_sm`
3. **Whisper not working**: Install `openai-whisper` separately
4. **MongoDB connection**: Check `MONGO_URI` in `.env`

### Backend Issues
1. **Port conflicts**: Change `PORT` in backend `.env`
2. **Python service not reachable**: Check `PYTHON_SERVICE_URL` in `.env`
3. **CORS errors**: Verify `FRONTEND_URL` in backend `.env`

### Frontend Issues
1. **API connection failed**: Check `VITE_API_URL` in frontend `.env`
2. **Authentication issues**: Verify JWT token handling

## 📝 Notes

- All Python models are now integrated into a single `unified_service.py` file
- The service uses Flask with CORS enabled
- MongoDB is used for storing papers, evaluations, and progress
- OpenAI API is required for AI features
- File uploads are handled via multer in backend

## 🎓 Usage Examples

### Parse Syllabus
```javascript
// Upload file
const formData = new FormData();
formData.append('file', file);
await api.parseSyllabus(formData);

// Or text input
await api.parseSyllabus("Your syllabus text here");
```

### Generate Questions
```javascript
const result = await api.generateQuestions(
  "Operating Systems",
  "University Exam",
  "medium",
  "mixed",
  10
);
```

### Start Interview
```javascript
const session = await api.startInterview("Computer Science", "Medium");
// Use session.session_id for subsequent calls
```

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

