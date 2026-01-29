import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Badge } from '../../../shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/components/ui/select';
import { FileText, Download, Wand2, CheckCircle, Copy, List, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';

export function PaperGenerator() {
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('Midterm');
  const [numQuestions, setNumQuestions] = useState(8);
  const [difficulty, setDifficulty] = useState('Medium');
  const [marksDistribution, setMarksDistribution] = useState([2, 5]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState(null);
  const [papersList, setPapersList] = useState([]);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    try {
      const result = await api.listPapers();
      if (result.papers) {
        setPapersList(result.papers);
      }
    } catch (error) {
      console.error('Failed to load papers:', error);
    }
  };

  const handleGenerate = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.generatePaper(
        subject,
        examType,
        numQuestions,
        marksDistribution,
        difficulty
      );

      if (result.paper) {
        setGeneratedPaper(result.paper);
        toast.success('Question paper generated successfully!');
        loadPapers(); // Refresh list
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate paper');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (paperId) => {
    try {
      await api.downloadPaper(paperId);
      toast.success('Paper downloaded successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to download paper');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-white/20 shadow-soft-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span>Generate Question Paper</span>
          </CardTitle>
          <CardDescription>
            Create customized question papers with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Database Management Systems"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="exam-type">Exam Type</Label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Midterm">Midterm</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                  <SelectItem value="Practice Test">Practice Test</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="num-questions">Number of Questions</Label>
              <Select value={numQuestions.toString()} onValueChange={(value) => setNumQuestions(parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions</SelectItem>
                  <SelectItem value="8">8 Questions</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="mt-1">
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

          <div>
            <Label>Marks Distribution</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant={marksDistribution[0] === 2 ? "default" : "outline"}
                size="sm"
                onClick={() => setMarksDistribution([2, 5])}
              >
                2M, 5M
              </Button>
              <Button
                variant={marksDistribution[0] === 5 ? "default" : "outline"}
                size="sm"
                onClick={() => setMarksDistribution([5, 10])}
              >
                5M, 10M
              </Button>
              <Button
                variant={marksDistribution[0] === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setMarksDistribution([1, 2, 5])}
              >
                1M, 2M, 5M
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !subject.trim()}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Paper
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowList(!showList)}
            >
              <List className="h-4 w-4 mr-2" />
              {showList ? 'Hide' : 'Show'} Papers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Paper */}
      {generatedPaper && (
        <Card className="glass-effect border-white/20 shadow-soft-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-success rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span>{generatedPaper.title || 'Generated Paper'}</span>
                </CardTitle>
                <CardDescription>
                  Total Marks: {generatedPaper.total_marks || 'N/A'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    try {
                      const result = await api.sharePaper(generatedPaper._id);
                      if (result.shareable_link) {
                        const fullLink = window.location.origin + result.shareable_link;
                        navigator.clipboard.writeText(fullLink);
                        toast.success('Shareable link copied to clipboard!');
                      }
                    } catch (error) {
                      toast.error('Failed to generate share link');
                    }
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload(generatedPaper._id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedPaper.questions && generatedPaper.questions.map((q, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <Badge>Q{idx + 1}</Badge>
                    <div className="flex gap-2">
                      <Badge variant="outline">{q.type}</Badge>
                      <Badge variant="secondary">{q.marks} marks</Badge>
                    </div>
                  </div>
                  <p className="font-medium">{q.question}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Papers List */}
      {showList && (
        <Card className="glass-effect border-white/20 shadow-soft-lg">
          <CardHeader>
            <CardTitle>Previous Papers</CardTitle>
            <CardDescription>All generated question papers</CardDescription>
          </CardHeader>
          <CardContent>
            {papersList.length > 0 ? (
              <div className="space-y-2">
                {papersList.map((paper) => (
                  <div key={paper._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{paper.title || 'Untitled Paper'}</p>
                      <p className="text-sm text-muted-foreground">
                        Total Marks: {paper.total_marks || 'N/A'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                          try {
                            const result = await api.sharePaper(paper._id);
                            if (result.shareable_link) {
                              const fullLink = window.location.origin + result.shareable_link;
                              navigator.clipboard.writeText(fullLink);
                              toast.success('Shareable link copied to clipboard!');
                            }
                          } catch (error) {
                            toast.error('Failed to generate share link');
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(paper._id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No papers generated yet
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


