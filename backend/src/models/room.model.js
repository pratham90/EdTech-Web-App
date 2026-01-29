import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  roomName: {
    type: String,
    required: true,
    trim: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Generate unique room ID
roomSchema.statics.generateRoomId = async function() {
  let roomId;
  let exists = true;
  
  while (exists) {
    // Generate 6-character alphanumeric code
    roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    exists = await this.findOne({ roomId });
  }
  
  return roomId;
};

const Room = mongoose.model('Room', roomSchema);
export default Room;

