import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Badge } from '../../../shared/components/ui/badge';
import { 
  Users, 
  Plus, 
  Copy, 
  Trash2, 
  DoorOpen,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';

export function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomStudents, setRoomStudents] = useState([]);

  useEffect(() => {
    loadRooms();
    // Refresh rooms every 5 seconds to update student counts
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const response = await api.getMyRooms();
      if (response.success && response.rooms) {
        setRooms(response.rooms);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
      toast.error('Failed to load rooms');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    setCreating(true);
    try {
      const response = await api.createRoom(roomName.trim());
      if (response.success) {
        toast.success(`Room created! Share code: ${response.room.roomId}`);
        setRoomName('');
        await loadRooms();
      } else {
        toast.error(response.error || 'Failed to create room');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = (roomId) => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room code copied to clipboard!');
  };

  const handleViewStudents = async (room) => {
    try {
      const response = await api.getRoomStudents(room.roomId);
      if (response.success) {
        setSelectedRoom(room);
        setRoomStudents(response.room.students || []);
      } else {
        toast.error('Failed to load students');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load students');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room? All students will be removed.')) {
      return;
    }

    try {
      await api.deleteRoom(roomId);
      toast.success('Room deleted successfully');
      await loadRooms();
      if (selectedRoom && selectedRoom.roomId === roomId) {
        setSelectedRoom(null);
        setRoomStudents([]);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete room');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Room Section */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <span>Create New Room</span>
          </CardTitle>
          <CardDescription>
            Create a room and share the code with your students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              placeholder="e.g., Mathematics Class A, Physics Lab 1"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateRoom();
                }
              }}
            />
          </div>
          <Button
            onClick={handleCreateRoom}
            disabled={creating || !roomName.trim()}
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Rooms List */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-secondary rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span>My Rooms</span>
          </CardTitle>
          <CardDescription>
            Manage your classrooms and view enrolled students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">No Rooms Yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first room to start organizing your students
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="p-4 rounded-xl bg-gradient-to-r from-white/60 to-blue-50/60 border border-white/30 hover:shadow-soft transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{room.roomName}</h3>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {room.studentCount || 0} {room.studentCount === 1 ? 'student' : 'students'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">Room Code:</span>
                          <code className="px-3 py-1 bg-white rounded-md border border-gray-200 font-mono text-lg font-bold text-primary">
                            {room.roomId}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyCode(room.roomId)}
                            className="h-8 w-8 p-0"
                            title="Copy room code"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Created {new Date(room.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewStudents(room)}
                        className="hover:bg-blue-50"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View Students
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteRoom(room.roomId)}
                        className="hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Modal/Details */}
      {selectedRoom && (
        <Card className="glass-effect border-white/20 shadow-soft-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Students in {selectedRoom.roomName}</span>
                </CardTitle>
                <CardDescription>
                  Room Code: <code className="font-mono">{selectedRoom.roomId}</code>
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRoom(null);
                  setRoomStudents([]);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {roomStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No students have joined this room yet
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Share the room code: <code className="font-mono font-bold">{selectedRoom.roomId}</code>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {roomStudents.map((student, index) => (
                  <div
                    key={student._id || index}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-white/60 to-green-50/60 border border-white/30"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{student.name || student.email}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Joined
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


