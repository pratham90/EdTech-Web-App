import axios from 'axios';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

/**
 * Service to communicate with Python AI models
 */
class PythonService {
  constructor() {
    this.baseURL = PYTHON_SERVICE_URL;
  }

  async request(endpoint, method = 'GET', data = null, config = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // Set longer timeout for evaluation and transcription endpoints
      let defaultTimeout = 30000; // 30 seconds default
      if (endpoint.includes('evaluate')) {
        defaultTimeout = 60000; // 60 seconds for evaluation
      } else if (endpoint.includes('parse_syllabus')) {
        defaultTimeout = 120000; // 120 seconds (2 minutes) for audio transcription
      }
      
      const options = {
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        responseType: config.responseType || 'json',
        timeout: config.timeout || defaultTimeout,
        ...config,
      };

      if (data && method !== 'GET') {
        if (data instanceof FormData) {
          options.data = data;
          delete options.headers['Content-Type']; // Let axios set it for FormData
        } else {
          options.data = data;
        }
      }

      const response = await axios(options);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error calling Python service ${endpoint}:`, error.message);
      
      // Provide more helpful error messages
      let errorMessage = error.response?.data?.error || error.message;
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Service timeout. The evaluation is taking longer than expected.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Python service is not running. Please start the service.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Syllabus Parser
  async parseSyllabus(fileOrText) {
    if (fileOrText && (fileOrText.path || fileOrText.buffer)) {
      // Handle multer file object
      const FormData = (await import('form-data')).default;
      const fs = await import('fs');
      const formData = new FormData();
      
      if (fileOrText.path) {
        // Ensure we have a valid filename
        const filename = fileOrText.originalname || fileOrText.filename || 'audio.webm';
        formData.append('file', fs.createReadStream(fileOrText.path), filename);
      } else if (fileOrText.buffer) {
        // Ensure we have a valid filename
        const filename = fileOrText.originalname || fileOrText.filename || 'audio.webm';
        formData.append('file', fileOrText.buffer, {
          filename: filename,
          contentType: fileOrText.mimetype || 'audio/webm',
        });
      }
      
      return this.request('/api/parse_syllabus', 'POST', formData, {
        headers: formData.getHeaders(),
      });
    } else if (typeof fileOrText === 'string') {
      return this.request('/api/parse_syllabus', 'POST', { text: fileOrText });
    } else {
      return { success: false, error: 'Invalid input type' };
    }
  }

  // Question Generator
  async generateQuestions(topic, examType, difficulty, questionType, numQuestions) {
    return this.request('/api/generate_questions', 'POST', {
      topic,
      exam_type: examType,
      difficulty,
      question_type: questionType,
      num_questions: numQuestions,
    });
  }

  // Answer Generator
  async generateAnswer(question, examType) {
    return this.request('/api/generate_answer', 'POST', {
      question,
      exam_type: examType,
    });
  }

  async generateAnswersBatch(questions, examType) {
    return this.request('/api/generate_answers_batch', 'POST', {
      questions,
      exam_type: examType,
    });
  }

  // Mock Test Evaluator
  async evaluateMock(questions) {
    return this.request('/api/evaluate_mock', 'POST', { questions });
  }

  // Smart Evaluator
  async evaluateStudent(studentId, paperId, paper, answers) {
    return this.request('/api/evaluate_student', 'POST', {
      student_id: studentId,
      paper_id: paperId,
      paper,
      answers,
    });
  }

  // Teacher Assistant
  async generatePaper(subject, examType, numQuestions, marksDistribution, difficulty) {
    return this.request('/api/generate_paper', 'POST', {
      subject,
      exam_type: examType,
      num_questions: numQuestions,
      marks_distribution: marksDistribution,
      difficulty,
    });
  }

  async listPapers() {
    return this.request('/api/list_papers', 'GET');
  }

  async getPaper(paperId) {
    return this.request(`/api/get_paper/${paperId}`, 'GET');
  }

  async downloadPaper(paperId) {
    try {
      const url = `${this.baseURL}/api/download_paper/${paperId}`;
      const response = await axios.get(url, {
        responseType: 'arraybuffer', // Use arraybuffer for binary data
        timeout: 30000,
      });
      
      // Convert arraybuffer to Buffer
      const buffer = Buffer.from(response.data);
      return { success: true, data: buffer };
    } catch (error) {
      console.error(`Error downloading paper ${paperId}:`, error.message);
      let errorMessage = error.response?.data?.error || error.message;
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Download timeout. Please try again.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Python service is not running. Please start the service.';
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Interview Bot
  async startInterview(subject, difficulty) {
    return this.request('/api/interview/start', 'POST', {
      subject,
      difficulty,
    });
  }

  async submitInterviewAnswer(sessionId, studentAnswer, audioFile = null) {
    if (audioFile) {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('file', audioFile);
      return this.request('/api/interview/submit', 'POST', formData, {
        headers: {},
      });
    } else {
      return this.request('/api/interview/submit', 'POST', {
        session_id: sessionId,
        student_answer: studentAnswer,
      });
    }
  }

  // Analytics & Progress
  async saveProgress(studentId, mockTestId, percentage, evaluation) {
    // Handle evaluation object that might contain topic and other metadata
    const payload = {
      student_id: studentId,
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
    
    // Use shorter timeout for progress saving (10 seconds - it's non-critical)
    return this.request('/api/save_progress', 'POST', payload, {
      timeout: 10000
    });
  }

  async getProgress(studentId) {
    return this.request(`/api/get_progress/${studentId}`, 'GET');
  }

  // Adaptive Learning
  async analyzeLearning(studentName, testHistory) {
    return this.request('/api/adaptive/analyze', 'POST', {
      student_name: studentName,
      test_history: testHistory,
    });
  }

  // Recommendation Engine
  async getRecommendations(studentId) {
    return this.request(`/api/recommend/${studentId}`, 'GET');
  }

  // Report Generator
  async downloadReport(studentId) {
    return this.request(`/api/report/${studentId}`, 'GET', null, {
      responseType: 'blob',
    });
  }

  // Teacher Dashboard - Filtered by student IDs
  async getTeacherDashboard(studentIds = []) {
    if (studentIds && studentIds.length > 0) {
      return this.request('/api/teacher/dashboard', 'POST', { student_ids: studentIds });
    }
    return this.request('/api/teacher/dashboard', 'GET');
  }

  // Teaching Assistant
  async askTeachingAssistant(query) {
    return this.request('/api/teacher/assistant', 'POST', { query });
  }

  // Plagiarism Checker
  async checkPlagiarism(text, referenceTexts = []) {
    return this.request('/api/check_plagiarism', 'POST', {
      text,
      reference_texts: referenceTexts
    });
  }

  // Test Assignment
  async assignTest(paperId, studentIds, dueDate, teacherId) {
    return this.request('/api/assign_test', 'POST', {
      paper_id: paperId,
      student_ids: studentIds,
      due_date: dueDate,
      teacher_id: teacherId
    });
  }

  async getAssignments(teacherId = null, studentId = null) {
    if (teacherId) {
      return this.request(`/api/get_assignments?teacher_id=${teacherId}`, 'GET');
    } else if (studentId) {
      return this.request(`/api/get_assignments?student_id=${studentId}`, 'GET');
    }
    return this.request('/api/get_assignments', 'GET');
  }

  async submitAssignment(assignmentId, studentId, answers, evaluation, percentage, submittedAt) {
    // Use shorter timeout for assignment submission (30 seconds - DB save is now fast)
    return this.request('/api/submit_assignment', 'POST', {
      assignment_id: assignmentId,
      student_id: studentId,
      answers,
      evaluation,
      percentage,
      submitted_at: submittedAt
    }, {
      timeout: 30000  // 30 seconds - reduced since DB save is synchronous and fast
    });
  }

  async getAssignmentSubmissions(assignmentId) {
    return this.request(`/api/get_assignment_submissions/${assignmentId}`, 'GET');
  }

  async updateSubmissionEvaluation(assignmentId, studentId, teacherFeedback, updatedPercentage, updatedEvaluation) {
    return this.request('/api/update_submission_evaluation', 'POST', {
      assignment_id: assignmentId,
      student_id: studentId,
      teacher_feedback: teacherFeedback,
      updated_percentage: updatedPercentage,
      updated_evaluation: updatedEvaluation
    });
  }

  async sharePaper(paperId) {
    return this.request(`/api/share_paper/${paperId}`, 'POST');
  }

  // Student Analytics - Filtered by student IDs
  async getStudentAnalytics(studentIds = []) {
    if (studentIds && studentIds.length > 0) {
      return this.request('/api/get_student_analytics', 'POST', { student_ids: studentIds });
    }
    return this.request('/api/get_student_analytics', 'GET');
  }

  // Health Check
  async healthCheck() {
    return this.request('/api/health', 'GET');
  }
}

export default new PythonService();

