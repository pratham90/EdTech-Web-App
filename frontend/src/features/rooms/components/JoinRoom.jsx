import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Badge } from '../../../shared/components/ui/badge';
import { 
  Users, 
  DoorOpen, 
  CheckCircle, 
  XCircle,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';

export function JoinRoom() {
  const [roomCode, setRoomCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentRoom();
  }, []);

  const loadCurrentRoom = async () => {
    setLoading(true);
    try {
      const response = await api.getMyRooms();
      if (response.success && response.room) {
        setCurrentRoom(response.room);
      } else {
        setCurrentRoom(null);
      }
    } catch (error) {
      console.error('Failed to load current room:', error);
      setCurrentRoom(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }

    setJoining(true);
    try {
      const response = await api.joinRoom(roomCode.trim().toUpperCase());
      if (response.success) {
        toast.success(`Successfully joined room: ${response.room.roomName}`);
        setRoomCode('');
        await loadCurrentRoom();
      } else {
        toast.error(response.error || 'Failed to join room');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!confirm('Are you sure you want to leave this room? You will lose access to assignments and analytics.')) {
      return;
    }

    try {
      await api.leaveRoom();
      toast.success('Left room successfully');
      setCurrentRoom(null);
    } catch (error) {
      toast.error(error.message || 'Failed to leave room');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentRoom ? (
        // Show current room info
        <Card className="glass-effect border-white/20 shadow-soft-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-success rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span>Current Room</span>
            </CardTitle>
            <CardDescription>
              You are enrolled in this classroom
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-green-900 mb-2">
                    {currentRoom.roomName}
                  </h3>
                  <p className="text-sm text-green-700">
                    Room Code: <code className="font-mono font-bold text-lg px-2 py-1 bg-white rounded">{currentRoom.roomId}</code>
                  </p>
                </div>
                <div className="p-4 bg-green-100 rounded-full">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-green-700">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>{currentRoom.studentCount || 0} students enrolled</span>
                </div>
                {currentRoom.teacher && (
                  <div className="flex items-center space-x-2">
                    <span>Teacher: {currentRoom.teacher.name || currentRoom.teacher.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm text-green-600 mb-3">
                  You can now receive assignments and your teacher can track your progress.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleLeaveRoom}
                  className="w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Room
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Show join room form
        <Card className="glass-effect border-white/20 shadow-soft-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <DoorOpen className="h-5 w-5 text-white" />
              </div>
              <span>Join a Classroom</span>
            </CardTitle>
            <CardDescription>
              Enter the room code provided by your teacher to join their classroom
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-code">Room Code</Label>
              <Input
                id="room-code"
                placeholder="Enter 6-character room code (e.g., ABC123)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl font-mono font-bold tracking-widest"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinRoom();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground text-center">
                Ask your teacher for the room code
              </p>
            </div>
            
            <Button
              onClick={handleJoinRoom}
              disabled={joining || !roomCode.trim() || roomCode.length !== 6}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {joining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  <DoorOpen className="h-4 w-4 mr-2" />
                  Join Room
                </>
              )}
            </Button>

            <div className="pt-4 border-t">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  How to join a room:
                </h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Get the room code from your teacher</li>
                  <li>Enter the 6-character code above</li>
                  <li>Click "Join Room" to connect</li>
                  <li>You'll receive assignments and your progress will be tracked</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


