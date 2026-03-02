import AssessmentResult from '../models/AssessmentResult.js';

class AssessmentResultDataAccess {
  async create(data) {
    return await AssessmentResult.create(data);
  }

  async findByChild(childId, limit = 20) {
    return await AssessmentResult.find({ childId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async findLatestByChild(childId) {
    return await AssessmentResult.find({ childId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
  }

  async findLatestByChildAndLevel(childId, level) {
    return await AssessmentResult.findOne({ childId, assessmentLevel: level })
      .sort({ createdAt: -1 })
      .lean();
  }

  async countByChild(childId) {
    return await AssessmentResult.countDocuments({ childId });
  }
}

export default new AssessmentResultDataAccess();
