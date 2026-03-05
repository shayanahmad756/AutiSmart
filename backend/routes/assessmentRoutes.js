import express from 'express';
import Assessment from '../models/Assessment.js';
import Child from '../models/Child.js';
import { authMiddleware, roleMiddleware } from '../middleware/index.js';
import assessmentResultService from '../services/assessmentResult.service.js';
import childQuizService from '../services/childQuiz.service.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ─────────────────────────────────────────
// GLOBAL ASSESSMENTS
// ─────────────────────────────────────────

// @route   GET /api/assessments
// @desc    Get all active assessments (grouped by level)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const assessments = await Assessment.find({ isActive: true })
      .select('-createdBy -updatedBy')
      .sort({ level: 1 });

    const assessmentsByLevel = { easy: null, intermediate: null, advanced: null, sensory: null };

    assessments.forEach(assessment => {
      assessmentsByLevel[assessment.level] = {
        id: assessment._id,
        level: assessment.level,
        title: assessment.title,
        description: assessment.description,
        questions: assessment.questions,
        formDefinition: assessment.formDefinition || []
      };
    });

    res.status(200).json({ success: true, data: assessmentsByLevel });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching assessments', error: error.message });
  }
});

// @route   GET /api/assessments/admin/all
// @desc    Get ALL assessments for admin reference (read-only)
// @access  Admin
router.get('/admin/all', roleMiddleware('admin'), async (req, res) => {
  try {
    const assessments = await Assessment.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────
// CHILD QUIZZES & RESULTS
// ─────────────────────────────────────────

// @route   GET /api/assessments/child/:childId/quiz
// @desc    Get personalized quiz for a child (falls back to global)
// @access  Private (caregiver/admin)
router.get('/child/:childId/quiz', async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await Child.findById(childId).lean();
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    if (req.user.role !== 'admin' && child.caregiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const quizData = await childQuizService.getQuizForChild(childId);
    res.status(200).json({ success: true, data: quizData });
  } catch (error) {
    console.error('Get child quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/assessments/child/:childId/generate
// @desc    Admin-triggered: generate personalized quiz for a child
// @access  Admin
router.post('/child/:childId/generate', roleMiddleware('admin'), async (req, res) => {
  try {
    const { childId } = req.params;

    const child = await Child.findById(childId).lean();
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    const quiz = await childQuizService.generateAndSave(childId, req.user._id);

    res.status(200).json({
      success: true,
      message: `Quiz generated for ${child.name}`,
      data: { childName: child.name, questions: quiz.questions.length }
    });
  } catch (error) {
    console.error('Generate child quiz error:', error);
    const statusCode = error.message.includes('not configured') ? 503 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
});

// @route   POST /api/assessments/results
// @desc    Save a child's assessment submission
// @access  Private
router.post('/results', async (req, res) => {
  try {
    const { childId, totalScore, totalQuestions, categoryScores, answers, assessmentLevel } = req.body;

    if (!childId || totalScore === undefined || !totalQuestions) {
      return res.status(400).json({ success: false, message: 'childId, totalScore, and totalQuestions are required' });
    }

    const child = await Child.findById(childId).lean();
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    if (req.user.role !== 'admin' && child.caregiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const saved = await assessmentResultService.saveResult(
      childId,
      { totalScore, totalQuestions, categoryScores, answers, assessmentLevel },
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: 'Result saved. Personalized quiz is being updated in the background.',
      data: { resultId: saved._id, autismLevel: saved.autismLevel, scorePercentage: saved.scorePercentage }
    });
  } catch (error) {
    console.error('Save result error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/assessments/child/:childId/results
// @desc    Get past assessment results for a child
// @access  Private (caregiver/admin)
router.get('/child/:childId/results', async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await Child.findById(childId).lean();
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    if (req.user.role !== 'admin' && child.caregiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const results = await assessmentResultService.getResultsByChild(childId);
    const stats = await assessmentResultService.getChildStats(childId);

    res.status(200).json({ success: true, data: { results, stats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/assessments/:level
// @desc    Get active assessment by level (backward compatibility)
// @access  Private
router.get('/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const validLevels = ['easy', 'intermediate', 'advanced', 'sensory'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ success: false, message: 'Invalid level. Must be one of: easy, intermediate, advanced, sensory' });
    }

    const assessment = await Assessment.findOne({ level, isActive: true }).select('-createdBy -updatedBy');

    if (!assessment) {
      return res.status(404).json({ success: false, message: `No active assessment found for level "${level}"` });
    }

    res.status(200).json({
      success: true,
      data: {
        id: assessment._id,
        level: assessment.level,
        title: assessment.title,
        description: assessment.description,
        questions: assessment.questions,
        formDefinition: assessment.formDefinition || []
      }
    });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching assessment', error: error.message });
  }
});

export default router;
