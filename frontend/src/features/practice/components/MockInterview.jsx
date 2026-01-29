import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Progress } from '../../../shared/components/ui/progress';
import { Separator } from '../../../shared/components/ui/separator';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Input } from '../../../shared/components/ui/input';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff,
  User,
  Brain,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  TrendingUp,
  MessageSquare,
  RotateCcw,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export function MockInterview() {
  const { user } = useAuth();
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showTopicInput, setShowTopicInput] = useState(false);

  useEffect(() => {
    let interval;
    if (isRecording && isInterviewStarted) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording, isInterviewStarted]);

  const startInterview = async (type) => {
    try {
      // For domain-specific, require topic selection
      if (type === 'domain-specific' && !selectedTopic.trim()) {
        setShowTopicInput(true);
        toast.error('Please enter a topic for domain-specific interview');
        return;
      }
      
      setIsRecording(true);
      const subject = type === 'technical' 
        ? 'Computer Science' 
        : type === 'hr' 
        ? 'General Interview' 
        : selectedTopic.trim() || 'Domain Specific';
      const difficulty = 'Medium';
      
      const result = await api.startInterview(subject, difficulty);
      
      setCurrentSession({
        type,
        subject,
        sessionId: result.session_id,
        currentQuestion: result.question,
        questionIndex: 0,
        history: []
      });
      setIsInterviewStarted(true);
      setShowTopicInput(false);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} Interview Started`);
    } catch (error) {
      toast.error(error.message || 'Failed to start interview');
      setIsRecording(false);
    }
  };

  const endInterview = async () => {
    if (!currentSession) return;
    
    setIsSubmitting(true);
    try {
      // Calculate final feedback
      const avgScore = interviewHistory.length > 0
        ? interviewHistory.reduce((sum, entry) => sum + (entry.score || 0), 0) / interviewHistory.length
        : 0;
      const overallScore = Math.round(avgScore * 100);
      
      const strengths = interviewHistory
        .filter(e => (e.score || 0) > 0.7)
        .map(e => e.feedback || 'Good answer structure')
        .slice(0, 3);
      
      const improvements = interviewHistory
        .filter(e => (e.score || 0) < 0.5)
        .map(e => e.feedback || 'Need more detail')
        .slice(0, 3);
      
      setFeedback({
        overallScore,
        strengths: strengths.length > 0 ? strengths : ['Keep practicing to improve'],
        improvements: improvements.length > 0 ? improvements : ['Great job overall!'],
        analysis: {
          communication: Math.round(avgScore * 100),
          technical: Math.round(avgScore * 100),
          confidence: Math.round(avgScore * 100),
          bodyLanguage: Math.round(avgScore * 100)
        },
        history: interviewHistory
      });
      
      // Save interview progress
      if (user?._id) {
        try {
          await api.saveProgress(
            user._id,
            `interview_${currentSession.type}_${Date.now()}`,
            overallScore,
            {
              type: 'interview',
              interview_type: currentSession.type,
              subject: currentSession.subject,
              total_questions: interviewHistory.length,
              average_score: overallScore,
              history: interviewHistory
            }
          );
        } catch (saveError) {
          console.error('Failed to save interview progress:', saveError);
        }
      }
      
      setIsRecording(false);
      setShowFeedback(true);
      toast.success('Interview ended. Generating feedback...');
    } catch (error) {
      toast.error(error.message || 'Failed to end interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast.error('Please enter your answer');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.submitInterviewAnswer(
        currentSession.sessionId,
        currentAnswer
      );

      const newHistoryEntry = {
        question: currentSession.currentQuestion,
        answer: currentAnswer,
        feedback: result.feedback,
        score: result.score,
        similarity: result.similarity
      };

      const updatedHistory = [...interviewHistory, newHistoryEntry];
      setInterviewHistory(updatedHistory);

      if (result.next_question) {
        setCurrentSession({
          ...currentSession,
          currentQuestion: result.next_question,
          questionIndex: currentSession.questionIndex + 1,
          history: updatedHistory
        });
        setCurrentAnswer('');
        toast.success('Answer submitted! Next question...');
      } else {
        // Interview completed - calculate feedback from history
        setIsRecording(false);
        const avgScore = updatedHistory.length > 0
          ? updatedHistory.reduce((sum, entry) => sum + (entry.score || 0), 0) / updatedHistory.length
          : 0;
        const overallScore = Math.round(avgScore * 100);
        
        const strengths = updatedHistory
          .filter(e => (e.score || 0) > 0.7)
          .map(e => e.feedback || 'Good answer structure')
          .slice(0, 3);
        
        const improvements = updatedHistory
          .filter(e => (e.score || 0) < 0.5)
          .map(e => e.feedback || 'Need more detail')
          .slice(0, 3);
        
        setFeedback({
          overallScore,
          strengths: strengths.length > 0 ? strengths : ['Keep practicing to improve'],
          improvements: improvements.length > 0 ? improvements : ['Great job overall!'],
          analysis: {
            communication: Math.round(avgScore * 100),
            technical: Math.round(avgScore * 100),
            confidence: Math.round(avgScore * 100),
            bodyLanguage: Math.round(avgScore * 100)
          },
          history: updatedHistory
        });
        
        // Save interview progress when interview ends naturally
        if (user?._id) {
          try {
            await api.saveProgress(
              user._id,
              `interview_${currentSession.type}_${Date.now()}`,
              overallScore,
              {
                type: 'interview',
                interview_type: currentSession.type,
                subject: currentSession.subject,
                total_questions: updatedHistory.length,
                average_score: overallScore,
                history: updatedHistory
              }
            );
          } catch (saveError) {
            console.error('Failed to save interview progress:', saveError);
          }
        }
        
        setShowFeedback(true);
        toast.success('Interview Completed! Generating Feedback...');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetInterview = () => {
    setIsInterviewStarted(false);
    setCurrentSession(null);
    setIsRecording(false);
    setTimeElapsed(0);
    setShowFeedback(false);
    setCurrentAnswer('');
    setInterviewHistory([]);
    setFeedback(null);
    setSelectedTopic('');
    setShowTopicInput(false);
    toast('Interview session reset');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isInterviewStarted) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-indigo-900/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <Brain className="w-6 h-6 text-indigo-600" /> Mock Interview Practice
            </CardTitle>
            <CardDescription>
              Choose an interview type and start practicing with AI-powered feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showTopicInput && (
              <Card className="border-2 border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enter Topic for Domain-Specific Interview:</label>
                    <Input
                      type="text"
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      placeholder="e.g., Machine Learning, Web Development, Data Structures"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && selectedTopic.trim()) {
                          startInterview('domain-specific');
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => startInterview('domain-specific')}
                        disabled={!selectedTopic.trim()}
                        size="sm"
                      >
                        Start Interview
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowTopicInput(false);
                          setSelectedTopic('');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid md:grid-cols-3 gap-4">
              {['technical', 'hr', 'domain-specific'].map((type) => (
                <Card 
                  key={type} 
                  className="border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    if (type === 'domain-specific') {
                      setShowTopicInput(true);
                    } else {
                      startInterview(type);
                    }
                  }}
                >
                  <CardHeader>
                    <CardTitle className="capitalize flex items-center gap-2">
                      {type === 'technical' && <Brain className="w-5 h-5 text-indigo-500" />}
                      {type === 'hr' && <User className="w-5 h-5 text-pink-500" />}
                      {type === 'domain-specific' && <Award className="w-5 h-5 text-amber-500" />}
                      {type.replace('-', ' ')} Interview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {type === 'technical' && 'Test your technical problem-solving and coding concepts.'}
                      {type === 'hr' && 'Practice communication and personality-based questions.'}
                      {type === 'domain-specific' && 'Assess your domain expertise and analytical skills.'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showFeedback && feedback) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-emerald-900/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-green-600">
              <CheckCircle className="w-6 h-6" /> Interview Feedback
            </CardTitle>
            <CardDescription>Your AI-based performance analysis and recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" /> Overall Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl font-bold">{feedback.overallScore}%</span>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Excellent</Badge>
                  </div>
                  <Progress value={feedback.overallScore} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" /> Category Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(feedback.analysis).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="capitalize">{key}</span>
                        <span className="font-medium">{value}%</span>
                      </div>
                      <Progress value={value} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" /> Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {feedback.strengths && feedback.strengths.length > 0 ? (
                    feedback.strengths.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 border-green-300">+ </Badge> {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific strengths identified</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-5 h-5" /> Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {feedback.improvements && feedback.improvements.length > 0 ? (
                    feedback.improvements.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300">•</Badge> {item}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Great job! Keep it up!</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={resetInterview} className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Start New Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-indigo-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <MessageSquare className="w-6 h-6 text-indigo-600" /> {currentSession?.type.replace('-', ' ')} Interview
          </CardTitle>
          <CardDescription>Answer the questions confidently. Submit your answer to proceed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-300">
              <Clock className="w-4 h-4 mr-1" /> {formatTime(timeElapsed)}
            </Badge>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsMicEnabled(!isMicEnabled)}>
                {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-500" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setIsVideoEnabled(!isVideoEnabled)}>
                {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-red-500" />}
              </Button>
              <Button 
                variant="destructive" 
                onClick={endInterview}
                disabled={isSubmitting}
                className="ml-2"
              >
                End Interview
              </Button>
            </div>
          </div>

          <Separator />

          <div className="p-4 bg-white/70 dark:bg-slate-800/40 rounded-xl shadow-inner border">
            <h3 className="text-lg font-medium mb-3">
              Question {currentSession?.questionIndex + 1}
            </h3>
            <p className="text-lg">{currentSession?.currentQuestion}</p>
          </div>

          <div className="space-y-3">
            <Textarea
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="min-h-[150px]"
            />
            <Button 
              onClick={handleSubmitAnswer} 
              disabled={isSubmitting || !currentAnswer.trim()}
              className="w-full flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Answer
                </>
              )}
            </Button>
          </div>

          {interviewHistory.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">Previous Answers:</h4>
              {interviewHistory.map((entry, idx) => (
                <div key={idx} className="p-3 bg-white/50 rounded-lg border">
                  <p className="text-sm font-medium">Q{idx + 1}: {entry.question}</p>
                  <p className="text-sm text-muted-foreground mt-1">Your answer: {entry.answer}</p>
                  {entry.feedback && (
                    <p className="text-sm text-blue-600 mt-1">Feedback: {entry.feedback}</p>
                  )}
                  {entry.score !== undefined && (
                    <Badge className="mt-1">Score: {Math.round(entry.score * 100)}%</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

