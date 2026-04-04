import express from 'express';
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  toggleVerification,
  getUserStats,
  getAllAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  toggleAssessmentStatus,
  getExpertRequests,
  getExpertAssignments,
  approveExpertRequest,
  rejectExpertRequest,
  removeExpertAssignment,
} from '../controllers/adminController.js';
import { authMiddleware, roleMiddleware } from '../middleware/index.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// @route   GET /api/admin/stats
// @desc    Get user statistics
// @access  Private/Admin
router.get('/stats', getUserStats);

// ==================== USER ROUTES ====================

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Private/Admin
router.post('/users', createUser);

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', getAllUsers);

// @route   GET /api/admin/users/:id
// @desc    Get single user
// @access  Private/Admin
router.get('/users/:id', getUserById);

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id', updateUser);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.put('/users/:id/role', updateUserRole);

// @route   PUT /api/admin/users/:id/toggle-verification
// @desc    Toggle user verification status
// @access  Private/Admin
router.put('/users/:id/toggle-verification', toggleVerification);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', deleteUser);

// ==================== ASSESSMENT ROUTES ====================

// @route   GET /api/admin/assessments
// @desc    Get all assessments
// @access  Private/Admin
router.get('/assessments', getAllAssessments);

// @route   POST /api/admin/assessments
// @desc    Create new assessment
// @access  Private/Admin
router.post('/assessments', createAssessment);

// @route   PUT /api/admin/assessments/:id
// @desc    Update assessment
// @access  Private/Admin
router.put('/assessments/:id', updateAssessment);

// @route   PUT /api/admin/assessments/:id/toggle-status
// @desc    Toggle assessment active status
// @access  Private/Admin
router.put('/assessments/:id/toggle-status', toggleAssessmentStatus);

// @route   DELETE /api/admin/assessments/:id
// @desc    Delete assessment
// @access  Private/Admin
router.delete('/assessments/:id', deleteAssessment);

// ==================== EXPERT ASSIGNMENT ROUTES ====================

// @route   GET /api/admin/expert-requests
// @desc    Get all pending expert assignment requests
// @access  Private/Admin
router.get('/expert-requests', getExpertRequests);

// @route   GET /api/admin/expert-assignments
// @desc    Get all approved expert assignments
// @access  Private/Admin
router.get('/expert-assignments', getExpertAssignments);

// @route   PUT /api/admin/expert-requests/:caregiverId/:expertId/approve
// @desc    Approve an expert assignment request
// @access  Private/Admin
router.put('/expert-requests/:caregiverId/:expertId/approve', approveExpertRequest);

// @route   PUT /api/admin/expert-requests/:caregiverId/:expertId/reject
// @desc    Reject an expert assignment request
// @access  Private/Admin
router.put('/expert-requests/:caregiverId/:expertId/reject', rejectExpertRequest);

// @route   DELETE /api/admin/expert-assignments/:caregiverId/:expertId
// @desc    Remove an active expert assignment
// @access  Private/Admin
router.delete('/expert-assignments/:caregiverId/:expertId', removeExpertAssignment);

export default router;
