import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../shared/components/ui/dialog';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  FileText,
  RefreshCw,
  Eye,
  Edit,
  Download,
  MessageSquare,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';
import websocket from '../../../services/websocket';
import { useAuth } from '../../../contexts/AuthContext';

export function AssignmentSubmissions({ assignmentId, onBack }) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [updatedPercentage, setUpdatedPercentage] = useState(0);
  const [paper, setPaper] = useState(null);
  const previousCountRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const loadSubmissions = useCallback(async (showToast = false) => {
    const isInitialLoad = !hasLoadedRef.current;
    if (isInitialLoad) {
      setLoading(true);
    }
    
    try {
      const response = await api.getAssignmentSubmissions(assignmentId);
      if (response.submissions) {
        const previousCount = previousCountRef.current;
        const newCount = response.submissions.length;
        
        if (hasLoadedRef.current && newCount > previousCount) {
          const newSubmissions = newCount - previousCount;
          toast.success(`${newSubmissions} new submission${newSubmissions > 1 ? 's' : ''} received!`, {
            duration: 3000,
          });
        }
        
        previousCountRef.current = newCount;
        hasLoadedRef.current = true;
        setSubmissions(response);
        
        // Load paper if not loaded
        if (response.paper_id && !paper) {
          try {
            const paperResponse = await api.getPaper(response.paper_id);
            if (paperResponse.paper) {
              setPaper(paperResponse.paper);
            }
          } catch (error) {
            console.error('Failed to load paper:', error);
          }
        }
      } else if (isInitialLoad) {
        toast.error('Failed to load submissions');
      }
    } catch (error) {
      if (isInitialLoad) {
        toast.error(error.message || 'Failed to load submissions');
      }
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, paper]);

  useEffect(() => {
    previousCountRef.current = 0;
    hasLoadedRef.current = false;
    setSubmissions(null);
    
    loadSubmissions();
    
    if (user?._id && user?.role === 'teacher') {
      websocket.connect();
      websocket.joinAsTeacher(user._id);
      
      const unsubscribe = websocket.onAssignmentSubmitted((data) => {
        if (data.assignment_id === assignmentId) {
          console.log('📥 Real-time submission received:', data);
          toast.success('New submission received!', {
            duration: 3000,
          });
          setTimeout(() => {
            loadSubmissions();
          }, 500);
        }
      });
      
      const pollInterval = setInterval(() => {
        loadSubmissions();
      }, 5000);
      
      return () => {
        unsubscribe();
        clearInterval(pollInterval);
      };
    } else {
      const pollInterval = setInterval(() => {
        loadSubmissions();
      }, 3000);
      
      return () => clearInterval(pollInterval);
    }
  }, [assignmentId, loadSubmissions, user?._id, user?.role]);

  const handleEvaluateSubmission = async (submission) => {
    if (!teacherFeedback.trim() && updatedPercentage === 0) {
      toast.error('Please provide feedback or update the percentage');
      return;
    }

    setIsEvaluating(true);
    try {
      await api.updateSubmissionEvaluation(
        assignmentId,
        submission.student_id,
        teacherFeedback,
        updatedPercentage || submission.percentage,
        submission.evaluation
      );
      
      toast.success('Evaluation updated successfully!');
      setSelectedSubmission(null);
      setTeacherFeedback('');
      setUpdatedPercentage(0);
      await loadSubmissions();
    } catch (error) {
      toast.error(error.message || 'Failed to update evaluation');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleDownloadPaper = async (paperId) => {
    try {
      await api.downloadPaper(paperId);
      toast.success('Paper downloaded successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to download paper');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!submissions) {
    return (
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Failed to load submissions</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  const submissionList = submissions.submissions || [];
  const avgScore = submissionList.length > 0
    ? submissionList.reduce((sum, s) => sum + (s.percentage || 0), 0) / submissionList.length
    : 0;
  
  const passCount = submissionList.filter(s => (s.percentage || 0) >= 60).length;
  const excellentCount = submissionList.filter(s => (s.percentage || 0) >= 90).length;
  const needsImprovementCount = submissionList.filter(s => (s.percentage || 0) < 60).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{submissions.paper_title || 'Assignment Results'}</CardTitle>
              <CardDescription>
                {submissionList.length} of {submissions.total_assigned || 0} students submitted
                <span className="ml-2 text-xs text-green-600 font-medium">● Live updates active</span>
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {submissions.paper_id && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadPaper(submissions.paper_id)}
                  title="Download paper"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Paper
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadSubmissions(true)}
                title="Refresh now"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 rounded-xl">
              <p className="text-sm text-muted-foreground">Total Assigned</p>
              <p className="text-2xl font-bold">{submissions.total_assigned || 0}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 rounded-xl">
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-2xl font-bold">{submissionList.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {submissions.total_assigned > 0 ? ((submissionList.length / submissions.total_assigned) * 100).toFixed(0) : 0}% completion
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 rounded-xl">
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">{avgScore.toFixed(1)}%</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 rounded-xl">
              <p className="text-sm text-muted-foreground">Passed (≥60%)</p>
              <p className="text-2xl font-bold">{passCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {submissionList.length > 0 ? ((passCount / submissionList.length) * 100).toFixed(0) : 0}% pass rate
              </p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 rounded-xl">
              <p className="text-sm text-muted-foreground">Excellent (≥90%)</p>
              <p className="text-2xl font-bold">{excellentCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
          <CardDescription>
            Individual student results and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissionList.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                No submissions yet. Students will appear here once they submit.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissionList
                .sort((a, b) => {
                  const aTime = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
                  const bTime = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
                  if (bTime !== aTime) return bTime - aTime;
                  return (b.percentage || 0) - (a.percentage || 0);
                })
                .map((submission, index) => {
                  const isNew = submission.submitted_at && 
                    (Date.now() - new Date(submission.submitted_at).getTime()) < 30000;
                  
                  return (
                    <div
                      key={submission.student_id || index}
                      className={`p-4 rounded-xl bg-gradient-to-r from-white/60 to-blue-50/60 border ${
                        isNew ? 'border-green-400 border-2 shadow-lg animate-pulse' : 'border-white/30'
                      } hover:shadow-soft transition-all duration-200`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">
                              Student: {submission.student_id || `Student ${index + 1}`}
                            </h3>
                            {isNew && (
                              <Badge className="bg-green-500 text-white animate-bounce">
                                New!
                              </Badge>
                            )}
                            <Badge
                              variant={
                                (submission.percentage || 0) >= 90
                                  ? 'default'
                                  : (submission.percentage || 0) >= 70
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className={
                                (submission.percentage || 0) >= 90
                                  ? 'bg-green-500'
                                  : (submission.percentage || 0) >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }
                            >
                              {submission.percentage?.toFixed(1) || 0}%
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'Recently'}
                            </span>
                            {submission.evaluation && (
                              <>
                                <span className="flex items-center">
                                  <TrendingUp className="h-4 w-4 mr-1" />
                                  {submission.evaluation.question_results?.filter(q => q.is_correct).length || 0} / {submission.evaluation.question_results?.length || 0} correct
                                </span>
                                {submission.evaluation.total_marks && (
                                  <span className="flex items-center">
                                    <FileText className="h-4 w-4 mr-1" />
                                    {submission.evaluation.total_score || 0} / {submission.evaluation.total_marks} marks
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          {submission.evaluation && submission.evaluation.question_results && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs font-semibold mb-2">Question-wise Analysis:</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {submission.evaluation.question_results.slice(0, 8).map((q, qIdx) => (
                                  <div key={qIdx} className={`p-2 rounded text-xs ${q.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    Q{q.q_index || qIdx + 1}: {q.is_correct ? '✓' : '✗'} ({q.marks_obtained || 0}/{q.marks || 0})
                                  </div>
                                ))}
                                {submission.evaluation.question_results.length > 8 && (
                                  <div className="p-2 rounded text-xs bg-gray-100 text-gray-600">
                                    +{submission.evaluation.question_results.length - 8} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setTeacherFeedback(submission.teacher_feedback || '');
                                  setUpdatedPercentage(submission.percentage || 0);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Submission Details</DialogTitle>
                                <DialogDescription>
                                  Student: {submission.student_id || `Student ${index + 1}`}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                {/* Submission Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Score</Label>
                                    <p className="text-2xl font-bold">{submission.percentage?.toFixed(1) || 0}%</p>
                                  </div>
                                  <div>
                                    <Label>Submitted At</Label>
                                    <p>{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Recently'}</p>
                                  </div>
                                </div>

                                {/* Answers and Evaluation */}
                                {submission.answers && paper && (
                                  <div className="space-y-4">
                                    <h4 className="font-semibold">Student Answers & Evaluation</h4>
                                    {submission.answers.map((answer, ansIdx) => {
                                      const question = paper.questions?.[answer.q_index - 1];
                                      const evalResult = submission.evaluation?.question_results?.find(q => q.q_index === answer.q_index) || 
                                                         submission.evaluation?.details?.find(q => q.q_index === answer.q_index);
                                      
                                      return (
                                        <Card key={ansIdx} className="p-4">
                                          <div className="flex items-start justify-between mb-2">
                                            <Badge>Question {answer.q_index}</Badge>
                                            <Badge variant={evalResult?.is_correct ? 'default' : 'destructive'}>
                                              {evalResult?.is_correct ? 'Correct' : 'Incorrect'}
                                            </Badge>
                                          </div>
                                          <div className="mb-2">
                                            <Label className="text-sm font-semibold">Question:</Label>
                                            <p className="text-sm">{question?.question || 'N/A'}</p>
                                          </div>
                                          <div className="mb-2">
                                            <Label className="text-sm font-semibold">Student Answer:</Label>
                                            <p className="text-sm bg-gray-50 p-2 rounded">{answer.student_answer || 'No answer provided'}</p>
                                          </div>
                                          {evalResult && (
                                            <div className="mt-2">
                                              <div className="flex items-center justify-between text-sm">
                                                <span>Marks: {evalResult.marks_obtained || 0} / {evalResult.marks || question?.marks || 0}</span>
                                                {evalResult.feedback && (
                                                  <span className="text-muted-foreground">{evalResult.feedback}</span>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </Card>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Teacher Evaluation Section */}
                                {user?.role === 'teacher' && (
                                  <Card className="p-4 border-2">
                                    <h4 className="font-semibold mb-4 flex items-center">
                                      <Edit className="h-4 w-4 mr-2" />
                                      Teacher Evaluation
                                    </h4>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="updated-percentage">Updated Percentage</Label>
                                        <Input
                                          id="updated-percentage"
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={updatedPercentage}
                                          onChange={(e) => setUpdatedPercentage(parseFloat(e.target.value) || 0)}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="teacher-feedback">Teacher Feedback</Label>
                                        <Textarea
                                          id="teacher-feedback"
                                          placeholder="Add your feedback for this student..."
                                          value={teacherFeedback}
                                          onChange={(e) => setTeacherFeedback(e.target.value)}
                                          className="mt-1 min-h-[100px]"
                                        />
                                      </div>
                                      <Button
                                        onClick={() => handleEvaluateSubmission(submission)}
                                        disabled={isEvaluating}
                                        className="w-full"
                                      >
                                        {isEvaluating ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Updating...
                                          </>
                                        ) : (
                                          <>
                                            <Star className="h-4 w-4 mr-2" />
                                            Update Evaluation
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </Card>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
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
