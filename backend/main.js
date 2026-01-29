import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import multer from 'multer';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// local imports
import authRoutes from './src/routes/auth.route.js';
import aiRoutes from './src/routes/ai.route.js';
import roomRoutes from './src/routes/room.route.js';
import { ConnectDB } from './src/lib/database.js';

dotenv.config({ path: "./.env" });   

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
try {
  mkdirSync(join(__dirname, 'uploads'), { recursive: true });
} catch (error) {
  // Directory already exists or permission issue
}

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 5000;

// WebSocket Server Setup
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const io = new Server(httpServer, {
  cors: {
    origin: [
      frontendUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Store active connections by user role and ID
const teacherConnections = new Map(); // teacherId -> Set of socketIds
const studentConnections = new Map(); // studentId -> Set of socketIds

io.on('connection', (socket) => {
  console.log(`✅ WebSocket client connected: ${socket.id}`);

  // Handle teacher joining (listening for submissions)
  socket.on('teacher:join', (teacherId) => {
    if (!teacherConnections.has(teacherId)) {
      teacherConnections.set(teacherId, new Set());
    }
    teacherConnections.get(teacherId).add(socket.id);
    socket.join(`teacher:${teacherId}`);
    console.log(`👨‍🏫 Teacher ${teacherId} joined WebSocket room`);
  });

  // Handle student joining
  socket.on('student:join', (studentId) => {
    if (!studentConnections.has(studentId)) {
      studentConnections.set(studentId, new Set());
    }
    studentConnections.get(studentId).add(socket.id);
    socket.join(`student:${studentId}`);
    console.log(`👨‍🎓 Student ${studentId} joined WebSocket room`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ WebSocket client disconnected: ${socket.id}`);
    
    // Clean up teacher connections
    for (const [teacherId, socketIds] of teacherConnections.entries()) {
      socketIds.delete(socket.id);
      if (socketIds.size === 0) {
        teacherConnections.delete(teacherId);
      }
    }
    
    // Clean up student connections
    for (const [studentId, socketIds] of studentConnections.entries()) {
      socketIds.delete(socket.id);
      if (socketIds.size === 0) {
        studentConnections.delete(studentId);
      }
    }
  });
});

// Export io for use in routes
export { io };

// Initialize WebSocket utility (after io is created)
// Use dynamic import to avoid circular dependency issues
setTimeout(async () => {
  try {
    const { setIO } = await import('./src/lib/websocket.js');
    setIO(io);
    console.log('🔌 WebSocket utility initialized');
  } catch (err) {
    console.warn('⚠️ Failed to initialize WebSocket utility:', err);
  }
}, 0);

// Middleware
console.log(`🌐 CORS configured for frontend: ${frontendUrl}`);

// CORS configuration - must be explicit origin (not wildcard) when using credentials
// NEVER return true (wildcard) when credentials: true - must return specific origin
// This configuration ALWAYS works, regardless of NODE_ENV
app.use(cors({
  origin: (origin, callback) => {
    // For requests with no origin (like Postman, mobile apps), allow but use frontendUrl
    if (!origin) {
      console.log('📱 Request with no origin, allowing with frontend URL');
      return callback(null, frontendUrl);
    }
    
    // ALWAYS allow localhost origins unless explicitly in production mode
    // Defaults to development mode if NODE_ENV is not set
    const nodeEnv = process.env.NODE_ENV ? process.env.NODE_ENV.trim().toLowerCase() : 'development';
    const isDevelopment = nodeEnv !== 'production';
    
    if (isDevelopment) {
      // Allow any localhost or 127.0.0.1 origin (but return the specific origin, not wildcard)
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        console.log(`✅ Allowing origin in development: ${origin}`);
        return callback(null, origin); // Return the specific origin, not true
      }
    }
    
    // Check if the origin is in the allowed list
    const allowedOrigins = [
      frontendUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ];
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Allowing origin: ${origin}`);
      callback(null, origin); // Return the specific origin, not true
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/room', roomRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'EdTech Backend' });
});

// Server
httpServer.listen(port, () => {
    console.log(`🚀 Backend server is running on http://localhost:${port}`);
    console.log(`📡 Python service URL: ${process.env.PYTHON_SERVICE_URL || 'http://localhost:5001'}`);
    console.log(`🔌 WebSocket server is ready for connections`);
    ConnectDB();
});