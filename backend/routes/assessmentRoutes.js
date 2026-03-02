import express from 'express';
import Assessment from '../models/Assessment.js';
import Child from '../models/Child.js';
import { authMiddleware, roleMiddleware } from '../middleware/index.js';
import geminiService from '../services/gemini.service.js';
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
// @desc    Get ALL assessments for admin (including inactive)
// @access  Admin
router.get('/admin/all', roleMiddleware('admin'), async (req, res) => {
  try {
    const assessments = await Assessment.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/assessments/admin
// @desc    Create a new assessment
// @access  Admin
router.post('/admin', roleMiddleware('admin'), async (req, res) => {
  try {
    const { level, title, description, questions, formDefinition, isActive } = req.body;

    if (!level || !title || !description) {
      return res.status(400).json({ success: false, message: 'Level, title, and description are required' });
    }

    const assessment = await Assessment.create({
      level, title, description,
      questions: questions || [],
      formDefinition: formDefinition || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    console.error('Create assessment error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/assessments/admin/:id
// @desc    Update an assessment
// @access  Admin
router.put('/admin/:id', roleMiddleware('admin'), async (req, res) => {
  try {
    const { level, title, description, questions, formDefinition, isActive } = req.body;

    const assessment = await Assessment.findByIdAndUpdate(
      req.params.id,
      {
        ...(level && { level }),
        ...(title && { title }),
        ...(description && { description }),
        ...(questions !== undefined && { questions }),
        ...(formDefinition !== undefined && { formDefinition }),
        ...(isActive !== undefined && { isActive }),
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    );

    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    res.status(200).json({ success: true, data: assessment });
  } catch (error) {
    console.error('Update assessment error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/assessments/admin/:id
// @desc    Delete an assessment
// @access  Admin
router.delete('/admin/:id', roleMiddleware('admin'), async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
    res.status(200).json({ success: true, message: 'Assessment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────
// GEMINI AI — Generate Questions
// ─────────────────────────────────────────

// @route   POST /api/assessments/generate-questions
// @desc    Generate quiz questions using Gemini AI
// @access  Admin
router.post('/generate-questions', roleMiddleware('admin'), async (req, res) => {
  try {
    const { level = 'easy', categories, count = 5 } = req.body;
    const questions = await geminiService.generateQuizQuestions({ level, categories, count });
    res.status(200).json({ success: true, data: { questions } });
  } catch (error) {
    console.error('Gemini generate questions error:', error);
    const statusCode = error.message.includes('not configured') ? 503 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
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
    const { level } = req.body;

    const child = await Child.findById(childId).lean();
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    const quizzes = await childQuizService.generateAndSave(childId, level, req.user._id);

    res.status(200).json({
      success: true,
      message: `Quiz generated for ${child.name}`,
      data: { generated: quizzes.length, childName: child.name }
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
