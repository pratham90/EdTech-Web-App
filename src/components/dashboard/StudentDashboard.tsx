import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BookOpen, 
  Brain, 
  Trophy, 
  Target, 
  Clock, 
  FileText, 
  Mic, 
  Upload,
  Zap,
  TrendingUp,
  Calendar,
  Award,
  Users
} from 'lucide-react';

export function StudentDashboard() {
  const [activeStreak, setActiveStreak] = useState(7);
  const [totalPoints, setTotalPoints] = useState(2450);

  const recentTopics = [
    { name: 'Mathematics - Calculus', progress: 85, lastStudied: '2 hours ago' },
    { name: 'Physics - Thermodynamics', progress: 60, lastStudied: '1 day ago' },
    { name: 'Chemistry - Organic Chemistry', progress: 40, lastStudied: '3 days ago' },
  ];

  const upcomingTests = [
    { subject: 'Mathematics', date: 'Tomorrow, 10:00 AM', type: 'Mock Test' },
    { subject: 'Physics', date: 'Dec 15, 2:00 PM', type: 'Chapter Test' },
    { subject: 'Chemistry', date: 'Dec 18, 11:00 AM', type: 'Final Exam' },
  ];

  const achievements = [
    { title: 'Quick Learner', description: 'Completed 5 topics this week', icon: Zap },
    { title: 'Consistent Student', description: '7-day study streak', icon: Calendar },
    { title: 'Top Performer', description: 'Scored 95% in last test', icon: Award },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header with stats */}
   
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl">{totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Study Streak</p>
                <p className="text-2xl">{activeStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Topics Completed</p>
                <p className="text-2xl">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl">87%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="study">Study</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="interview">Interview Prep</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTopics.map((topic, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{topic.name}</p>
                      <Badge variant="secondary">{topic.progress}%</Badge>
                    </div>
                    <Progress value={topic.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">Last studied: {topic.lastStudied}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tests</CardTitle>
                <CardDescription>Stay prepared for your exams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{test.subject}</p>
                      <p className="text-sm text-muted-foreground">{test.date}</p>
                    </div>
                    <Badge>{test.type}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Your learning milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <achievement.icon className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{achievement.title}</p>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="study" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="mb-2">Upload Syllabus</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload PDF, DOC, or images with OCR support
                </p>
                <Button>Upload File</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Mic className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="mb-2">Voice Input</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tell us your topic in voice commands
                </p>
                <Button>Start Recording</Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="mb-2">Topic Input</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Type or select specific topics to study
                </p>
                <Button>Enter Topic</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="practice" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Practice Modes</CardTitle>
                <CardDescription>Choose your practice type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Topic-wise Practice
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Timed Mock Tests
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Adaptive Learning
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Revision
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question Types</CardTitle>
                <CardDescription>Practice different formats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="secondary" className="p-2 justify-center">MCQs</Badge>
                  <Badge variant="secondary" className="p-2 justify-center">Short Answer</Badge>
                  <Badge variant="secondary" className="p-2 justify-center">Long Answer</Badge>
                  <Badge variant="secondary" className="p-2 justify-center">Case Study</Badge>
                </div>
                <Button className="w-full mt-4">Start Practice Session</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Mock Interview</CardTitle>
                <CardDescription>Practice with AI interviewer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Brain className="h-4 w-4 mr-2" />
                    Technical Interview
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    HR Interview
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Domain-specific
                  </Button>
                </div>
                <Button className="w-full">Start Mock Interview</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interview Feedback</CardTitle>
                <CardDescription>Areas for improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Knowledge Accuracy</span>
                    <Badge>85%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Communication Skills</span>
                    <Badge>78%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence Level</span>
                    <Badge>82%</Badge>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View Detailed Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Analytics</CardTitle>
              <CardDescription>Track your progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="mb-2">Strong Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Mathematics</Badge>
                    <Badge variant="default">Physics - Mechanics</Badge>
                    <Badge variant="default">Chemistry - Inorganic</Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-2">Areas for Improvement</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="destructive">Physics - Thermodynamics</Badge>
                    <Badge variant="destructive">Chemistry - Organic</Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-2">Recommended Next Topics</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Electromagnetic Induction
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Coordination Compounds
                    </Button>
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