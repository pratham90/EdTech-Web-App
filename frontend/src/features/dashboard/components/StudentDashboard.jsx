import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Progress } from '../../../shared/components/ui/progress';
import { Badge } from '../../../shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/components/ui/tabs';
import { QuestionGenerator } from '../../questions';
import { MockInterview } from '../../practice';
import { ProgressTracker } from '../../progress';
import { MockTest } from '../../practice';
import { JoinRoom } from '../../rooms';
import { StudentAssignments } from '../../assignments';
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
  Users,
  DoorOpen
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

export function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [recentTopics, setRecentTopics] = useState([]);
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    activeStreak: 0,
    topicsCompleted: 0,
    averageScore: 0
  });

  useEffect(() => {
    if (user?._id) {
      loadDashboardData();
      
      // Refresh dashboard when component becomes visible (but only if not in test mode)
      // Check if we're in assignments/test view by checking URL or a flag
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          // Only refresh if we're actually on the dashboard, not taking a test
          // Check if assignments tab is active
          const assignmentsTab = document.querySelector('[value="assignments"]');
          const isOnAssignmentsTab = assignmentsTab?.getAttribute('data-state') === 'active';
          
          // Only refresh if not actively taking a test (we can't detect this perfectly, so be conservative)
          if (!isOnAssignmentsTab) {
            loadDashboardData();
          }
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Also refresh periodically (every 60 seconds) to catch updates, but less frequently
      const refreshInterval = setInterval(() => {
        loadDashboardData();
      }, 60000); // Increased to 60 seconds to reduce refresh frequency
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(refreshInterval);
      };
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      const progress = await api.getProgress(user._id);
      console.log('Progress data received:', progress);
      setProgressData(progress);
      
      // Calculate stats from progress data
      const records = progress?.records || [];
      const analytics = progress?.analytics || {};
      const totalTests = progress?.total_tests || records.length || 0;
      
      // Calculate average score from records if not in analytics
      let avgScore = analytics?.average_score || 0;
      if (avgScore === 0 && records.length > 0) {
        const totalPercentage = records.reduce((sum, r) => sum + (r.percentage || 0), 0);
        avgScore = totalPercentage / records.length;
      }
      
      const stats = {
        totalPoints: progress?.total_points || progress?.bonus_points || records.reduce((sum, r) => sum + (r.bonus_points || 0), 0) || 0,
        activeStreak: progress?.study_streak || analytics?.study_streak || 0,
        topicsCompleted: progress?.topics_completed || analytics?.topics_completed || totalTests || 0,
        averageScore: avgScore
      };
      
      console.log('Calculated stats:', stats);
      setStats(stats);

      // Extract recent topics from progress records
      const topics = records.slice(0, 3).map((record, idx) => ({
        name: record.topic || record.type || record.paper_title || `Test ${idx + 1}`,
        progress: record.percentage || 0,
        lastStudied: record.timestamp ? new Date(record.timestamp).toLocaleDateString() : 
                     record.created_at ? new Date(record.created_at).toLocaleDateString() : 'Recently'
      }));
      
      // Only show placeholder if there are truly no records
      if (topics.length === 0) {
        setRecentTopics([
          { name: 'No tests completed yet', progress: 0, lastStudied: 'Start taking tests to see progress' }
        ]);
      } else {
        setRecentTopics(topics);
      }

      // Generate achievements based on progress - only show real achievements
      const newAchievements = [];
      if (records.length >= 5) {
        newAchievements.push({ title: 'Quick Learner', description: `Completed ${records.length} tests`, icon: Zap });
      }
      if (analytics?.study_streak >= 7) {
        newAchievements.push({ title: 'Consistent Student', description: `${analytics.study_streak}-day study streak`, icon: Calendar });
      }
      if (analytics?.average_score >= 90) {
        newAchievements.push({ title: 'Top Performer', description: `Scored ${analytics.average_score.toFixed(0)}% average`, icon: Award });
      }
      // Only set achievements if there are real ones, otherwise empty array
      setAchievements(newAchievements);

      // Upcoming tests - for now, show empty or generate from available papers
      setUpcomingTests([]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set default empty data on error
      setProgressData({
        total_tests: 0,
        analytics: { average_score: 0, trend: 'Needs Improvement', weak_topics: [] },
        records: []
      });
      setStats({
        totalPoints: 0,
        activeStreak: 0,
        topicsCompleted: 0,
        averageScore: 0
      });
      setRecentTopics([
        { name: 'No tests completed yet', progress: 0, lastStudied: 'Start taking tests to see progress' }
      ]);
      setAchievements([]);
      // Only show error if it's not a "no data" error
      if (error.message && !error.message.includes('No records') && !error.message.includes('404')) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                <p className="text-3xl text-warning">{stats.totalPoints}</p>
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
                <p className="text-3xl text-success">{stats.activeStreak} days</p>
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
                <p className="text-3xl text-info">{stats.topicsCompleted}</p>
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
                <p className="text-3xl text-primary">{stats.averageScore.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6 ">
        <TabsList className="flex w-full flex-wrap bg-muted shadow-sm p-1 rounded-lg gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200 flex-1 min-w-0">Overview</TabsTrigger>
          <TabsTrigger value="room" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200 flex-1 min-w-0">Classroom</TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200 flex-1 min-w-0">Assignments</TabsTrigger>
          <TabsTrigger value="study" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200 flex-1 min-w-0">Study</TabsTrigger>
          <TabsTrigger value="practice" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200 flex-1 min-w-0">Practice</TabsTrigger>
          <TabsTrigger value="interview" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200 flex-1 min-w-0">Interview Prep</TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200 flex-1 min-w-0">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 ">
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

          {/* Room Status Card - Only show if user has rooms */}
          {recentTopics.length > 0 && (
            <Card className="glass-effect border-white/20 shadow-soft-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span>Classroom</span>
                </CardTitle>
                <CardDescription>Join your teacher's classroom</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                  <p className="text-sm text-muted-foreground mb-3">
                    Join your teacher's classroom to receive assignments and track your progress together.
                  </p>
                  <Button
                    onClick={() => document.querySelector('[value="room"]')?.click()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white"
                  >
                    <DoorOpen className="h-4 w-4 mr-2" />
                    Join or View Classroom
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements - Only show if there are actual achievements */}
          {achievements.length > 0 && achievements[0].title !== 'Get Started' && (
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
          )}
        </TabsContent>

        <TabsContent value="room" className="space-y-4">
          <JoinRoom />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <StudentAssignments />
        </TabsContent>

        <TabsContent value="study" className="space-y-6">
          <QuestionGenerator />
        </TabsContent>

        <TabsContent value="practice" className="space-y-4">
          <MockTest />
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


