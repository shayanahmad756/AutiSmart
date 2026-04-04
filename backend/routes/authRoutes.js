import express from 'express';
import {
  register,
  verifyOtp,
  login,
  resendOtp,
  getProfile,
  changePassword,
  getExperts,
  requestExpert,
  cancelExpertRequest,
  getMyExpertRequests,
  getNotifications,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/index.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and activate account
// @access  Public
router.post('/verify-otp', verifyOtp);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to user email
// @access  Public
router.post('/resend-otp', resendOtp);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, getProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authMiddleware, changePassword);

// @route   GET /api/auth/experts
// @desc    List all experts (caregiver browses)
// @access  Private
router.get('/experts', authMiddleware, getExperts);

// @route   POST /api/auth/expert-request
// @desc    Caregiver requests an expert
// @access  Private (Caregiver)
router.post('/expert-request', authMiddleware, requestExpert);

// @route   DELETE /api/auth/expert-request/:expertId
// @desc    Caregiver cancels a pending expert request
// @access  Private (Caregiver)
router.delete('/expert-request/:expertId', authMiddleware, cancelExpertRequest);

// @route   GET /api/auth/my-expert-requests
// @desc    Caregiver views their own expert requests
// @access  Private (Caregiver)
router.get('/my-expert-requests', authMiddleware, getMyExpertRequests);

// @route   GET /api/auth/notifications
// @desc    Role-aware notifications from expert assignment state
// @access  Private
router.get('/notifications', authMiddleware, getNotifications);

export default router;
