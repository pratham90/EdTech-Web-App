import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Textarea } from '../../../shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { Badge } from '../../../shared/components/ui/badge';
import { 
  FileText, 
  Target, 
  Lightbulb, 
  Clock, 
  MessageSquare, 
  BookOpen, 
  Calendar,
  Download,
  Upload,
  Wand2,
  CheckCircle,
  Shield
} from 'lucide-react';
import { PlagiarismChecker } from '../../plagiarism';
import { toast } from 'sonner';
import api from '../../../services/api';

export function Assignments() {
  const [assignmentType, setAssignmentType] = useState('homework');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssignment, setGeneratedAssignment] = useState(null);
  const [teachingQuery, setTeachingQuery] = useState('');
  const [teachingResponse, setTeachingResponse] = useState(null);
  const [isAskingAI, setIsAskingAI] = useState(false);

  const handleGenerateAssignment = async () => {
    if (!subject.trim() || !topic.trim()) {
      toast.error('Please fill in subject and topic');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.generatePaper(
        `${subject} - ${topic}`,
        assignmentType === 'homework' ? 'Assignment' : assignmentType === 'practice' ? 'Practice Test' : 'Project',
        numQuestions,
        [2, 5],
        difficulty
      );

      if (result.paper) {
        setGeneratedAssignment(result.paper);
        toast.success('Assignment generated successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate assignment');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAskTeachingAssistant = async () => {
    if (!teachingQuery.trim()) {
      toast.error('Please enter your question');
      return;
    }

    setIsAskingAI(true);
    try {
      const result = await api.askTeachingAssistant(teachingQuery);
      if (result.response) {
        setTeachingResponse(result.response);
        toast.success('Got response from teaching assistant!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to get response');
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleDownloadAssignment = async () => {
    if (generatedAssignment?._id) {
      try {
        await api.downloadPaper(generatedAssignment._id);
        toast.success('Assignment downloaded!');
      } catch (error) {
        toast.error(error.message || 'Failed to download assignment');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Creator */}
        <Card className="glass-effect border-white/20 shadow-soft-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span>Assignment Creator</span>
            </CardTitle>
            <CardDescription>Generate homework and practice sheets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Assignment Type</Label>
                <Select value={assignmentType} onValueChange={setAssignmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homework">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Homework Sheet
                      </div>
                    </SelectItem>
                    <SelectItem value="practice">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Practice Worksheet
                      </div>
                    </SelectItem>
                    <SelectItem value="project">
                      <div className="flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Project Assignment
                      </div>
                    </SelectItem>
                    <SelectItem value="timed">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Timed Exercise
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Mathematics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Calculus"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Number of Questions</Label>
                  <Select value={numQuestions.toString()} onValueChange={(v) => setNumQuestions(parseInt(v))}>
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

                <div>
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateAssignment}
                disabled={isGenerating || !subject.trim() || !topic.trim()}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Assignment
                  </>
                )}
              </Button>
            </div>

            {generatedAssignment && (
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{generatedAssignment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {generatedAssignment.questions?.length || 0} questions • {generatedAssignment.total_marks} marks
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleDownloadAssignment}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teaching Assistant */}
        <Card className="glass-effect border-white/20 shadow-soft-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-secondary rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span>Teaching Assistant</span>
            </CardTitle>
            <CardDescription>AI-powered teaching help</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="teaching-query">Ask a Question</Label>
                <Textarea
                  id="teaching-query"
                  placeholder="e.g., How can I make thermodynamics more engaging for students?"
                  value={teachingQuery}
                  onChange={(e) => setTeachingQuery(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button
                onClick={handleAskTeachingAssistant}
                disabled={isAskingAI || !teachingQuery.trim()}
                className="w-full bg-gradient-secondary hover:opacity-90"
              >
                {isAskingAI ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Thinking...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ask AI Assistant
                  </>
                )}
              </Button>
            </div>

            {teachingResponse && (
              <div className="pt-4 border-t">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-2">AI Response:</p>
                      <p className="text-sm text-blue-700 whitespace-pre-wrap">{teachingResponse}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Quick Actions:</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setTeachingQuery('How can I make this topic more engaging?')}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Get Activity Ideas
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setTeachingQuery('Generate examples for this topic')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Generate Examples
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setTeachingQuery('Create a lesson plan for this topic')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Plan Lessons
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plagiarism Checker Section */}
      <PlagiarismChecker />
    </div>
  );
}


