import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/components/ui/tabs';
import { QuestionGenerator } from '../../questions';
import { PaperGenerator } from '../../papers';
import { Assignments } from '../../assignments';
import { RoomManagement } from '../../rooms';
import { TestAssignment } from '../../assignments';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';
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
  Award,
  Shield
} from 'lucide-react';

export function TeacherDashboard() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [questionsGenerated, setQuestionsGenerated] = useState(0);
  const [papersCreated, setPapersCreated] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentPapers, setRecentPapers] = useState([]);
  const [studentAnalytics, setStudentAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
    loadRecentPapers();
    loadStudentAnalytics();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await api.getTeacherDashboard();
      if (data && !data.error) {
        setDashboardData(data);
        setTotalStudents(data.total_students || 0);
        console.log('Teacher dashboard data loaded:', data);
      } else {
        // Set empty data if error or no data
        const emptyData = {
          class_average: 0,
          weak_topics: [],
          top_students: [],
          total_students: 0,
          total_submissions: 0,
          recent_submissions: []
        };
        setDashboardData(emptyData);
        setTotalStudents(0);
        console.log('No dashboard data available, using empty data');
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Set empty data on error
      const emptyData = {
        class_average: 0,
        weak_topics: [],
        top_students: [],
        total_students: 0,
        total_submissions: 0,
        recent_submissions: []
      };
      setDashboardData(emptyData);
      setTotalStudents(0);
      // Don't show error toast if it's just no data or connection issue
      if (error.message && !error.message.includes('500') && !error.message.includes('No data')) {
        console.warn('Dashboard load error (non-critical):', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAnalytics = async () => {
    try {
      const data = await api.getStudentAnalytics();
      if (data && !data.error && data.students) {
        setStudentAnalytics(data);
      } else {
        // Set empty analytics if no data
        setStudentAnalytics({
          students: [],
          total_students: 0,
          total_tests: 0
        });
      }
    } catch (error) {
      console.error('Failed to load student analytics:', error);
      // Set empty analytics on error
      setStudentAnalytics({
        students: [],
        total_students: 0,
        total_tests: 0
      });
    }
  };

  const loadRecentPapers = async () => {
    try {
      const result = await api.listPapers();
      if (result.papers) {
        const papers = result.papers.slice(0, 5).map(paper => {
          let dateStr = 'Recently';
          if (paper.created_at) {
            try {
              const date = new Date(paper.created_at);
              const now = new Date();
              const diffTime = Math.abs(now - date);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 0) dateStr = 'Today';
              else if (diffDays === 1) dateStr = 'Yesterday';
              else if (diffDays < 7) dateStr = `${diffDays} days ago`;
              else if (diffDays < 30) dateStr = `${Math.floor(diffDays / 7)} weeks ago`;
              else dateStr = date.toLocaleDateString();
            } catch (e) {
              dateStr = 'Recently';
            }
          }
          return {
            id: paper._id,
            subject: paper.title || 'Untitled Paper',
            type: 'Question Paper',
            marks: paper.total_marks || 0,
            date: dateStr,
            questionCount: paper.question_count || 0
          };
        });
        setRecentPapers(papers);
        setPapersCreated(result.papers.length);
        
        // Calculate total questions generated from all papers
        const totalQuestions = result.papers.reduce((sum, paper) => {
          return sum + (paper.question_count || paper.questions?.length || 0);
        }, 0);
        setQuestionsGenerated(totalQuestions);
      }
    } catch (error) {
      console.error('Failed to load papers:', error);
    }
  };

  const handleDownloadPaper = async (paperId) => {
    try {
      await api.downloadPaper(paperId);
      toast.success('Paper downloaded successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to download paper');
    }
  };

  // Get real student performance data
  const getStudentPerformance = () => {
    // Only show if we have actual student data
    if (!studentAnalytics || !studentAnalytics.students || studentAnalytics.students.length === 0) {
      return [];
    }
    
    // Group students by performance ranges
    const performanceGroups = {
      excellent: studentAnalytics.students.filter(s => s.average_score >= 90),
      good: studentAnalytics.students.filter(s => s.average_score >= 75 && s.average_score < 90),
      average: studentAnalytics.students.filter(s => s.average_score >= 60 && s.average_score < 75),
      needs_improvement: studentAnalytics.students.filter(s => s.average_score < 60)
    };
    
    // Calculate average for each group
    const groups = [];
    if (performanceGroups.excellent.length > 0) {
      const avg = performanceGroups.excellent.reduce((sum, s) => sum + s.average_score, 0) / performanceGroups.excellent.length;
      groups.push({
        name: 'Excellent (90%+)',
        totalStudents: performanceGroups.excellent.length,
        avgScore: Math.round(avg),
        improvement: '+'
      });
    }
    if (performanceGroups.good.length > 0) {
      const avg = performanceGroups.good.reduce((sum, s) => sum + s.average_score, 0) / performanceGroups.good.length;
      groups.push({
        name: 'Good (75-89%)',
        totalStudents: performanceGroups.good.length,
        avgScore: Math.round(avg),
        improvement: '+'
      });
    }
    if (performanceGroups.average.length > 0) {
      const avg = performanceGroups.average.reduce((sum, s) => sum + s.average_score, 0) / performanceGroups.average.length;
      groups.push({
        name: 'Average (60-74%)',
        totalStudents: performanceGroups.average.length,
        avgScore: Math.round(avg),
        improvement: ''
      });
    }
    if (performanceGroups.needs_improvement.length > 0) {
      const avg = performanceGroups.needs_improvement.reduce((sum, s) => sum + s.average_score, 0) / performanceGroups.needs_improvement.length;
      groups.push({
        name: 'Needs Improvement (<60%)',
        totalStudents: performanceGroups.needs_improvement.length,
        avgScore: Math.round(avg),
        improvement: '-'
      });
    }
    
    return groups;
  };

  const studentProgress = getStudentPerformance();

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
                <p className="text-3xl bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {dashboardData?.class_average?.toFixed(0) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex w-full flex-wrap glass-effect border-white/20 shadow-soft p-1 rounded-xl gap-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white rounded-lg transition-all duration-200 flex-1 min-w-0">Overview</TabsTrigger>
          <TabsTrigger value="rooms" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white rounded-lg transition-all duration-200 flex-1 min-w-0">Rooms</TabsTrigger>
          <TabsTrigger value="generator" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white rounded-lg transition-all duration-200 flex-1 min-w-0">Question Generator</TabsTrigger>
          <TabsTrigger value="papers" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white rounded-lg transition-all duration-200 flex-1 min-w-0">Paper Creator</TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white rounded-lg transition-all duration-200 flex-1 min-w-0">Assignments</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-white rounded-lg transition-all duration-200 flex-1 min-w-0">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Analytics Cards in Single Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Recent Papers Card */}
            <Card className="glass-effect border-white/20 shadow-soft-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <span>Recent Papers</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentPapers.length > 0 ? (
                  recentPapers.slice(0, 3).map((paper) => (
                    <div key={paper.id} className="p-2 rounded-lg bg-gradient-to-r from-white/60 to-blue-50/60 border border-white/30">
                      <p className="font-medium text-sm truncate">{paper.subject}</p>
                      <p className="text-xs text-muted-foreground">{paper.questionCount} Q • {paper.marks} marks</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">No papers yet</p>
                )}
              </CardContent>
            </Card>

            {/* Class Performance Card */}
            <Card className="glass-effect border-white/20 shadow-soft-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <span>Class Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {studentProgress.length > 0 ? (
                  studentProgress.slice(0, 3).map((classData, index) => (
                    <div 
                      key={index} 
                      className="p-2 rounded-lg bg-gradient-to-r from-white/60 to-green-50/60 border border-white/30 cursor-pointer hover:shadow-soft transition-all"
                      onClick={() => document.querySelector('[value="analytics"]')?.click()}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{classData.name.split(' ')[0]}</p>
                        <Badge className="text-xs">{classData.avgScore}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{classData.totalStudents} students</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Top Students Card */}
            <Card className="glass-effect border-white/20 shadow-soft-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <span>Top Students</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboardData?.top_students && dashboardData.top_students.length > 0 ? (
                  dashboardData.top_students.slice(0, 3).map((student, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-gradient-to-r from-white/60 to-yellow-50/60 border border-white/30">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{student[0] || `Student ${idx + 1}`}</p>
                        <Badge className="text-xs bg-yellow-500">{student[1]?.toFixed(0) || 0}%</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Weak Topics Card */}
            <Card className="glass-effect border-white/20 shadow-soft-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <span>Weak Topics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dashboardData?.weak_topics && dashboardData.weak_topics.length > 0 ? (
                  dashboardData.weak_topics.slice(0, 3).map((topic, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-gradient-to-r from-white/60 to-red-50/60 border border-white/30">
                      <p className="font-medium text-sm truncate">{topic.topic || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {((topic.weakness_rate || 0) * 100).toFixed(0)}% weakness
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">No weak topics</p>
                )}
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <RoomManagement />
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <QuestionGenerator />
        </TabsContent>

        <TabsContent value="papers" className="space-y-4">
          <PaperGenerator />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <TestAssignment />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-effect border-white/20 shadow-soft-lg">
            <CardHeader>
              <CardTitle>Teaching Analytics</CardTitle>
              <CardDescription>Insights into your teaching effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : dashboardData ? (
                <>
                  {dashboardData.total_students > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h4 className="mb-4 font-semibold">Class Average</h4>
                          <div className="text-3xl font-bold text-primary mb-2">
                            {dashboardData.class_average?.toFixed(1) || 0}%
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Based on {dashboardData.total_students || 0} students
                          </p>
                        </div>
                        <div>
                          <h4 className="mb-4 font-semibold">Top Students</h4>
                          <div className="space-y-2">
                            {dashboardData.top_students && dashboardData.top_students.length > 0 ? (
                              dashboardData.top_students.slice(0, 5).map((student, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-gradient-to-r from-white/60 to-blue-50/60 rounded-lg">
                                  <span className="text-sm">{student[0] || `Student ${idx + 1}`}</span>
                                  <Badge variant="default">{student[1]?.toFixed(1) || 0}%</Badge>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No student data available</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="mb-4 font-semibold">Weak Topics (Class-wide)</h4>
                        {dashboardData.weak_topics && dashboardData.weak_topics.length > 0 ? (
                          <div className="space-y-2">
                            {dashboardData.weak_topics.map((topic, idx) => (
                              <div key={idx} className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <span>{topic.topic || 'Unknown Topic'}</span>
                                <Badge variant="destructive">
                                  {((topic.weakness_rate || 0) * 100).toFixed(1)}% weakness rate
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No weak topics identified</p>
                        )}
                      </div>

                      {studentAnalytics && studentAnalytics.students && studentAnalytics.students.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="mb-4 font-semibold">Student Performance Details</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {studentAnalytics.students.slice(0, 10).map((student, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2 bg-gradient-to-r from-white/60 to-blue-50/60 rounded-lg">
                                <div>
                                  <span className="text-sm font-medium">{student.student_id || `Student ${idx + 1}`}</span>
                                  <p className="text-xs text-muted-foreground">{student.tests_taken} tests taken</p>
                                </div>
                                <Badge variant={student.average_score >= 75 ? "default" : student.average_score >= 60 ? "secondary" : "destructive"}>
                                  {student.average_score.toFixed(1)}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                          {studentAnalytics.students.length > 10 && (
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              Showing top 10 of {studentAnalytics.students.length} students
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No Student Data Yet</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Analytics will appear here once students start taking tests and submitting assignments.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Share tests with students to begin collecting performance data.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No Analytics Data Available</h4>
                  <p className="text-sm text-muted-foreground">
                    Analytics will appear here once data is available.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

            <Card className="glass-effect border-white/20 shadow-soft-lg">
              <CardHeader>
                <CardTitle>Plagiarism Checker</CardTitle>
                <CardDescription>Check content for originality</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Use the plagiarism checker to verify the originality of student submissions or generated content.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    document.querySelector('[value="assignments"]')?.click();
                    // Scroll to plagiarism checker section
                    setTimeout(() => {
                      const plagiarismSection = document.querySelector('[data-plagiarism-section]');
                      if (plagiarismSection) {
                        plagiarismSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 300);
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Open Plagiarism Checker
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


