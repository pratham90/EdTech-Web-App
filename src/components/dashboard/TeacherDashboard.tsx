import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
    <div className="p-6 space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Questions Generated</p>
                <p className="text-2xl">{questionsGenerated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Papers Created</p>
                <p className="text-2xl">{papersCreated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Class Score</p>
                <p className="text-2xl">84%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="generator">Question Generator</TabsTrigger>
          <TabsTrigger value="papers">Paper Creator</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Papers */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Question Papers</CardTitle>
                <CardDescription>Your latest creations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPapers.map((paper, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{paper.subject}</p>
                      <p className="text-sm text-muted-foreground">{paper.type} • {paper.marks} marks</p>
                      <p className="text-xs text-muted-foreground">{paper.date}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <PenTool className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Student Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Class Performance</CardTitle>
                <CardDescription>Student progress overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentProgress.map((classData, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{classData.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {classData.totalStudents} students • Avg: {classData.avgScore}%
                      </p>
                    </div>
                    <Badge variant={classData.improvement.includes('+') ? 'default' : 'destructive'}>
                      {classData.improvement}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Brain className="h-6 w-6 mb-2" />
                  Generate Questions
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Create Paper
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Upload className="h-6 w-6 mb-2" />
                  Upload Syllabus
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Smart Question Generator</CardTitle>
                <CardDescription>AI-powered question creation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Syllabus (PDF/DOC)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Enter Topic Manually
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Brain className="h-4 w-4 mr-2" />
                    Voice Input
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="mb-2">Question Types</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="secondary" className="p-2 justify-center">MCQs</Badge>
                    <Badge variant="secondary" className="p-2 justify-center">Short Answer</Badge>
                    <Badge variant="secondary" className="p-2 justify-center">Long Answer</Badge>
                    <Badge variant="secondary" className="p-2 justify-center">Case Studies</Badge>
                  </div>
                </div>
                <Button className="w-full">Generate Questions</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question Bank Stats</CardTitle>
                <CardDescription>Your generated question inventory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questionStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{stat.type}</p>
                      <p className="text-sm text-muted-foreground">Difficulty: {stat.difficulty}</p>
                    </div>
                    <Badge>{stat.count}</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Question Bank
                </Button>
              </CardContent>
            </Card>
          </div>
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