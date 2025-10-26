import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
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
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function MockInterview() {
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const questions = [
    { id: '1', question: 'Tell me about yourself.', category: 'HR', difficulty: 'Easy' },
    { id: '2', question: 'What is polymorphism in OOP?', category: 'Technical', difficulty: 'Medium' },
    { id: '3', question: 'How do you handle work pressure?', category: 'HR', difficulty: 'Medium' },
    { id: '4', question: 'Explain the concept of normalization in DBMS.', category: 'Technical', difficulty: 'Hard' },
    { id: '5', question: 'Why should we hire you?', category: 'HR', difficulty: 'Medium' },
    { id: '6', question: 'What are REST APIs?', category: 'Technical', difficulty: 'Easy' },
  ];

  const mockFeedback = {
    overallScore: 82,
    strengths: ['Good communication', 'Strong technical knowledge', 'Confident body language'],
    improvements: ['Reduce filler words', 'Provide more structured answers'],
    analysis: {
      communication: 85,
      technical: 80,
      confidence: 90,
      bodyLanguage: 75
    }
  };

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startInterview = (type) => {
    const randomQuestions = questions
      .filter(q => q.category.toLowerCase() === type)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    setCurrentSession({
      type,
      questions: randomQuestions,
      currentQuestion: 0
    });
    setIsInterviewStarted(true);
    setIsRecording(true);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} Interview Started`);
  };

  const handleNextQuestion = () => {
    if (currentSession && currentSession.currentQuestion < currentSession.questions.length - 1) {
      setCurrentSession({
        ...currentSession,
        currentQuestion: currentSession.currentQuestion + 1
      });
    } else {
      setIsRecording(false);
      setShowFeedback(true);
      toast.success('Interview Completed! Generating Feedback...');
    }
  };

  const resetInterview = () => {
    setIsInterviewStarted(false);
    setCurrentSession(null);
    setIsRecording(false);
    setTimeElapsed(0);
    setShowFeedback(false);
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
          <CardContent className="grid md:grid-cols-3 gap-4">
            {['technical', 'hr', 'domain-specific'].map((type) => (
              <Card 
                key={type} 
                className="border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                onClick={() => startInterview(type)}
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showFeedback) {
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
                    <span className="text-3xl font-bold">{mockFeedback.overallScore}%</span>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Excellent</Badge>
                  </div>
                  <Progress value={mockFeedback.overallScore} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" /> Category Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(mockFeedback.analysis).map(([key, value]) => (
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
                  {mockFeedback.strengths.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 border-green-300">+ </Badge> {item}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-5 h-5" /> Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mockFeedback.improvements.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-700 border-amber-300">•</Badge> {item}
                    </div>
                  ))}
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
          <CardDescription>Answer the questions confidently. Click “Next” to proceed.</CardDescription>
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
            </div>
          </div>

          <Separator />

          <div className="p-4 bg-white/70 dark:bg-slate-800/40 rounded-xl shadow-inner border">
            <h3 className="text-lg font-medium mb-3">
              Question {currentSession?.currentQuestion + 1} of {currentSession?.questions.length}
            </h3>
            <p className="text-lg">{currentSession?.questions[currentSession?.currentQuestion].question}</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleNextQuestion} className="flex items-center gap-2">
              Next <CheckCircle className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
