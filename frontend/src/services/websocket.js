/**
 * WebSocket Service for Real-time Updates
 */
import { io } from 'socket.io-client';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = localStorage.getItem('token') || document.cookie
      .split('; ')
      .find(row => row.startsWith('jwt='))
      ?.split('=')[1];

    this.socket = io(WS_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      reconnectionDelayMax: 5000,
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ WebSocket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ WebSocket disconnected:', reason);
      // Will automatically reconnect due to reconnection: true
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Teacher joins to listen for submissions
  joinAsTeacher(teacherId) {
    if (!this.socket || !this.socket.connected) {
      this.connect();
      // Wait for connection before joining
      this.socket.once('connect', () => {
        this.socket.emit('teacher:join', teacherId);
        console.log(`👨‍🏫 Teacher ${teacherId} joined WebSocket room`);
      });
    } else {
      this.socket.emit('teacher:join', teacherId);
      console.log(`👨‍🏫 Teacher ${teacherId} joined WebSocket room`);
    }
  }

  // Student joins
  joinAsStudent(studentId) {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }
    
    this.socket.emit('student:join', studentId);
    console.log(`👨‍🎓 Student ${studentId} joined WebSocket room`);
  }

  // Listen for assignment submissions (for teachers)
  onAssignmentSubmitted(callback) {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }

    const listener = (data) => {
      console.log('📥 New assignment submission received via WebSocket:', data);
      callback(data);
    };

    this.socket.on('assignment:submitted', listener);
    
    // Store listener for cleanup
    const key = 'assignment:submitted';
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(listener);

    // Return unsubscribe function
    return () => {
      if (this.socket) {
        this.socket.off('assignment:submitted', listener);
      }
      const listeners = this.listeners.get(key);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Check connection status
  getConnectionStatus() {
    return this.isConnected && this.socket?.connected;
  }

  // Remove all listeners
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
      this.listeners.delete(event);
    }
  }
}

export default new WebSocketService();

