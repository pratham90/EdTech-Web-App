import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Progress } from '../../../shared/components/ui/progress';
import { Badge } from '../../../shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/components/ui/tabs';
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
  CheckCircle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export function ProgressTracker() {
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    if (user && user._id) {
      loadProgress();
      loadRecommendations();
    }
  }, [user]);

  const loadProgress = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      const data = await api.getProgress(user._id);
      // Ensure data structure is consistent
      const normalizedData = {
        total_tests: data?.total_tests || data?.records?.length || 0,
        analytics: data?.analytics || { 
          average_score: 0, 
          trend: 'Needs Improvement', 
          weak_topics: [],
          study_streak: 0
        },
        records: data?.records || []
      };
      
      // Calculate average if not present
      if (normalizedData.analytics.average_score === 0 && normalizedData.records.length > 0) {
        const totalPercentage = normalizedData.records.reduce((sum, r) => sum + (r.percentage || 0), 0);
        normalizedData.analytics.average_score = totalPercentage / normalizedData.records.length;
      }
      
      setProgressData(normalizedData);
      console.log('Progress data loaded:', normalizedData);
    } catch (error) {
      console.error('Failed to load progress:', error);
      // Set empty data for new users or on error
      setProgressData({
        total_tests: 0,
        analytics: { average_score: 0, trend: 'Needs Improvement', weak_topics: [], study_streak: 0 },
        records: []
      });
      // Don't show error if no records found (new user)
      if (error.message && !error.message.includes('No records') && !error.message.includes('404')) {
        toast.error('Failed to load progress data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!user?._id) return;
    
    try {
      const data = await api.getRecommendations(user._id);
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleDownloadReport = async () => {
    if (!user?._id) return;
    
    try {
      await api.downloadReport(user._id);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const analytics = progressData?.analytics || {};
  const records = progressData?.records || [];
  const totalTests = progressData?.total_tests || progressData?.records?.length || 0;
  const averageScore = analytics?.average_score || 0;
  const weakTopics = analytics?.weak_topics || [];
  const trend = analytics?.trend || 'Needs Improvement';

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
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-3xl bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{totalTests}</p>
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
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{averageScore.toFixed(1)}%</p>
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
                <p className="text-sm text-muted-foreground">Progress Trend</p>
                <p className={`text-3xl bg-gradient-to-r ${trend === 'Improving' ? 'from-green-600 to-emerald-600' : 'from-red-600 to-pink-600'} bg-clip-text text-transparent`}>
                  {trend}
                </p>
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
                <p className="text-sm text-muted-foreground">Weak Topics</p>
                <p className="text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{weakTopics.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Test History</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Your learning progress summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Average Score</span>
                    <span className="font-bold">{averageScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={averageScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Total Tests Completed</span>
                    <span className="font-bold">{totalTests}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Progress Trend</span>
                    <Badge className={trend === 'Improving' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {trend}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weak Topics</CardTitle>
                <CardDescription>Areas that need improvement</CardDescription>
              </CardHeader>
              <CardContent>
                {weakTopics.length > 0 ? (
                  <div className="space-y-2">
                    {weakTopics.map((topic, idx) => (
                      <Badge key={idx} variant="outline" className="mr-2 mb-2">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No weak topics identified. Great job!</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Download Report</CardTitle>
                  <CardDescription>Get a detailed PDF report of your progress</CardDescription>
                </div>
                <Button onClick={handleDownloadReport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
              <CardDescription>Your previous test results</CardDescription>
            </CardHeader>
            <CardContent>
              {records.length > 0 ? (
                <div className="space-y-4">
                  {records.map((record, idx) => {
                    const testName = record.topic || record.mock_test_id || record.type || `Test ${idx + 1}`;
                    const percentage = record.percentage || 0;
                    const timestamp = record.timestamp || 'Unknown date';
                    const evaluation = record.evaluation || record.question_results || [];
                    
                    return (
                      <div key={idx} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{testName}</h4>
                            <p className="text-sm text-muted-foreground">{timestamp}</p>
                            {record.type && (
                              <Badge variant="outline" className="mt-1">
                                {record.type.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          <Badge className={percentage >= 70 ? 'bg-green-100 text-green-700' : percentage >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                            {percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        {evaluation.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Question Results:</p>
                            {evaluation.slice(0, 5).map((evalItem, eIdx) => (
                              <div key={eIdx} className="text-sm flex items-center gap-2">
                                <span className={evalItem.is_correct || (evalItem.score >= (evalItem.marks || 1)) ? 'text-green-600' : 'text-red-600'}>
                                  {evalItem.is_correct || (evalItem.score >= (evalItem.marks || 1)) ? '✓' : '✗'}
                                </span>
                                <span className="font-medium">Q{evalItem.id || eIdx + 1}:</span>
                                <span className="text-muted-foreground">
                                  {evalItem.score || 0}/{evalItem.marks || 1}
                                </span>
                              </div>
                            ))}
                            {evaluation.length > 5 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                +{evaluation.length - 5} more questions
                              </p>
                            )}
                          </div>
                        )}
                        {record.bonus_points && (
                          <div className="mt-2">
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                              +{record.bonus_points} bonus points
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No test records found. Start taking tests to see your progress!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>Resources to help you improve</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations && (recommendations.recommendations?.length > 0 || recommendations.weak_topics?.length > 0) ? (
                <div className="space-y-4">
                  {recommendations.weak_topics && recommendations.weak_topics.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Focus Areas:</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {recommendations.weak_topics.map((topic, idx) => (
                          <Badge key={idx} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(recommendations.recommendations) && recommendations.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Recommended Resources:</h4>
                      <div className="space-y-2">
                        {recommendations.recommendations.map((rec, idx) => (
                          <div key={idx} className="p-3 border rounded-lg hover:bg-accent transition-colors">
                            <a 
                              href={rec.url || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center justify-between"
                            >
                              <div>
                                <span className="font-medium">{rec.title || 'Resource'}</span>
                                {rec.type && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {rec.type}
                                  </Badge>
                                )}
                              </div>
                              <Badge variant="outline">View</Badge>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recommendations available. Complete some tests to get personalized recommendations!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

