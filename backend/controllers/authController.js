/**
 * Authentication Controller (Refactored)
 * Handles HTTP requests and delegates business logic to services
 */
import authService from '../services/auth.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import User from '../models/User.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: result.message,
    data: result.user,
  });
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!otp || !email) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP are required',
    });
  }

  const result = await authService.verifyOTP(email, otp);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: {
      token: result.token,
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    },
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  const result = await authService.resendOTP(email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  try {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: result.token,
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
      },
    });
  } catch (error) {
    // Handle specific login errors
    if (error.message === 'Invalid credentials' || 
        error.message === 'Please verify your email before logging in') {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
    throw error;
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required',
    });
  }

  const result = await authService.changePassword(
    req.user._id,
    currentPassword,
    newPassword
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// @desc    Get all experts (for caregivers to browse)
// @route   GET /api/auth/experts
// @access  Private
export const getExperts = asyncHandler(async (req, res) => {
  const experts = await User.find({ role: 'expert' })
    .select('name email role createdAt')
    .lean();

  res.status(200).json({ success: true, data: experts });
});

// @desc    Request an expert assignment
// @route   POST /api/auth/expert-request
// @access  Private (Caregiver)
export const requestExpert = asyncHandler(async (req, res) => {
  const { expertId } = req.body;

  if (!expertId) {
    return res.status(400).json({ success: false, message: 'Expert ID is required' });
  }

  if (req.user.role !== 'caregiver') {
    return res.status(403).json({ success: false, message: 'Only caregivers can request experts' });
  }

  const expert = await User.findById(expertId);
  if (!expert || expert.role !== 'expert') {
    return res.status(404).json({ success: false, message: 'Expert not found' });
  }

  const caregiver = await User.findById(req.user._id);
  const existing = caregiver.expertRequests.find(
    (r) => r.expertId.toString() === expertId && (r.status === 'pending' || r.status === 'approved')
  );
  if (existing) {
    return res.status(400).json({
      success: false,
      message: existing.status === 'pending' ? 'Request already pending' : 'Already assigned to this expert',
    });
  }

  caregiver.expertRequests.push({ expertId, status: 'pending', requestedAt: new Date() });
  await caregiver.save();

  res.status(201).json({ success: true, message: 'Expert assignment request sent successfully' });
});

// @desc    Cancel a pending expert request
// @route   DELETE /api/auth/expert-request/:expertId
// @access  Private (Caregiver)
export const cancelExpertRequest = asyncHandler(async (req, res) => {
  const { expertId } = req.params;

  if (req.user.role !== 'caregiver') {
    return res.status(403).json({ success: false, message: 'Only caregivers can cancel requests' });
  }

  const caregiver = await User.findById(req.user._id);
  const idx = caregiver.expertRequests.findIndex(
    (r) => r.expertId.toString() === expertId && r.status === 'pending'
  );
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Pending request not found' });
  }

  caregiver.expertRequests.splice(idx, 1);
  await caregiver.save();

  res.status(200).json({ success: true, message: 'Request cancelled' });
});

// @desc    Get caregiver's own expert requests
// @route   GET /api/auth/my-expert-requests
// @access  Private (Caregiver)
export const getMyExpertRequests = asyncHandler(async (req, res) => {
  if (req.user.role !== 'caregiver') {
    return res.status(403).json({ success: false, message: 'Only caregivers can view expert requests' });
  }

  const caregiver = await User.findById(req.user._id)
    .populate('expertRequests.expertId', 'name email')
    .lean();

  res.status(200).json({ success: true, data: caregiver.expertRequests || [] });
});

// @desc    Get role-aware notifications derived from expert assignment state
// @route   GET /api/auth/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const { role, _id: userId } = req.user;
  const notifications = [];

  if (role === 'caregiver') {
    const caregiver = await User.findById(userId)
      .populate('expertRequests.expertId', 'name')
      .lean();

    for (const r of caregiver?.expertRequests || []) {
      if (r.status === 'approved') {
        notifications.push({
          id: `${r._id || r.expertId?._id}-approved`,
          message: `✓ ${r.expertId?.name || 'An expert'} has been assigned to you`,
          type: 'success',
          createdAt: r.requestedAt,
        });
      } else if (r.status === 'rejected') {
        notifications.push({
          id: `${r._id || r.expertId?._id}-rejected`,
          message: `✗ Your request for ${r.expertId?.name || 'an expert'} was rejected`,
          type: 'danger',
          createdAt: r.requestedAt,
        });
      }
    }
  } else if (role === 'admin') {
    const caregivers = await User.find({
      role: 'caregiver',
      'expertRequests.status': 'pending',
    })
      .populate('expertRequests.expertId', 'name')
      .lean();

    for (const caregiver of caregivers) {
      for (const r of caregiver.expertRequests || []) {
        if (r.status === 'pending') {
          notifications.push({
            id: `${caregiver._id}-${r.expertId?._id || r.expertId}-pending`,
            message: `${caregiver.name} requested assignment to ${r.expertId?.name || 'an expert'}`,
            type: 'warning',
            createdAt: r.requestedAt,
          });
        }
      }
    }
  } else if (role === 'expert') {
    const caregivers = await User.find({
      role: 'caregiver',
      expertRequests: { $elemMatch: { expertId: userId, status: 'approved' } },
    })
      .select('name expertRequests')
      .lean();

    for (const caregiver of caregivers) {
      const req2 = (caregiver.expertRequests || []).find(
        (r) => r.expertId?.toString() === userId.toString() && r.status === 'approved'
      );
      notifications.push({
        id: `${caregiver._id}-assigned`,
        message: `You are assigned to ${caregiver.name}'s children`,
        type: 'info',
        createdAt: req2?.requestedAt,
      });
    }
  }

  // Sort most recent first
  notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  res.status(200).json({ success: true, data: notifications });
});
