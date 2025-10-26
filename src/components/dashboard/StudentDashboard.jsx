import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { QuestionGenerator } from '../features/QuestionGenerator';
import { MockInterview } from '../features/MockInterview';
import { ProgressTracker } from '../features/ProgressTracker';
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
    <div className="p-6 space-y-8 min-h-screen bg-background">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card shadow-soft hover:shadow-soft-lg transition-all duration-300 group border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-warning rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-3xl text-warning">{totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-soft hover:shadow-soft-lg transition-all duration-300 group border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-success rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Study Streak</p>
                <p className="text-3xl text-success">{activeStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-soft hover:shadow-soft-lg transition-all duration-300 group border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-info rounded-xl group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Topics Completed</p>
                <p className="text-3xl text-info">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-soft hover:shadow-soft-lg transition-all duration-300 group border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary rounded-xl group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl text-primary">87%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-muted shadow-sm p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200">Overview</TabsTrigger>
          <TabsTrigger value="study" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200">Study</TabsTrigger>
          <TabsTrigger value="practice" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200">Practice</TabsTrigger>
          <TabsTrigger value="interview" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200">Interview Prep</TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Topics */}
            <Card className="glass-effect border-white/20 shadow-soft-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <span>Continue Learning</span>
                </CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTopics.map((topic, index) => (
                  <div key={index} className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-white/60 to-indigo-50/60 border border-white/30 hover:shadow-soft transition-all duration-200">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{topic.name}</p>
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">{topic.progress}%</Badge>
                    </div>
                    <Progress value={topic.progress} className="h-3" />
                    <p className="text-sm text-muted-foreground">Last studied: {topic.lastStudied}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Tests */}
            <Card className="glass-effect border-white/20 shadow-soft-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <span>Upcoming Tests</span>
                </CardTitle>
                <CardDescription>Stay prepared for your exams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-white/60 to-orange-50/60 border border-white/30 hover:shadow-soft transition-all duration-200">
                    <div>
                      <p className="font-medium">{test.subject}</p>
                      <p className="text-sm text-muted-foreground">{test.date}</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">{test.type}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          <Card className="glass-effect border-white/20 shadow-soft-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-accent rounded-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <span>Recent Achievements</span>
              </CardTitle>
              <CardDescription>Your learning milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-white/60 to-yellow-50/60 border border-white/30 hover:shadow-soft transition-all duration-200 group">
                    <div className="p-3 bg-gradient-accent rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <achievement.icon className="h-6 w-6 text-white" />
                    </div>
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

        <TabsContent value="study" className="space-y-6">
          <QuestionGenerator />
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
          <MockInterview />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <ProgressTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}