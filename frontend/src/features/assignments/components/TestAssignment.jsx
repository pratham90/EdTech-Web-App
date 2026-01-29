import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { 
  FileText, 
  Users, 
  Calendar,
  Send,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { AssignmentSubmissions } from './AssignmentSubmissions';
import websocket from '../../../services/websocket';

export function TestAssignment() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [papers, setPapers] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedPaper, setSelectedPaper] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const assignmentsRef = useRef([]);

  const loadAssignments = async () => {
    try {
      const response = await api.getAssignments(user?._id);
      if (response.assignments) {
        // Check for new submissions
        const previousAssignments = assignmentsRef.current;
        if (previousAssignments.length > 0) {
          response.assignments.forEach((newAssignment) => {
            const oldAssignment = previousAssignments.find(a => a._id === newAssignment._id);
            if (oldAssignment) {
              const oldCount = oldAssignment.submitted_count || 0;
              const newCount = newAssignment.submitted_count || 0;
              if (newCount > oldCount) {
                toast.success(`New submission for "${newAssignment.paper_title || 'Assignment'}"!`, {
                  duration: 3000,
                });
              }
            }
          });
        }
        
        assignmentsRef.current = response.assignments;
        setAssignments(response.assignments);
      }
    } catch (error) {
      console.error('Failed to load assignments:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load rooms
      const roomsResponse = await api.getMyRooms();
      if (roomsResponse.success && roomsResponse.rooms) {
        setRooms(roomsResponse.rooms);
      }

      // Load papers
      const papersResponse = await api.listPapers();
      if (papersResponse.papers) {
        setPapers(papersResponse.papers);
      }

      // Load existing assignments
      await loadAssignments();
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Connect to WebSocket as teacher
    if (user?._id && user?.role === 'teacher') {
      // Connect and join - joinAsTeacher handles connection state internally
      websocket.connect();
      websocket.joinAsTeacher(user._id);
      
      // Listen for new submissions in real-time
      const unsubscribe = websocket.onAssignmentSubmitted((data) => {
        console.log('📥 New submission received in TestAssignment:', data);
        toast.success(`New submission received for "${data.paper_title}"!`, {
          duration: 4000,
        });
        // Refresh assignments list with small delay to ensure DB is updated
        setTimeout(() => {
          loadAssignments();
        }, 500);
      });
      
      // Cleanup on unmount
      return () => {
        unsubscribe();
      };
    }
  }, [user?._id]);

  const handleAssignTest = async () => {
    if (!selectedRoom || !selectedPaper) {
      toast.error('Please select both a room and a paper');
      return;
    }

    setAssigning(true);
    try {
      const room = rooms.find(r => r._id === selectedRoom);
      
      await api.assignTest(
        selectedPaper,
        [], // studentIds - empty because we're using roomId
        dueDate || null,
        user?._id, // teacherId
        selectedRoom // roomId
      );

      toast.success(`Test assigned to ${room.roomName}! All ${room.studentCount || 0} students will receive this test.`);
      setSelectedRoom('');
      setSelectedPaper('');
      setDueDate('');
      await loadAssignments();
      // Refresh rooms to update student counts
      const roomsResponse = await api.getMyRooms();
      if (roomsResponse.success && roomsResponse.rooms) {
        setRooms(roomsResponse.rooms);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to assign test');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (viewingSubmissions) {
    return (
      <AssignmentSubmissions
        assignmentId={viewingSubmissions}
        onBack={() => setViewingSubmissions(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Assign Test Form */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Send className="h-5 w-5 text-white" />
            </div>
            <span>Assign Test to Room</span>
          </CardTitle>
          <CardDescription>
            Assign a question paper to all students in a room
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label>Select Room</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.length === 0 ? (
                    <SelectItem value="none" disabled>No rooms available. Create a room first.</SelectItem>
                  ) : (
                    rooms.map((room) => (
                      <SelectItem key={room._id} value={room._id}>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{room.roomName}</span>
                          <Badge variant="secondary" className="ml-2">
                            {room.studentCount || 0} students
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Select Paper</Label>
              <Select value={selectedPaper} onValueChange={setSelectedPaper}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a question paper" />
                </SelectTrigger>
                <SelectContent>
                  {papers.length === 0 ? (
                    <SelectItem value="none" disabled>No papers available. Create a paper first.</SelectItem>
                  ) : (
                    papers.map((paper) => (
                      <SelectItem key={paper._id} value={paper._id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{paper.title || 'Untitled Paper'}</span>
                          <Badge variant="outline" className="ml-2">
                            {paper.question_count || paper.questions?.length || 0} Q
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="due-date">Due Date (Optional)</Label>
              <Input
                id="due-date"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <Button
              onClick={handleAssignTest}
              disabled={assigning || !selectedRoom || !selectedPaper || rooms.length === 0 || papers.length === 0}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {assigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Assign Test to Room
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Assignments */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-secondary rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span>Recent Assignments</span>
          </CardTitle>
          <CardDescription>
            Tests you've assigned to rooms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No assignments yet. Assign a test to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 10).map((assignment) => (
                <div
                  key={assignment._id}
                  className="p-4 rounded-xl bg-gradient-to-r from-white/60 to-blue-50/60 border border-white/30 hover:shadow-soft transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{assignment.paper_title || 'Untitled Paper'}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {assignment.total_students || 0} students
                        </span>
                        {assignment.due_date && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {assignment.submitted_count || 0} / {assignment.total_students || 0} submitted
                      </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingSubmissions(assignment._id)}
                      >
                        View Results
                      </Button>
                      <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                        {assignment.status || 'active'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


