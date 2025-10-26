import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { QuestionGenerator } from '../features/QuestionGenerator';
import { 
  FileText, 
  Brain, 
  Users, 
  BookOpen, 
  Upload,
  Download,
  PenTool,
  Target,
  Lightbulb,
  MessageSquare,
  BarChart3,
  Calendar,
  Clock,
  Award
} from 'lucide-react';

export function TeacherDashboard() {
  const [totalStudents, setTotalStudents] = useState(156);
  const [questionsGenerated, setQuestionsGenerated] = useState(342);
  const [papersCreated, setPapersCreated] = useState(28);

  const recentPapers = [
    { subject: 'Mathematics - Calculus', type: 'Mid-term Exam', marks: 100, date: '2 days ago' },
    { subject: 'Physics - Thermodynamics', type: 'Assignment', marks: 50, date: '1 week ago' },
    { subject: 'Chemistry - Organic', type: 'Mock Test', marks: 75, date: '2 weeks ago' },
  ];

  const studentProgress = [
    { name: 'Class 12A', totalStudents: 45, avgScore: 87, improvement: '+5%' },
    { name: 'Class 12B', totalStudents: 42, avgScore: 82, improvement: '+2%' },
    { name: 'Class 11A', totalStudents: 38, avgScore: 79, improvement: '+8%' },
  ];

  const questionStats = [
    { type: 'MCQs', count: 156, difficulty: 'Mixed' },
    { type: 'Short Answer', count: 89, difficulty: 'Medium' },
    { type: 'Long Answer', count: 67, difficulty: 'Hard' },
    { type: 'Case Studies', count: 30, difficulty: 'Hard' },
  ];

  return (
    <div className="p-6 space-y-8 min-h-screen bg-background">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-effect border-white/20 shadow-soft hover:shadow-soft-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-secondary rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect border-white/20 shadow-soft hover:shadow-soft-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-primary rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questions Generated</p>
                <p className="text-3xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{questionsGenerated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect border-white/20 shadow-soft hover:shadow-soft-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-success rounded-xl group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Papers Created</p>
                <p className="text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{papersCreated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect border-white/20 shadow-soft hover:shadow-soft-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-accent rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Class Score</p>
                <p className="text-3xl bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">84%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 glass-effect border-white/20 shadow-soft p-1 rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white rounded-lg transition-all duration-200">Overview</TabsTrigger>
          <TabsTrigger value="generator" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white rounded-lg transition-all duration-200">Question Generator</TabsTrigger>
          <TabsTrigger value="papers" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white rounded-lg transition-all duration-200">Paper Creator</TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white rounded-lg transition-all duration-200">Assignments</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white rounded-lg transition-all duration-200">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Papers */}
            <Card className="glass-effect border-white/20 shadow-soft-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <span>Recent Question Papers</span>
                </CardTitle>
                <CardDescription>Your latest creations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPapers.map((paper, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/60 to-blue-50/60 border border-white/30 hover:shadow-soft transition-all duration-200">
                    <div>
                      <p className="font-medium">{paper.subject}</p>
                      <p className="text-sm text-muted-foreground">{paper.type} • {paper.marks} marks</p>
                      <p className="text-xs text-muted-foreground">{paper.date}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 text-white">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white">
                        <PenTool className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Student Progress */}
            <Card className="glass-effect border-white/20 shadow-soft-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <span>Class Performance</span>
                </CardTitle>
                <CardDescription>Student progress overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentProgress.map((classData, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/60 to-green-50/60 border border-white/30 hover:shadow-soft transition-all duration-200">
                    <div>
                      <p className="font-medium">{classData.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {classData.totalStudents} students • Avg: {classData.avgScore}%
                      </p>
                    </div>
                    <Badge className={classData.improvement.includes('+') ? 'bg-gradient-success text-white' : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'}>
                      {classData.improvement}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="glass-effect border-white/20 shadow-soft-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-accent rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Common tasks and tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="h-24 flex-col bg-gradient-primary hover:opacity-90 shadow-soft transition-all duration-200 hover:shadow-soft-lg group">
                  <Brain className="h-7 w-7 mb-2 group-hover:scale-110 transition-transform duration-200" />
                  Generate Questions
                </Button>
                <Button className="h-24 flex-col bg-gradient-secondary hover:opacity-90 shadow-soft transition-all duration-200 hover:shadow-soft-lg group">
                  <FileText className="h-7 w-7 mb-2 group-hover:scale-110 transition-transform duration-200" />
                  Create Paper
                </Button>
                <Button className="h-24 flex-col bg-gradient-success hover:opacity-90 shadow-soft transition-all duration-200 hover:shadow-soft-lg group">
                  <Upload className="h-7 w-7 mb-2 group-hover:scale-110 transition-transform duration-200" />
                  Upload Syllabus
                </Button>
                <Button className="h-24 flex-col bg-gradient-accent hover:opacity-90 shadow-soft transition-all duration-200 hover:shadow-soft-lg group">
                  <BarChart3 className="h-7 w-7 mb-2 group-hover:scale-110 transition-transform duration-200" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <QuestionGenerator />
        </TabsContent>

        <TabsContent value="papers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Paper Configuration</CardTitle>
                <CardDescription>Customize your question paper</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-2">Exam Type</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm">School Exam</Button>
                      <Button variant="outline" size="sm">University</Button>
                      <Button variant="outline" size="sm">Competitive</Button>
                      <Button variant="outline" size="sm">Practice Test</Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-2">Marks Distribution</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm">2M x 10</Button>
                      <Button variant="outline" size="sm">5M x 8</Button>
                      <Button variant="outline" size="sm">10M x 3</Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-2">Difficulty Level</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm">Easy</Button>
                      <Button variant="outline" size="sm">Medium</Button>
                      <Button variant="outline" size="sm">Hard</Button>
                    </div>
                  </div>
                </div>
                <Button className="w-full">Create Question Paper</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bloom's Taxonomy</CardTitle>
                <CardDescription>Cognitive level distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Knowledge/Recall</span>
                    <Badge variant="secondary">25%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Understanding</span>
                    <Badge variant="secondary">30%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Application</span>
                    <Badge variant="secondary">25%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Analysis</span>
                    <Badge variant="secondary">15%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Evaluation</span>
                    <Badge variant="secondary">5%</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Customize Distribution
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Creator</CardTitle>
                <CardDescription>Generate homework and practice sheets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Homework Sheet
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Practice Worksheet
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Project Assignment
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Timed Exercise
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="mb-2">Export Format</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">PDF</Button>
                    <Button variant="outline" size="sm">Word</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teaching Assistant</CardTitle>
                <CardDescription>AI-powered teaching help</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ask Teaching Strategy
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Get Activity Ideas
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Generate Examples
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Plan Lessons
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    "How can I make thermodynamics more engaging for students?"
                  </p>
                  <Button size="sm" className="mt-2">Ask AI Assistant</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Analytics</CardTitle>
              <CardDescription>Insights into your teaching effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="mb-4">Most Challenging Topics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Thermodynamics</span>
                      <Badge variant="destructive">68% avg</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Organic Chemistry</span>
                      <Badge variant="destructive">72% avg</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Calculus</span>
                      <Badge variant="secondary">75% avg</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-4">Question Effectiveness</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>MCQs</span>
                      <Badge variant="default">85% success</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Short Answer</span>
                      <Badge variant="default">78% success</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Case Studies</span>
                      <Badge variant="secondary">65% success</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h4 className="mb-4">Recommendations</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm">Consider adding more visual aids for Thermodynamics topics</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm">Your MCQ strategy is working well - continue using them</p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm">Students need more practice with case study analysis</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}