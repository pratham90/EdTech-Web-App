import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Badge } from '../../../shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Progress } from '../../../shared/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  RotateCcw,
  Award,
  TrendingUp,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export function MockTest() {
  const { user } = useAuth();
  const [testConfig, setTestConfig] = useState({
    topic: '',
    examType: 'University Exam',
    difficulty: 'medium',
    questionType: 'mixed',
    numQuestions: 5
  });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isTestActive, setIsTestActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [results, setResults] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (isTestActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTestActive, timeRemaining]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStartTest = async () => {
    if (!testConfig.topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.generateQuestions(
        testConfig.topic,
        testConfig.examType,
        testConfig.difficulty,
        testConfig.questionType,
        testConfig.numQuestions
      );

      if (result.questions && Array.isArray(result.questions)) {
        setQuestions(result.questions);
        setAnswers({});
        setIsTestActive(true);
        setCurrentQuestionIndex(0);
        setTimeRemaining(testConfig.numQuestions * 60); // 1 minute per question
        setResults(null);
        toast.success('Test started! Good luck!');
      } else {
        toast.error('Failed to generate questions');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to start test');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmitTest = async () => {
    if (questions.length === 0) return;

    setIsSubmitting(true);
    setIsTestActive(false);

    try {
      // Format answers for evaluation
      const formattedAnswers = questions.map((q, idx) => ({
        question: q.question,
        student_answer: answers[idx] || '',
        correct_answer: q.answer || '',
        marks: q.marks || 1,
        type: q.type || 'mcq'
      }));

      const evaluation = await api.evaluateMock(formattedAnswers);

      if (evaluation) {
        setResults(evaluation);
        
        // Save progress with topic information
        if (user?._id) {
          const percentage = evaluation.total_score 
            ? (evaluation.total_score / evaluation.total_marks) * 100 
            : 0;
          
          await api.saveProgress(
            user._id,
            `mock_test_${Date.now()}`,
            percentage,
            {
              ...evaluation,
              topic: testConfig.topic || 'Mock Test',
              type: 'mock_test',
              exam_type: testConfig.examType,
              difficulty: testConfig.difficulty
            }
          );
        }

        toast.success('Test submitted successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setAnswers({});
    setIsTestActive(false);
    setResults(null);
    setTimeRemaining(0);
    setCurrentQuestionIndex(0);
  };

  if (results) {
    const percentage = results.total_score 
      ? (results.total_score / results.total_marks) * 100 
      : 0;

    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Award className="w-6 h-6 text-green-600" />
              Test Results
            </CardTitle>
            <CardDescription>Your performance summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {percentage.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {results.total_score || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Out of {results.total_marks || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {results.correct_answers || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Correct Answers</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Question-wise Results</h3>
              {questions.map((q, idx) => {
                const answer = answers[idx] || '';
                const result = results.question_results?.[idx] || results.evaluation?.[idx] || {};
                const isCorrect = result.is_correct || false;
                const score = result.score || 0;
                const marks = result.marks || q.marks || 1;
                
                // Format the answer display
                let studentAnswerDisplay = answer || 'Not answered';
                let correctAnswerDisplay = q.answer || '';
                
                // If it's an MCQ, show the option text if available
                if (q.options && Array.isArray(q.options) && answer) {
                  const optionIndex = answer.toLowerCase().charCodeAt(0) - 97; // a=0, b=1, etc.
                  if (optionIndex >= 0 && optionIndex < q.options.length) {
                    studentAnswerDisplay = `${answer.toUpperCase()}) ${q.options[optionIndex]}`;
                  }
                }

                return (
                  <Card key={idx} className={isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-medium">Question {idx + 1}</span>
                        </div>
                        <Badge variant={isCorrect ? 'default' : 'destructive'}>
                          {score}/{marks}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-2">{q.question}</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Your Answer:</span> {studentAnswerDisplay}</p>
                        {correctAnswerDisplay && (
                          <p><span className="font-medium">Correct Answer:</span> {correctAnswerDisplay}</p>
                        )}
                        {result.feedback && (
                          <p className={isCorrect ? 'text-green-600' : 'text-blue-600'}>
                            <span className="font-medium">Feedback:</span> {result.feedback}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button onClick={handleReset} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Take Another Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isTestActive && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mock Test in Progress</CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-lg">
                  <Clock className="w-4 h-4 mr-2" />
                  {formatTime(timeRemaining)}
                </Badge>
                <Badge>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {currentQuestion.type || 'Mixed'}
                    </Badge>
                    {currentQuestion.marks && (
                      <Badge variant="outline" className="ml-2">
                        {currentQuestion.marks} marks
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-lg font-medium mb-4">{currentQuestion.question}</p>

                {currentQuestion.options && Array.isArray(currentQuestion.options) ? (
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, optIdx) => {
                      const optionLetter = String.fromCharCode(97 + optIdx);
                      const isSelected = answers[currentQuestionIndex] === option || 
                                       answers[currentQuestionIndex] === optionLetter;
                      
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleAnswerChange(currentQuestionIndex, optionLetter)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          <span className="font-medium mr-2">{optionLetter}.)</span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Textarea
                    placeholder="Type your answer here..."
                    value={answers[currentQuestionIndex] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                    className="min-h-[150px]"
                  />
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmitTest} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Test'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Mock Test
          </CardTitle>
          <CardDescription>
            Generate and take a practice test based on your topic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic or Subject</Label>
            <Textarea
              id="topic"
              placeholder="Enter the topic you want to test on..."
              value={testConfig.topic}
              onChange={(e) => setTestConfig({ ...testConfig, topic: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="exam-type">Exam Type</Label>
              <Select
                value={testConfig.examType}
                onValueChange={(value) => setTestConfig({ ...testConfig, examType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="School Exam">School Exam</SelectItem>
                  <SelectItem value="University Exam">University Exam</SelectItem>
                  <SelectItem value="Competitive Exam">Competitive Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={testConfig.difficulty}
                onValueChange={(value) => setTestConfig({ ...testConfig, difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="question-type">Question Type</Label>
              <Select
                value={testConfig.questionType}
                onValueChange={(value) => setTestConfig({ ...testConfig, questionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">MCQ</SelectItem>
                  <SelectItem value="short">Short Answer</SelectItem>
                  <SelectItem value="long">Long Answer</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="num-questions">Number of Questions</Label>
              <Select
                value={testConfig.numQuestions.toString()}
                onValueChange={(value) => setTestConfig({ ...testConfig, numQuestions: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleStartTest}
            disabled={isGenerating || !testConfig.topic.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Test...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Mock Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


