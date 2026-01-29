import express from 'express';
import multer from 'multer';
import pythonService from '../services/pythonService.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// File upload middleware - only for routes that need it
const upload = multer({ dest: 'uploads/', limits: { fileSize: 50 * 1024 * 1024 } });

// Syllabus Parser
router.post('/parse-syllabus', protectRoute, upload.single('file'), async (req, res) => {
  try {
    // Handle file upload or text input
    let input = req.body.text;
    if (req.file) {
      // If file is uploaded, pass it directly to Python service
      input = req.file;
    }
    
    const result = await pythonService.parseSyllabus(input);
    
    // Cleanup uploaded file after processing is complete
    if (req.file) {
      const fs = await import('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Question Generator
router.post('/generate-questions', protectRoute, async (req, res) => {
  try {
    const { topic, examType, difficulty, questionType, numQuestions } = req.body;
    const result = await pythonService.generateQuestions(
      topic,
      examType,
      difficulty,
      questionType,
      numQuestions
    );
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Answer Generator
router.post('/generate-answer', protectRoute, async (req, res) => {
  try {
    const { question, examType } = req.body;
    const result = await pythonService.generateAnswer(question, examType);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-answers-batch', protectRoute, async (req, res) => {
  try {
    const { questions, examType } = req.body;
    const result = await pythonService.generateAnswersBatch(questions, examType);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock Test Evaluator
router.post('/evaluate-mock', protectRoute, async (req, res) => {
  try {
    const { questions } = req.body;
    const result = await pythonService.evaluateMock(questions);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Smart Evaluator
router.post('/evaluate-student', protectRoute, async (req, res) => {
  try {
    const { studentId, paperId, paper, answers } = req.body;
    const result = await pythonService.evaluateStudent(studentId, paperId, paper, answers);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Teacher Assistant - Generate Paper
router.post('/generate-paper', protectRoute, async (req, res) => {
  try {
    const { subject, examType, numQuestions, marksDistribution, difficulty } = req.body;
    const result = await pythonService.generatePaper(
      subject,
      examType,
      numQuestions,
      marksDistribution,
      difficulty
    );
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/list-papers', protectRoute, async (req, res) => {
  try {
    const result = await pythonService.listPapers();
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/get-paper/:paperId', protectRoute, async (req, res) => {
  try {
    const { paperId } = req.params;
    const result = await pythonService.getPaper(paperId);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Paper Download
router.get('/download-paper/:paperId', protectRoute, async (req, res) => {
  try {
    const { paperId } = req.params;
    const result = await pythonService.downloadPaper(paperId);
    if (result.success) {
      const pdfData = result.data;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="paper_${paperId}.pdf"`);
      
      if (Buffer.isBuffer(pdfData)) {
        res.send(pdfData);
      } else if (pdfData instanceof Uint8Array) {
        res.send(Buffer.from(pdfData));
      } else {
        res.send(pdfData);
      }
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error downloading paper:', error);
    res.status(500).json({ error: error.message });
  }
});

// Interview Bot
router.post('/interview/start', protectRoute, async (req, res) => {
  try {
    const { subject, difficulty } = req.body;
    const result = await pythonService.startInterview(subject, difficulty);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/interview/submit', protectRoute, async (req, res) => {
  try {
    const { sessionId, studentAnswer } = req.body;
    const audioFile = req.files?.audio;
    const result = await pythonService.submitInterviewAnswer(sessionId, studentAnswer, audioFile);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics & Progress
router.post('/save-progress', protectRoute, async (req, res) => {
  try {
    // Support both camelCase and snake_case
    const studentId = req.body.studentId || req.body.student_id || req.user._id.toString();
    const mockTestId = req.body.mockTestId || req.body.mock_test_id;
    const percentage = req.body.percentage;
    const evaluation = req.body.evaluation;
    
    // Build evaluation object with all metadata
    const evalData = {
      ...evaluation,
      ...req.body, // Include all fields from request
      topic: req.body.topic || evaluation?.topic,
      type: req.body.type || evaluation?.type,
      exam_type: req.body.exam_type || evaluation?.exam_type,
      difficulty: req.body.difficulty || evaluation?.difficulty,
      paper_title: req.body.paper_title || evaluation?.paper_title,
      assignment_id: req.body.assignment_id || evaluation?.assignment_id,
      paper_id: req.body.paper_id || evaluation?.paper_id
    };
    
    const result = await pythonService.saveProgress(studentId, mockTestId, percentage, evalData);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/get-progress/:studentId', protectRoute, async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pythonService.getProgress(studentId);
    if (result.success) {
      res.json(result.data);
    } else {
      // If no records found, return empty data structure instead of error
      if (result.error && result.error.includes('No records')) {
        res.json({
          student_id: studentId,
          total_tests: 0,
          total_points: 0,
          bonus_points: 0,
          study_streak: 0,
          topics_completed: 0,
          analytics: {
            average_score: 0,
            trend: 'Needs Improvement',
            weak_topics: [],
            study_streak: 0
          },
          records: [],
          recent_activities: [],
          topics: []
        });
      } else {
        res.status(500).json({ error: result.error });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Adaptive Learning
router.post('/adaptive/analyze', protectRoute, async (req, res) => {
  try {
    const { studentName, testHistory } = req.body;
    const result = await pythonService.analyzeLearning(studentName, testHistory);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recommendation Engine
router.get('/recommend/:studentId', protectRoute, async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pythonService.getRecommendations(studentId);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Report Generator
router.get('/report/:studentId', protectRoute, async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pythonService.downloadReport(studentId);
    if (result.success) {
      // Handle both Buffer and Blob responses
      const pdfData = result.data;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${studentId}_report.pdf"`);
      
      // If it's a Buffer, send it directly; if it's a Blob, convert to Buffer
      if (Buffer.isBuffer(pdfData)) {
        res.send(pdfData);
      } else if (pdfData instanceof Uint8Array) {
        res.send(Buffer.from(pdfData));
      } else {
        res.send(pdfData);
      }
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Teacher Dashboard - Filtered by teacher's rooms
router.get('/teacher/dashboard', protectRoute, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can access dashboard' });
    }

    // Get all students from teacher's rooms
    const Room = (await import('../models/room.model.js')).default;
    const rooms = await Room.find({ 
      teacherId: req.user._id,
      isActive: true 
    });
    
    const studentIds = [];
    rooms.forEach(room => {
      studentIds.push(...room.students.map(id => id.toString()));
    });

    // If no rooms or students, return empty dashboard
    if (studentIds.length === 0) {
      return res.json({
        class_average: 0,
        weak_topics: [],
        top_students: [],
        total_students: 0,
        message: 'No students in your rooms yet'
      });
    }

    const result = await pythonService.getTeacherDashboard(studentIds);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Teaching Assistant
router.post('/teacher/assistant', protectRoute, async (req, res) => {
  try {
    const { query } = req.body;
    const result = await pythonService.askTeachingAssistant(query);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Plagiarism Checker
router.post('/check-plagiarism', protectRoute, async (req, res) => {
  try {
    const { text, referenceTexts } = req.body;
    const result = await pythonService.checkPlagiarism(text, referenceTexts);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test Assignment - Now supports roomId or studentIds
router.post('/assign-test', protectRoute, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can assign tests' });
    }

    const { paperId, studentIds, roomId, dueDate, teacherId } = req.body;
    
    let finalStudentIds = studentIds || [];
    
    // If roomId is provided, get students from that room
    if (roomId) {
      const Room = (await import('../models/room.model.js')).default;
      const room = await Room.findOne({ 
        _id: roomId,
        teacherId: req.user._id,
        isActive: true 
      });
      
      if (!room) {
        return res.status(404).json({ error: 'Room not found or you do not have access' });
      }
      
      finalStudentIds = room.students.map(id => id.toString());
    }
    
    // If no students found, return error
    if (!finalStudentIds || finalStudentIds.length === 0) {
      return res.status(400).json({ error: 'No students found. Please select a room or students.' });
    }

    const result = await pythonService.assignTest(
      paperId, 
      finalStudentIds, 
      dueDate, 
      teacherId || req.user._id.toString()
    );
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/assignments', protectRoute, async (req, res) => {
  try {
    // Support both teacher and student views
    if (req.user.role === 'teacher') {
      const teacherId = req.query.teacherId || req.user._id.toString();
      const result = await pythonService.getAssignments(teacherId, null);
      if (result.success) {
        res.json(result.data);
      } else {
        res.status(500).json({ error: result.error });
      }
    } else if (req.user.role === 'student') {
      const studentId = req.query.studentId || req.user._id.toString();
      const result = await pythonService.getAssignments(null, studentId);
      if (result.success) {
        res.json(result.data);
      } else {
        res.status(500).json({ error: result.error });
      }
    } else {
      res.status(403).json({ error: 'Invalid role' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/submit-assignment', protectRoute, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit assignments' });
    }

    const { assignment_id, student_id, answers, evaluation, percentage, submitted_at } = req.body;
    const finalStudentId = student_id || req.user._id.toString();
    
    // Submit assignment - Python service now saves synchronously to ensure data is persisted
    const result = await pythonService.submitAssignment(
      assignment_id,
      finalStudentId,
      answers,
      evaluation,
      percentage,
      submitted_at
    );
    
    if (result.success) {
      // Emit WebSocket event immediately after DB save (data is now persisted)
      const teacherId = result.data?.teacher_id;
      if (teacherId) {
        // Emit synchronously to ensure teacher gets notification
        try {
          const { emitToTeacher } = await import('../lib/websocket.js');
          emitToTeacher(teacherId, 'assignment:submitted', {
            assignment_id,
            student_id: finalStudentId,
            percentage,
            submitted_at: submitted_at || new Date().toISOString(),
            paper_title: result.data?.paper_title || 'Assignment'
          });
          console.log(`📢 WebSocket notification sent to teacher ${teacherId} for assignment ${assignment_id}`);
        } catch (wsError) {
          console.warn('WebSocket notification failed (non-critical):', wsError);
          // Continue even if WebSocket fails - polling will catch it
        }
      }
      
      // Return response
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/assignment-submissions/:assignmentId', protectRoute, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const result = await pythonService.getAssignmentSubmissions(assignmentId);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Teacher evaluation/review of submission
router.post('/update-submission-evaluation', protectRoute, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can evaluate submissions' });
    }

    const { assignment_id, student_id, teacher_feedback, updated_percentage, updated_evaluation } = req.body;
    
    const result = await pythonService.updateSubmissionEvaluation(
      assignment_id,
      student_id,
      teacher_feedback,
      updated_percentage,
      updated_evaluation
    );
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/share-paper/:paperId', protectRoute, async (req, res) => {
  try {
    const { paperId } = req.params;
    const result = await pythonService.sharePaper(paperId);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student Analytics - Filtered by teacher's rooms
router.get('/student-analytics', protectRoute, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can access student analytics' });
    }

    // Get all students from teacher's rooms
    const Room = (await import('../models/room.model.js')).default;
    const rooms = await Room.find({ 
      teacherId: req.user._id,
      isActive: true 
    });
    
    const studentIds = [];
    rooms.forEach(room => {
      studentIds.push(...room.students.map(id => id.toString()));
    });

    // If no rooms or students, return empty analytics
    if (studentIds.length === 0) {
      return res.json({
        students: [],
        total_students: 0,
        total_tests: 0,
        message: 'No students in your rooms yet'
      });
    }

    const result = await pythonService.getStudentAnalytics(studentIds);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health Check
router.get('/health', async (req, res) => {
  try {
    const result = await pythonService.healthCheck();
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

