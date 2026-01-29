import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Badge } from '../../../shared/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '../../../shared/components/ui/radio-group';
import { Label } from '../../../shared/components/ui/label';
import { Progress } from '../../../shared/components/ui/progress';
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Send,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export function TakeTest({ assignment, paper: initialPaper, onBack, onComplete }) {
  const { user } = useAuth();
  const [paper, setPaper] = useState(initialPaper);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [loading, setLoading] = useState(!initialPaper);
  const [submitted, setSubmitted] = useState(false); // Track if already submitted

  useEffect(() => {
    // Only load paper if we don't have it and we have an assignment
    // Use a ref to prevent multiple loads
    if (!initialPaper && assignment?.paper_id && !loading) {
      loadPaper();
    }
  }, [assignment?.paper_id]); // Only depend on paper_id, not the whole assignment object

  const loadPaper = async () => {
    setLoading(true);
    try {
      const response = await api.getPaper(assignment.paper_id);
      if (response.paper) {
        setPaper(response.paper);
      } else {
        toast.error('Failed to load test paper');
        onBack();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load test paper');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < (paper?.questions?.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (submitted || submitting || evaluating) {
      return;
    }
    
    if (!confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
      return;
    }

    setSubmitting(true);
    setSubmitted(true); // Mark as submitted to prevent resubmission
    try {
      // Format answers for evaluation
      const formattedAnswers = Object.entries(answers).map(([index, answer]) => ({
        q_index: parseInt(index) + 1, // 1-based index
        student_answer: answer
      }));

      // Evaluate the test with retry logic and progress feedback
      let evaluation;
      let evalRetries = 0;
      const maxEvalRetries = 1; // Reduced retries since we have fallback
      let evalSuccess = false;
      
      // Show initial progress message and set evaluating state
      setEvaluating(true);
      toast.info('Evaluating your test... This may take a moment.', {
        duration: 5000,
      });
      
      while (!evalSuccess && evalRetries <= maxEvalRetries) {
        try {
          // Set a longer timeout for evaluation (90 seconds)
          const startTime = Date.now();
          evaluation = await Promise.race([
            api.evaluateStudent(
              user._id,
              assignment.paper_id,
              paper,
              formattedAnswers
            ),
            // Add a timeout promise that rejects after 90 seconds
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Evaluation timeout')), 90000)
            )
          ]);
          
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`Evaluation completed in ${elapsed}s`);
          evalSuccess = true;
          setEvaluating(false);
        } catch (evalError) {
          evalRetries++;
          console.error(`Evaluation error (attempt ${evalRetries}):`, evalError);
          
          if (evalRetries > maxEvalRetries) {
            const errorMsg = evalError.message || '';
            if (errorMsg.includes('timeout') || errorMsg.includes('Evaluation timeout')) {
              // Don't throw - let the fallback handle it
              console.warn('Evaluation timed out, but submission will continue with basic scoring');
              // Create a basic evaluation result
              evaluation = {
                evaluation: {
                  total_marks: paper.total_marks || 0,
                  total_score: 0,
                  percentage: 0,
                  details: formattedAnswers.map((ans, idx) => ({
                    q_index: ans.q_index,
                    question: paper.questions?.[ans.q_index - 1]?.question || '',
                    student_answer: ans.student_answer,
                    score_awarded: 0,
                    feedback: 'Evaluation timed out - please contact your teacher',
                    marks: paper.questions?.[ans.q_index - 1]?.marks || 0
                  }))
                }
              };
              evalSuccess = true; // Continue with basic evaluation
              setEvaluating(false);
              toast.warning('Evaluation took too long. Your test will be submitted with basic scoring. Please contact your teacher for detailed feedback.');
            } else if (errorMsg.includes('unavailable')) {
              throw new Error('AI evaluation service is temporarily unavailable. Please try again later.');
            } else {
              throw new Error(`Failed to evaluate test: ${errorMsg || 'Unknown error'}. Please try again.`);
            }
          } else {
            // Wait before retry with progress message
            toast.info(`Retrying evaluation... (attempt ${evalRetries + 1})`, {
              duration: 3000,
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }
      
      // Normalize evaluation structure - handle different response formats
      let evaluationData = evaluation;
      if (evaluation && evaluation.evaluation) {
        evaluationData = evaluation.evaluation;
      } else if (evaluation && evaluation.status === 'success' && evaluation.evaluation) {
        evaluationData = evaluation.evaluation;
      }
      
      // Ensure evaluation object exists
      if (!evaluationData || !evaluationData.percentage) {
        // Try to calculate percentage if not present
        if (evaluationData && evaluationData.total_marks && evaluationData.total_score !== undefined) {
          evaluationData.percentage = (evaluationData.total_score / evaluationData.total_marks) * 100;
        } else {
          throw new Error('Invalid evaluation response. Please try again.');
        }
      }
      
      // Use normalized evaluation data
      evaluation = evaluationData;

      // Save progress with proper metadata - ensure it's saved
      if (evaluation.percentage !== undefined) {
        // Include assignment metadata for better progress tracking
        const progressData = {
          ...evaluation,
          assignment_id: assignment._id,
          paper_id: assignment.paper_id,
          paper_title: assignment.paper_title || paper.title || 'Assignment',
          type: 'assignment',
          exam_type: paper.exam_type || 'Assignment',
          topic: paper.title || assignment.paper_title || 'Assignment',
          difficulty: paper.difficulty || 'Medium',
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        
        // Save progress - try to save but don't block submission
        api.saveProgress(
          user._id,
          assignment._id,
          evaluation.percentage,
          progressData
        ).then(() => {
          console.log('✅ Progress saved successfully for assignment:', assignment._id);
        }).catch((progressError) => {
          console.error('❌ Failed to save progress:', progressError);
          // Log error but don't block submission
          toast.error('Progress may not be saved. Please refresh the dashboard.');
        });
      }

      // Submit to assignment with retry logic
      let submissionSuccess = false;
      let retries = 0;
      const maxRetries = 2;
      
      while (!submissionSuccess && retries <= maxRetries) {
        try {
          await api.submitAssignment(
            assignment._id,
            user._id,
            formattedAnswers,
            evaluation,
            evaluation.percentage || 0
          );
          submissionSuccess = true;
        } catch (submitError) {
          retries++;
          if (retries > maxRetries) {
            // Check if it's a MongoDB connection error
            const errorMsg = submitError.message || '';
            if (errorMsg.includes('MongoDB') || errorMsg.includes('connection') || errorMsg.includes('timeout')) {
              throw new Error('Database connection issue. Your answers have been saved locally. Please try submitting again in a moment.');
            }
            throw new Error(submitError.message || 'Failed to submit test. Please try again.');
          }
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      // Show success message
      toast.success(`Test submitted successfully! Score: ${evaluation.percentage || 0}%`, {
        duration: 3000,
      });
      
      // Wait a moment to show success message, then navigate back
      // This prevents the page from refreshing or resetting
      setTimeout(() => {
        // Call onComplete first to update the parent state
        if (onComplete) {
          try {
            onComplete();
          } catch (error) {
            console.error('Error in onComplete:', error);
          }
        }
        // Small delay before going back to ensure state updates properly
        setTimeout(() => {
          if (onBack) {
            onBack();
          }
        }, 200);
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error.message || 'Failed to submit test';
      setEvaluating(false);
      
      // Show more helpful error message
      if (errorMessage.includes('MongoDB') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
        toast.error('Database connection issue. Please check your internet connection and try again. Your answers are saved locally.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
      setEvaluating(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!paper || !paper.questions) {
    return (
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Paper not found</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  const questions = paper.questions || [];
  const currentQ = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{paper.title || 'Test'}</CardTitle>
              <CardDescription>
                Question {currentQuestion + 1} of {questions.length}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress: {answeredCount} / {questions.length} answered</span>
              <span>Total Marks: {paper.total_marks || 0}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">Question {currentQuestion + 1}</Badge>
                <Badge>{currentQ.marks || 0} marks</Badge>
              </div>
              <h3 className="text-lg font-semibold mb-4">{currentQ.question}</h3>
            </div>

            {/* Answer Input */}
            <div className="space-y-4">
              {currentQ.type === 'MCQ' && currentQ.options ? (
                <RadioGroup
                  value={answers[currentQuestion] || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion, value)}
                >
                  {currentQ.options.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value={String.fromCharCode(65 + idx)} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                        {String.fromCharCode(65 + idx)}) {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                  className="min-h-[150px]"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-8 h-8 rounded-full text-sm ${
                    idx === currentQuestion
                      ? 'bg-primary text-white'
                      : answers[idx]
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitted || submitting || evaluating || answeredCount === 0}
                className="bg-gradient-primary hover:opacity-90"
              >
                {evaluating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Evaluating...
                  </>
                ) : submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : submitted ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submitted
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Test
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentQuestion === questions.length - 1}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


