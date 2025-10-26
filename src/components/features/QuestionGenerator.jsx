import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Brain, Upload, Mic, FileText, Download, Wand2, CheckCircle, AlertCircle, Copy, Shuffle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function QuestionGenerator() {
  const [inputMethod, setInputMethod] = useState('text');
  const [topic, setTopic] = useState('');
  const [questionType, setQuestionType] = useState('mcq');
  const [difficulty, setDifficulty] = useState('medium');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [marks, setMarks] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  // Mock questions
  const mockQuestions = [
    {
      id: '1',
      type: 'mcq',
      question: 'What is the first law of thermodynamics?',
      options: [
        'Energy cannot be created or destroyed, only transferred',
        'Entropy of a closed system always increases',
        'Heat flows from hot to cold objects',
        'Work done by a system equals heat added minus change in internal energy'
      ],
      correctAnswer: 'Energy cannot be created or destroyed, only transferred',
      marks: 2,
      difficulty: 'medium',
      topic: 'Thermodynamics',
      explanation: 'The first law of thermodynamics is a statement of conservation of energy.'
    },
    {
      id: '2',
      type: 'short',
      question: 'Explain the concept of enthalpy in thermodynamics.',
      marks: 5,
      difficulty: 'medium',
      topic: 'Thermodynamics',
      explanation: 'Enthalpy is a thermodynamic property that represents the total heat content of a system.'
    },
    {
      id: '3',
      type: 'long',
      question: 'Derive the relationship between work done and heat transfer in a cyclic process. Discuss its significance in heat engines.',
      marks: 10,
      difficulty: 'hard',
      topic: 'Thermodynamics',
      explanation: 'This question tests understanding of thermodynamic cycles and their applications.'
    }
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic or upload syllabus content');
      return;
    }

    setIsGenerating(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGeneratedQuestions(mockQuestions.slice(0, numberOfQuestions));
    setIsGenerating(false);
    toast.success(`Generated ${numberOfQuestions} questions successfully!`);
  };

  const handleCopyQuestion = (question) => {
    const questionText = `${question.question}\n${question.options ? question.options.map((opt, i) => `${String.fromCharCode(97 + i)}) ${opt}`).join('\n') : ''}`;
    navigator.clipboard.writeText(questionText);
    toast.success('Question copied to clipboard!');
  };

  const handleDownloadQuestions = () => {
    const questionsPaper = generatedQuestions.map((q, i) => 
      `${i + 1}. ${q.question} (${q.marks} marks)\n${q.options ? q.options.map((opt, j) => `   ${String.fromCharCode(97 + j)}) ${opt}`).join('\n') : ''}\n\n`
    ).join('');
    
    const blob = new Blob([questionsPaper], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions-${topic.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Questions downloaded successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span>AI Question Generator</span>
          </CardTitle>
          <CardDescription>
            Generate high-quality questions using AI based on your syllabus content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Method Selection */}
          <div className="space-y-4">
            <Label>Choose Input Method</Label>
            <RadioGroup value={inputMethod} onValueChange={setInputMethod}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200 cursor-pointer group">
                  <RadioGroupItem value="text" id="text-input" />
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="text-input" className="cursor-pointer font-medium">Text Input</Label>
                    <p className="text-xs text-muted-foreground">Type your topic or content</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-200 transition-all duration-200 cursor-pointer group">
                  <RadioGroupItem value="upload" id="upload-input" />
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Upload className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="upload-input" className="cursor-pointer font-medium">File Upload</Label>
                    <p className="text-xs text-muted-foreground">Upload PDF, DOC, or images</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-200 transition-all duration-200 cursor-pointer group">
                  <RadioGroupItem value="voice" id="voice-input" />
                  <div className="p-2 bg-gradient-success rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Mic className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="voice-input" className="cursor-pointer font-medium">Voice Input</Label>
                    <p className="text-xs text-muted-foreground">Speak your requirements</p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Content Input */}
          {inputMethod === 'text' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Topic or Subject Content</Label>
                <Textarea
                  id="topic"
                  placeholder="Enter the topic or paste your syllabus content here..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[120px] bg-white/50 backdrop-blur border-white/30"
                />
              </div>
            </div>
          )}

          {inputMethod === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="mb-2">Upload Syllabus File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Support for PDF, DOC, DOCX, and images with OCR
                </p>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>
          )}

          {inputMethod === 'voice' && (
            <div className="space-y-4">
              <div className="text-center p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-white/30">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 w-fit">
                  <Mic className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-2">Voice Input</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click to start recording your topic or requirements
                </p>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Question Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="question-type">Question Type</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger className="bg-white/50 backdrop-blur border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="short">Short Answer</SelectItem>
                  <SelectItem value="long">Long Answer</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                  <SelectItem value="mixed">Mixed Types</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-white/50 backdrop-blur border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="mixed">Mixed Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="number-questions">Number of Questions</Label>
              <Select value={numberOfQuestions.toString()} onValueChange={(value) => setNumberOfQuestions(parseInt(value))}>
                <SelectTrigger className="bg-white/50 backdrop-blur border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                  <SelectItem value="25">25 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="marks">Marks per Question</Label>
              <Select value={marks.toString()} onValueChange={(value) => setMarks(parseInt(value))}>
                <SelectTrigger className="bg-white/50 backdrop-blur border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Mark</SelectItem>
                  <SelectItem value="2">2 Marks</SelectItem>
                  <SelectItem value="5">5 Marks</SelectItem>
                  <SelectItem value="10">10 Marks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !topic.trim()} 
            className="w-full bg-gradient-primary hover:opacity-90 shadow-soft transition-all duration-200 hover:shadow-soft-lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Questions...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <Card className="glass-effect border-white/20 shadow-soft-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-success rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span>Generated Questions</span>
                </CardTitle>
                <CardDescription>
                  {generatedQuestions.length} questions generated for "{topic}"
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleDownloadQuestions}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <Shuffle className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {generatedQuestions.map((question, index) => (
                <div key={question.id} className="p-6 rounded-xl bg-gradient-to-r from-white/60 to-indigo-50/60 border border-white/30 hover:shadow-soft transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gradient-primary text-white">
                        Q{index + 1}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {question.type.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {question.difficulty}
                      </Badge>
                      <Badge variant="secondary">
                        {question.marks} marks
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyQuestion(question)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="font-medium text-lg">{question.question}</p>
                    
                    {question.options && (
                      <div className="ml-4 space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {String.fromCharCode(97 + optIndex)}.)
                            </span>
                            <span className={option === question.correctAnswer ? 'text-green-600 font-medium' : ''}>
                              {option}
                              {option === question.correctAnswer && (
                                <CheckCircle className="h-4 w-4 inline ml-2 text-green-600" />
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.explanation && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">Explanation</p>
                            <p className="text-sm text-blue-700">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
