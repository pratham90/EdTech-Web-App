// WebSocket utility - singleton pattern
let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => {
  return ioInstance;
};

export const emitToTeacher = (teacherId, event, data) => {
  if (ioInstance && teacherId) {
    ioInstance.to(`teacher:${teacherId}`).emit(event, data);
    console.log(`📢 WebSocket: Emitted ${event} to teacher ${teacherId}`);
  }
};

export const emitToStudent = (studentId, event, data) => {
  if (ioInstance && studentId) {
    ioInstance.to(`student:${studentId}`).emit(event, data);
    console.log(`📢 WebSocket: Emitted ${event} to student ${studentId}`);
  }
};

