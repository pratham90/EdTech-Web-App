import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Award,
  BookOpen,
  Clock,
  Zap,
  BarChart3,
  Activity,
  ArrowUp,
  ArrowDown,
  CheckCircle
} from 'lucide-react';

export function ProgressTracker() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  // Mock data
  const learningMetrics = [
    {
      subject: 'Mathematics',
      totalTopics: 24,
      completedTopics: 18,
      averageScore: 87,
      timeSpent: 32.5,
      lastActivity: '2 hours ago',
      improvement: 12,
      difficulty: 'intermediate',
      status: 'on-track'
    },
    {
      subject: 'Physics',
      totalTopics: 20,
      completedTopics: 12,
      averageScore: 78,
      timeSpent: 24.0,
      lastActivity: '1 day ago',
      improvement: -3,
      difficulty: 'intermediate',
      status: 'behind'
    },
    {
      subject: 'Chemistry',
      totalTopics: 18,
      completedTopics: 16,
      averageScore: 92,
      timeSpent: 28.0,
      lastActivity: '3 hours ago',
      improvement: 18,
      difficulty: 'advanced',
      status: 'ahead'
    }
  ];

  const achievements = [
    {
      id: '1',
      title: 'Study Streak Master',
      description: 'Maintained a 7-day study streak',
      icon: Calendar,
      unlockedAt: '2 days ago',
      category: 'consistency',
      rarity: 'rare'
    },
    {
      id: '2',
      title: 'Quick Learner',
      description: 'Completed 5 topics in one day',
      icon: Zap,
      unlockedAt: '1 week ago',
      category: 'study',
      rarity: 'common'
    },
    {
      id: '3',
      title: 'Perfect Score',
      description: 'Scored 100% in a practice test',
      icon: Award,
      unlockedAt: '3 days ago',
      category: 'performance',
      rarity: 'epic'
    },
    {
      id: '4',
      title: 'Mathematics Master',
      description: 'Completed all Mathematics topics',
      icon: Award,
      unlockedAt: '1 day ago',
      category: 'milestone',
      rarity: 'legendary'
    }
  ];

  const weeklyGoals = [
    {
      id: '1',
      title: 'Study Time',
      target: 20,
      current: 14.5,
      unit: 'hours',
      category: 'study-time',
      deadline: 'Dec 31, 2024'
    },
    {
      id: '2',
      title: 'Complete Topics',
      target: 8,
      current: 6,
      unit: 'topics',
      category: 'topics',
      deadline: 'Dec 31, 2024'
    },
    {
      id: '3',
      title: 'Practice Sessions',
      target: 15,
      current: 12,
      unit: 'sessions',
      category: 'practice',
      deadline: 'Dec 31, 2024'
    },
    {
      id: '4',
      title: 'Average Score',
      target: 85,
      current: 82,
      unit: '%',
      category: 'score',
      deadline: 'Dec 31, 2024'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'ahead': return 'text-green-600 bg-green-50 border-green-200';
      case 'on-track': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'behind': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityGradient = (rarity) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600';
      case 'rare': return 'from-blue-500 to-blue-600';
      case 'epic': return 'from-purple-500 to-purple-600';
      case 'legendary': return 'from-yellow-500 to-yellow-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const totalPoints = 2450;
  const totalHours = learningMetrics.reduce((sum, metric) => sum + metric.timeSpent, 0);
  const overallAverage = Math.round(learningMetrics.reduce((sum, metric) => sum + metric.averageScore, 0) / learningMetrics.length);
  const totalTopicsCompleted = learningMetrics.reduce((sum, metric) => sum + metric.completedTopics, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-effect border-white/20 shadow-soft hover:shadow-soft-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-3xl bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20 shadow-soft hover:shadow-soft-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-secondary rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Study Hours</p>
                <p className="text-3xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{totalHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20 shadow-soft hover:shadow-soft-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-primary rounded-xl group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{overallAverage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20 shadow-soft hover:shadow-soft-lg transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-success rounded-xl group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Topics Completed</p>
                <p className="text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{totalTopicsCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* You can keep the rest of your Tabs, Cards, and map functions same as before */}
      {/* All TypeScript types were removed safely */}
    </div>
  );
}
