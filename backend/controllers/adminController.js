/**
 * Admin Controller (Refactored)
 * Handles HTTP requests for admin operations and delegates to services
 */
import userService from '../services/user.service.js';
import assessmentService from '../services/assessment.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import User from '../models/User.js';

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private (Admin)
export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, verified } = req.query;
  
  const filters = {};
  if (role) filters.role = role;
  if (verified !== undefined) filters.isVerified = verified === 'true';

  const users = await userService.getAllUsers(filters);

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.params.id);

  res.status(200).json({
    success: true,
    message: result.message
  });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({
      success: false,
      message: 'Role is required'
    });
  }

  const user = await userService.updateUserRole(req.params.id, role);

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    data: user
  });
});

// @desc    Toggle user verification status
// @route   PUT /api/admin/users/:id/toggle-verification
// @access  Private (Admin)
export const toggleVerification = asyncHandler(async (req, res) => {
  const user = await userService.toggleVerificationStatus(req.params.id);

  res.status(200).json({
    success: true,
    message: 'User verification status updated',
    data: user
  });
});

// @desc    Get user statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStatistics();

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get all assessments
// @route   GET /api/admin/assessments
// @access  Private (Admin)
export const getAllAssessments = asyncHandler(async (req, res) => {
  const assessments = await assessmentService.getAllAssessments();

  res.status(200).json({
    success: true,
    count: assessments.length,
    data: assessments
  });
});

// @desc    Create assessment
// @route   POST /api/admin/assessments
// @access  Private (Admin)
export const createAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.createAssessment(req.body);

  res.status(201).json({
    success: true,
    message: 'Assessment created successfully',
    data: assessment
  });
});

// @desc    Update assessment
// @route   PUT /api/admin/assessments/:id
// @access  Private (Admin)
export const updateAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.updateAssessment(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Assessment updated successfully',
    data: assessment
  });
});

// @desc    Delete assessment
// @route   DELETE /api/admin/assessments/:id
// @access  Private (Admin)
export const deleteAssessment = asyncHandler(async (req, res) => {
  const result = await assessmentService.deleteAssessment(req.params.id);

  res.status(200).json({
    success: true,
    message: result.message
  });
});

// @desc    Toggle assessment status
// @route   PUT /api/admin/assessments/:id/toggle-status
// @access  Private (Admin)
export const toggleAssessmentStatus = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.toggleAssessmentStatus(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Assessment status updated',
    data: assessment
  });
});

// @desc    Get all pending expert requests across all caregivers
// @route   GET /api/admin/expert-requests
// @access  Private (Admin)
export const getExpertRequests = asyncHandler(async (req, res) => {
  const caregivers = await User.find({
    role: 'caregiver',
    'expertRequests.status': 'pending',
  })
    .populate('expertRequests.expertId', 'name email')
    .lean();

  const requests = [];
  for (const caregiver of caregivers) {
    for (const r of caregiver.expertRequests) {
      if (r.status === 'pending') {
        requests.push({
          caregiverId: caregiver._id,
          caregiverName: caregiver.name,
          caregiverEmail: caregiver.email,
          expertId: r.expertId?._id,
          expertName: r.expertId?.name,
          expertEmail: r.expertId?.email,
          requestedAt: r.requestedAt,
          requestId: r._id,
        });
      }
    }
  }

  res.status(200).json({ success: true, count: requests.length, data: requests });
});

// @desc    Get all approved expert assignments
// @route   GET /api/admin/expert-assignments
// @access  Private (Admin)
export const getExpertAssignments = asyncHandler(async (req, res) => {
  const caregivers = await User.find({
    role: 'caregiver',
    'expertRequests.status': 'approved',
  })
    .populate('expertRequests.expertId', 'name email')
    .lean();

  const assignments = [];
  for (const caregiver of caregivers) {
    for (const r of caregiver.expertRequests) {
      if (r.status === 'approved') {
        assignments.push({
          caregiverId: caregiver._id,
          caregiverName: caregiver.name,
          caregiverEmail: caregiver.email,
          expertId: r.expertId?._id,
          expertName: r.expertId?.name,
          expertEmail: r.expertId?.email,
          requestedAt: r.requestedAt,
        });
      }
    }
  }

  res.status(200).json({ success: true, count: assignments.length, data: assignments });
});

// @desc    Approve an expert request
// @route   PUT /api/admin/expert-requests/:caregiverId/:expertId/approve
// @access  Private (Admin)
export const approveExpertRequest = asyncHandler(async (req, res) => {
  const { caregiverId, expertId } = req.params;
  const caregiver = await User.findById(caregiverId);

  if (!caregiver) {
    return res.status(404).json({ success: false, message: 'Caregiver not found' });
  }

  const request = caregiver.expertRequests.find(
    (r) => r.expertId.toString() === expertId && r.status === 'pending'
  );
  if (!request) {
    return res.status(404).json({ success: false, message: 'Pending request not found' });
  }

  request.status = 'approved';
  await caregiver.save();

  res.status(200).json({ success: true, message: 'Expert assignment approved' });
});

// @desc    Reject an expert request
// @route   PUT /api/admin/expert-requests/:caregiverId/:expertId/reject
// @access  Private (Admin)
export const rejectExpertRequest = asyncHandler(async (req, res) => {
  const { caregiverId, expertId } = req.params;
  const caregiver = await User.findById(caregiverId);

  if (!caregiver) {
    return res.status(404).json({ success: false, message: 'Caregiver not found' });
  }

  const request = caregiver.expertRequests.find(
    (r) => r.expertId.toString() === expertId && r.status === 'pending'
  );
  if (!request) {
    return res.status(404).json({ success: false, message: 'Pending request not found' });
  }

  request.status = 'rejected';
  await caregiver.save();

  res.status(200).json({ success: true, message: 'Expert request rejected' });
});

// @desc    Remove an active expert assignment
// @route   DELETE /api/admin/expert-assignments/:caregiverId/:expertId
// @access  Private (Admin)
export const removeExpertAssignment = asyncHandler(async (req, res) => {
  const { caregiverId, expertId } = req.params;
  const caregiver = await User.findById(caregiverId);

  if (!caregiver) {
    return res.status(404).json({ success: false, message: 'Caregiver not found' });
  }

  const idx = caregiver.expertRequests.findIndex(
    (r) => r.expertId.toString() === expertId && r.status === 'approved'
  );
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  caregiver.expertRequests.splice(idx, 1);
  await caregiver.save();

  res.status(200).json({ success: true, message: 'Expert assignment removed' });
});
