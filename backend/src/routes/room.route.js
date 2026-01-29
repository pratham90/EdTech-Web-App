import express from 'express';
import Room from '../models/room.model.js';
import User from '../models/user.model.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Create a new room (Teacher only)
router.post('/create', protectRoute, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create rooms' });
    }

    const { roomName } = req.body;
    
    if (!roomName || roomName.trim().length === 0) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const roomId = await Room.generateRoomId();
    
    const room = new Room({
      roomId,
      roomName: roomName.trim(),
      teacherId: req.user._id,
      students: [],
      isActive: true,
    });

    await room.save();

    res.status(201).json({
      success: true,
      room: {
        _id: room._id,
        roomId: room.roomId,
        roomName: room.roomName,
        teacherId: room.teacherId,
        createdAt: room.createdAt,
      },
      message: `Room created successfully! Share code: ${room.roomId}`,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Join a room (Student only)
router.post('/join', protectRoute, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can join rooms' });
    }

    const { roomId } = req.body;
    
    if (!roomId || roomId.trim().length === 0) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    const room = await Room.findOne({ 
      roomId: roomId.trim().toUpperCase(),
      isActive: true 
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found or inactive' });
    }

    // Check if student is already in this room
    if (room.students.includes(req.user._id)) {
      return res.status(400).json({ error: 'You are already in this room' });
    }

    // Check if student is already in another room
    if (req.user.roomId) {
      const currentRoom = await Room.findById(req.user.roomId);
      if (currentRoom && currentRoom.isActive) {
        return res.status(400).json({ 
          error: 'You are already in a room. Please leave your current room first.' 
        });
      }
    }

    // Add student to room
    room.students.push(req.user._id);
    await room.save();

    // Update user's roomId
    req.user.roomId = room._id;
    await req.user.save();

    res.json({
      success: true,
      room: {
        _id: room._id,
        roomId: room.roomId,
        roomName: room.roomName,
        teacherId: room.teacherId,
      },
      message: `Successfully joined room: ${room.roomName}`,
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Leave a room (Student only)
router.post('/leave', protectRoute, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can leave rooms' });
    }

    if (!req.user.roomId) {
      return res.status(400).json({ error: 'You are not in any room' });
    }

    const room = await Room.findById(req.user.roomId);
    if (!room) {
      // Room doesn't exist, just clear user's roomId
      req.user.roomId = null;
      await req.user.save();
      return res.json({ success: true, message: 'Left room successfully' });
    }

    // Remove student from room
    room.students = room.students.filter(
      studentId => studentId.toString() !== req.user._id.toString()
    );
    await room.save();

    // Clear user's roomId
    req.user.roomId = null;
    await req.user.save();

    res.json({ success: true, message: 'Left room successfully' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get my rooms (Teacher gets rooms they created, Student gets their current room)
router.get('/my-rooms', protectRoute, async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      // Get all rooms created by this teacher
      const rooms = await Room.find({ 
        teacherId: req.user._id,
        isActive: true 
      })
      .populate('students', 'email name')
      .sort({ createdAt: -1 });

      res.json({
        success: true,
        rooms: rooms.map(room => ({
          _id: room._id,
          roomId: room.roomId,
          roomName: room.roomName,
          studentCount: room.students.length,
          students: room.students,
          createdAt: room.createdAt,
        })),
      });
    } else if (req.user.role === 'student') {
      // Get student's current room
      if (!req.user.roomId) {
        return res.json({
          success: true,
          room: null,
          message: 'You are not in any room',
        });
      }

      const room = await Room.findById(req.user.roomId)
        .populate('teacherId', 'email name')
        .populate('students', 'email name');

      if (!room) {
        req.user.roomId = null;
        await req.user.save();
        return res.json({
          success: true,
          room: null,
          message: 'Room not found',
        });
      }

      res.json({
        success: true,
        room: {
          _id: room._id,
          roomId: room.roomId,
          roomName: room.roomName,
          teacher: room.teacherId,
          studentCount: room.students.length,
          createdAt: room.createdAt,
        },
      });
    } else {
      res.status(403).json({ error: 'Invalid role' });
    }
  } catch (error) {
    console.error('Error getting rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get students in a room (Teacher only)
router.get('/:roomId/students', protectRoute, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can view room students' });
    }

    const room = await Room.findOne({ 
      roomId: req.params.roomId.toUpperCase(),
      teacherId: req.user._id,
      isActive: true 
    })
    .populate('students', 'email name createdAt');

    if (!room) {
      return res.status(404).json({ error: 'Room not found or you do not have access' });
    }

    res.json({
      success: true,
      room: {
        _id: room._id,
        roomId: room.roomId,
        roomName: room.roomName,
        students: room.students,
        studentCount: room.students.length,
      },
    });
  } catch (error) {
    console.error('Error getting room students:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete/Deactivate a room (Teacher only)
router.delete('/:roomId', protectRoute, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can delete rooms' });
    }

    const room = await Room.findOne({ 
      roomId: req.params.roomId.toUpperCase(),
      teacherId: req.user._id 
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found or you do not have access' });
    }

    // Deactivate room instead of deleting (preserve data)
    room.isActive = false;
    await room.save();

    // Clear roomId from all students in this room
    await User.updateMany(
      { roomId: room._id },
      { $set: { roomId: null } }
    );

    res.json({
      success: true,
      message: 'Room deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

