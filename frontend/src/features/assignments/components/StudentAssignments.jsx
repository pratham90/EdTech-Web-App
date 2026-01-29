import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { 
  FileText, 
  Calendar,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { TakeTest } from './TakeTest';

export function StudentAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [paper, setPaper] = useState(null);

  useEffect(() => {
    // Only load assignments on initial mount or when coming back from test
    if (!selectedAssignment && !paper) {
      loadAssignments();
    }
  }, []); // Only run on mount

  // Separate effect for visibility change - only when not in test mode
  useEffect(() => {
    // Only set up visibility listener if we're NOT taking a test
    if (selectedAssignment || paper) {
      return; // Don't set up listener if in test mode
    }
    
    const handleVisibilityChange = () => {
      if (!document.hidden && !selectedAssignment && !paper) {
        // Only refresh if not currently taking a test
        loadAssignments();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedAssignment, paper]); // Re-run when test state changes

  const loadAssignments = async () => {
    // Don't load assignments if user is currently taking a test
    if (selectedAssignment || paper) {
      console.log('Skipping loadAssignments - user is taking a test');
      return;
    }
    
    setLoading(true);
    try {
      // Get assignments for current student
      const response = await api.getStudentAssignments(user?._id);
      if (response.assignments) {
        setAssignments(response.assignments);
      }
    } catch (error) {
      console.error('Failed to load assignments:', error);
      // Don't show error toast if user is taking a test
      if (!selectedAssignment && !paper) {
        toast.error('Failed to load assignments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (assignment) => {
    try {
      // Get paper details
      const paperResponse = await api.getPaper(assignment.paper_id);
      if (paperResponse.paper) {
        setSelectedAssignment(assignment);
        setPaper(paperResponse.paper);
      } else {
        toast.error('Failed to load test paper');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load test');
    }
  };

  const handleBackToList = () => {
    // Clear the test state first
    const wasTakingTest = selectedAssignment !== null || paper !== null;
    setSelectedAssignment(null);
    setPaper(null);
    
    // Only reload assignments if we were actually taking a test
    // This prevents unnecessary refreshes
    if (wasTakingTest) {
      // Use a longer delay to ensure state is fully cleared
      setTimeout(() => {
        loadAssignments();
      }, 300);
    }
  };

  if (selectedAssignment && paper) {
    return (
      <TakeTest 
        assignment={selectedAssignment}
        paper={paper}
        onBack={handleBackToList}
        onComplete={loadAssignments}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => 
    !a.submissions || !a.submissions.find(s => s.student_id === user?._id)
  );
  const completedAssignments = assignments.filter(a => 
    a.submissions && a.submissions.find(s => s.student_id === user?._id)
  );

  return (
    <div className="space-y-6">
      {/* Pending Assignments */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <span>Pending Assignments</span>
          </CardTitle>
          <CardDescription>
            Tests you need to complete
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingAssignments.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No pending assignments. Great job!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAssignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 hover:shadow-soft transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{assignment.paper_title || 'Untitled Test'}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {assignment.due_date && (
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                            {new Date(assignment.due_date) < new Date() && (
                              <Badge variant="destructive" className="ml-2">Overdue</Badge>
                            )}
                          </span>
                        )}
                        <span className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          Assignment ID: {assignment._id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartTest(assignment)}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Test
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Assignments */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-success rounded-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <span>Completed Assignments</span>
          </CardTitle>
          <CardDescription>
            Tests you've already submitted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedAssignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No completed assignments yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedAssignments.map((assignment) => {
                const submission = assignment.submissions?.find(s => s.student_id === user?._id);
                return (
                  <div
                    key={assignment._id}
                    className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{assignment.paper_title || 'Untitled Test'}</h3>
                        <div className="flex items-center space-x-4 text-sm">
                          {submission && (
                            <>
                              <Badge className="bg-green-500 text-white">
                                Score: {submission.percentage || 0}%
                              </Badge>
                              <span className="text-muted-foreground">
                                Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'Recently'}
                              </span>
                              {submission.evaluation && (
                                <span className="text-muted-foreground">
                                  {submission.evaluation.total_score || 0} / {submission.evaluation.total_marks || 0} marks
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {submission?.teacher_feedback && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <span className="font-semibold">Teacher Feedback: </span>
                            {submission.teacher_feedback}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {assignment.paper_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await api.downloadPaper(assignment.paper_id);
                                toast.success('Paper downloaded successfully!');
                              } catch (error) {
                                toast.error(error.message || 'Failed to download paper');
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


