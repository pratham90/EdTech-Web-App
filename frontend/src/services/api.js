/**
 * API Service for connecting frontend with backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log(`🌐 API Service initialized with base URL: ${this.baseURL}`);
  }

  // Test backend connection
  async testConnection() {
    try {
      const healthUrl = `${this.baseURL.replace('/api', '')}/api/health`;
      console.log(`🔍 Testing connection to: ${healthUrl}`);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connection test successful:', data);
        return true;
      } else {
        console.error(`❌ Backend responded with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      // Check if it's a CORS error
      if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
        console.error('❌ CORS or network error:', error.message);
        console.error('💡 Make sure:');
        console.error('   1. Backend is running on http://localhost:5000');
        console.error('   2. Backend has been restarted with updated CORS config');
        console.error('   3. Frontend is running on http://localhost:3000 or http://localhost:5173');
      } else {
        console.error('❌ Backend connection test failed:', error);
      }
      return false;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`🔗 API Request: ${options.method || 'GET'} ${url}`);
    
    const token = localStorage.getItem('token') || document.cookie
      .split('; ')
      .find(row => row.startsWith('jwt='))
      ?.split('=')[1];

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
    };

    // Handle FormData
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      console.log(`✅ API Response: ${response.status} ${response.statusText} for ${url}`);
      
      // Check if response is JSON before parsing
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
        }
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ API Error [${endpoint}]:`, error);
      
      // Handle CORS errors specifically
      if (error.message && error.message.includes('CORS')) {
        throw new Error(
          `CORS error: Backend server needs to be restarted. ` +
          `Please restart your backend server to apply the updated CORS configuration.`
        );
      }
      
      // Provide more helpful error messages for network errors
      if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message.includes('fetch'))) {
        const backendUrl = this.baseURL.replace('/api', '');
        
        // Only test connection if this isn't already a connection test
        if (!endpoint.includes('/health')) {
          // Check if it's a CORS issue by trying a simple request
          try {
            const testResponse = await fetch(`${backendUrl}/api/health`, {
              method: 'GET',
              credentials: 'include',
            });
            if (testResponse.ok) {
              // Backend is reachable, likely a CORS or other config issue
              throw new Error(
                `Backend is running but request failed. ` +
                `This may be a CORS configuration issue. ` +
                `Please restart your backend server.`
              );
            }
          } catch (testError) {
            // Connection test also failed
          }
        }
        
        throw new Error(
          `Cannot connect to backend server at ${backendUrl}. ` +
          `Please ensure: 1) Backend is running (restart if needed), 2) No firewall blocking, 3) Correct URL in .env file`
        );
      }
      
      // Re-throw with original message if it's already a helpful error
      if (error.message && !error.message.includes('Failed to fetch')) {
        throw error;
      }
      
      throw new Error(error.message || 'Network error. Please check your connection and ensure the backend server is running.');
    }
  }

  // Auth APIs
  async signup(role, email, password) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ role, email, password }),
    });
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async checkAuth() {
    return this.request('/auth/check', {
      method: 'GET',
    });
  }

  // AI Model APIs
  async parseSyllabus(fileOrText) {
    if (fileOrText instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrText, fileOrText.name); // Include filename explicitly
      console.log('📤 Sending file for parsing:', fileOrText.name, fileOrText.type, fileOrText.size, 'bytes');
      
      // For FormData, we need to handle it differently
      const url = `${this.baseURL}/ai/parse-syllabus`;
      const token = localStorage.getItem('token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        ?.split('=')[1];

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            // Don't set Content-Type for FormData - browser will set it with boundary
          },
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('❌ API Error [parse-syllabus]:', error);
        throw error;
      }
    } else {
      return this.request('/ai/parse-syllabus', {
        method: 'POST',
        body: JSON.stringify({ text: fileOrText }),
      });
    }
  }

  async generateQuestions(topic, examType, difficulty, questionType, numQuestions) {
    return this.request('/ai/generate-questions', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        examType,
        difficulty,
        questionType,
        numQuestions,
      }),
    });
  }

  async generateAnswer(question, examType) {
    return this.request('/ai/generate-answer', {
      method: 'POST',
      body: JSON.stringify({ question, examType }),
    });
  }

  async evaluateMock(questions) {
    return this.request('/ai/evaluate-mock', {
      method: 'POST',
      body: JSON.stringify({ questions }),
    });
  }

  async evaluateStudent(studentId, paperId, paper, answers) {
    return this.request('/ai/evaluate-student', {
      method: 'POST',
      body: JSON.stringify({
        studentId,
        paperId,
        paper,
        answers,
      }),
    });
  }

  async generatePaper(subject, examType, numQuestions, marksDistribution, difficulty) {
    return this.request('/ai/generate-paper', {
      method: 'POST',
      body: JSON.stringify({
        subject,
        examType,
        numQuestions,
        marksDistribution,
        difficulty,
      }),
    });
  }

  async listPapers() {
    return this.request('/ai/list-papers', {
      method: 'GET',
    });
  }

  async getPaper(paperId) {
    return this.request(`/ai/get-paper/${paperId}`, {
      method: 'GET',
    });
  }

  async downloadPaper(paperId) {
    try {
      const token = localStorage.getItem('token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        ?.split('=')[1];

      const response = await fetch(`${this.baseURL}/ai/download-paper/${paperId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || errorData.message || 'Failed to download paper');
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        // Try to get error message if not PDF
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || errorData.message || 'Invalid response from server');
        } catch {
          throw new Error('Server returned invalid data. Expected PDF file.');
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Try to get filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `paper_${paperId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  async startInterview(subject, difficulty) {
    return this.request('/ai/interview/start', {
      method: 'POST',
      body: JSON.stringify({ subject, difficulty }),
    });
  }

  async submitInterviewAnswer(sessionId, studentAnswer, audioFile = null) {
    if (audioFile) {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('audio', audioFile);
      return this.request('/ai/interview/submit', {
        method: 'POST',
        body: formData,
      });
    } else {
      return this.request('/ai/interview/submit', {
        method: 'POST',
        body: JSON.stringify({ sessionId, studentAnswer }),
      });
    }
  }

  async saveProgress(studentId, mockTestId, percentage, evaluation) {
    // Handle evaluation object that might contain topic and other metadata
    const payload = {
      student_id: studentId, // Use snake_case for backend
      mock_test_id: mockTestId,
      percentage,
      evaluation: evaluation?.evaluation || evaluation?.question_results || evaluation?.details || evaluation,
    };
    
    // Add topic and other metadata if present
    if (evaluation?.topic) {
      payload.topic = evaluation.topic;
    }
    if (evaluation?.type) {
      payload.type = evaluation.type;
    }
    if (evaluation?.exam_type) {
      payload.exam_type = evaluation.exam_type;
    }
    if (evaluation?.difficulty) {
      payload.difficulty = evaluation.difficulty;
    }
    // Add assignment-specific metadata
    if (evaluation?.paper_title) {
      payload.paper_title = evaluation.paper_title;
    }
    if (evaluation?.assignment_id) {
      payload.assignment_id = evaluation.assignment_id;
    }
    if (evaluation?.paper_id) {
      payload.paper_id = evaluation.paper_id;
    }
    if (evaluation?.timestamp) {
      payload.timestamp = evaluation.timestamp;
    }
    if (evaluation?.created_at) {
      payload.created_at = evaluation.created_at;
    }
    
    return this.request('/ai/save-progress', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getProgress(studentId) {
    return this.request(`/ai/get-progress/${studentId}`, {
      method: 'GET',
    });
  }

  async analyzeLearning(studentName, testHistory) {
    return this.request('/ai/adaptive/analyze', {
      method: 'POST',
      body: JSON.stringify({ studentName, testHistory }),
    });
  }

  async getRecommendations(studentId) {
    return this.request(`/ai/recommend/${studentId}`, {
      method: 'GET',
    });
  }

  async downloadReport(studentId) {
    const response = await fetch(`${this.baseURL}/ai/report/${studentId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download report');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studentId}_report.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async getTeacherDashboard() {
    return this.request('/ai/teacher/dashboard', {
      method: 'GET',
    });
  }

  async askTeachingAssistant(query) {
    return this.request('/ai/teacher/assistant', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }

  async checkPlagiarism(text, referenceTexts = []) {
    return this.request('/ai/check-plagiarism', {
      method: 'POST',
      body: JSON.stringify({ text, referenceTexts }),
    });
  }

  async assignTest(paperId, studentIds, dueDate, teacherId, roomId = null) {
    return this.request('/ai/assign-test', {
      method: 'POST',
      body: JSON.stringify({ paperId, studentIds, dueDate, teacherId, roomId }),
    });
  }

  async getAssignments(teacherId) {
    return this.request(`/ai/assignments?teacherId=${teacherId}`, {
      method: 'GET',
    });
  }

  async getStudentAssignments(studentId) {
    return this.request(`/ai/assignments?studentId=${studentId}`, {
      method: 'GET',
    });
  }

  async getAssignmentSubmissions(assignmentId) {
    return this.request(`/ai/assignment-submissions/${assignmentId}`, {
      method: 'GET',
    });
  }

  async updateSubmissionEvaluation(assignmentId, studentId, teacherFeedback, updatedPercentage, updatedEvaluation) {
    return this.request('/ai/update-submission-evaluation', {
      method: 'POST',
      body: JSON.stringify({
        assignment_id: assignmentId,
        student_id: studentId,
        teacher_feedback: teacherFeedback,
        updated_percentage: updatedPercentage,
        updated_evaluation: updatedEvaluation
      }),
    });
  }

  async sharePaper(paperId) {
    return this.request(`/ai/share-paper/${paperId}`, {
      method: 'POST',
    });
  }

  async getStudentAnalytics() {
    return this.request('/ai/student-analytics', {
      method: 'GET',
    });
  }

  async submitAssignment(assignmentId, studentId, answers, evaluation, percentage) {
    return this.request('/ai/submit-assignment', {
      method: 'POST',
      body: JSON.stringify({
        assignment_id: assignmentId,
        student_id: studentId,
        answers,
        evaluation,
        percentage,
        submitted_at: new Date().toISOString()
      }),
    });
  }

  // Room Management APIs
  async createRoom(roomName) {
    return this.request('/room/create', {
      method: 'POST',
      body: JSON.stringify({ roomName }),
    });
  }

  async joinRoom(roomId) {
    return this.request('/room/join', {
      method: 'POST',
      body: JSON.stringify({ roomId }),
    });
  }

  async leaveRoom() {
    return this.request('/room/leave', {
      method: 'POST',
    });
  }

  async getMyRooms() {
    return this.request('/room/my-rooms', {
      method: 'GET',
    });
  }

  async getRoomStudents(roomId) {
    return this.request(`/room/${roomId}/students`, {
      method: 'GET',
    });
  }

  async deleteRoom(roomId) {
    return this.request(`/room/${roomId}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();

