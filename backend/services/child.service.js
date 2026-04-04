/**
 * Child Service
 * Handles business logic for child management operations
 */
import childDataAccess from '../dataAccess/child.dataAccess.js';
import activityDataAccess from '../dataAccess/activity.dataAccess.js';
import User from '../models/User.js';

class ChildService {
  /**
   * Add a new child
   */
  async addChild(caregiverId, childData) {
    const { name, age, gender, dateOfBirth, diagnosis, specialNeeds, notes, profileImage } = childData;

    if (!name || !age || !gender) {
      throw new Error('Name, age, and gender are required');
    }

    const newChildData = {
      caregiverId,
      name,
      age: parseInt(age),
      gender,
      dateOfBirth: dateOfBirth || null,
      diagnosis: diagnosis || '',
      specialNeeds: specialNeeds || '',
      notes: notes || '',
      profileImage: profileImage || ''
    };

    const child = await childDataAccess.create(newChildData);
    return child;
  }

  /**
   * Get all children for a caregiver
   */
  async getChildrenByCaregiver(caregiverId) {
    const children = await childDataAccess.findByCaregiverId(caregiverId);
    return children;
  }

  /**
   * Get all children (for admins — unfiltered)
   */
  async getAllChildren() {
    const children = await childDataAccess.findAll();
    return children;
  }

  /**
   * Get the caregiver IDs that have approved this expert
   */
  async getAssignedCaregiverIds(expertId) {
    const caregivers = await User.find({
      role: 'caregiver',
      expertRequests: { $elemMatch: { expertId, status: 'approved' } },
    })
      .select('_id')
      .lean();
    return caregivers.map((c) => c._id);
  }

  /**
   * Get all children for an expert (scoped to assigned caregivers only)
   */
  async getAllChildrenForExpert(expertId) {
    const assignedIds = await this.getAssignedCaregiverIds(expertId);
    return childDataAccess.findByCaregiverIds(assignedIds);
  }

  /**
   * Get child by ID for an expert (verifies the child belongs to an assigned caregiver)
   */
  async getChildByIdForExpert(childId, expertId) {
    const child = await childDataAccess.findById(childId);
    if (!child) throw new Error('Child not found');

    const assignedIds = await this.getAssignedCaregiverIds(expertId);
    const isAssigned = assignedIds.some((id) => id.toString() === child.caregiverId.toString());
    if (!isAssigned) throw new Error('Access denied');

    return child;
  }

  /**
   * Get child by ID
   */
  async getChildById(childId, caregiverId = null) {
    let child;
    
    if (caregiverId) {
      // For caregivers, ensure they own the child
      child = await childDataAccess.findByIdAndCaregiverId(childId, caregiverId);
    } else {
      // For experts/admins
      child = await childDataAccess.findById(childId);
    }

    if (!child) {
      throw new Error('Child not found');
    }

    return child;
  }

  /**
   * Update child
   */
  async updateChild(childId, caregiverId, updateData) {
    // Verify ownership
    const child = await childDataAccess.findByIdAndCaregiverId(childId, caregiverId);
    
    if (!child) {
      throw new Error('Child not found or access denied');
    }

    const updatedChild = await childDataAccess.updateById(childId, updateData);
    return updatedChild;
  }

  /**
   * Delete child
   */
  async deleteChild(childId, caregiverId) {
    // Verify ownership
    const child = await childDataAccess.findByIdAndCaregiverId(childId, caregiverId);
    
    if (!child) {
      throw new Error('Child not found or access denied');
    }

    // Delete child's activities
    await activityDataAccess.deleteByChildId(childId);

    // Delete child
    await childDataAccess.deleteById(childId);

    return { message: 'Child and associated data deleted successfully' };
  }

  /**
   * Get child statistics
   */
  async getChildStatistics(childId) {
    const activities = await activityDataAccess.findByChildId(childId, 1000);

    if (activities.length === 0) {
      return {
        totalActivities: 0,
        averageScore: 0,
        totalGames: 0,
        totalAssessments: 0,
        totalTherapySessions: 0,
        byActivityType: {},
        progressOverTime: [],
        recentActivities: [],
        gamesList: [],
        assessmentsList: []
      };
    }

    const stats = {
      totalActivities: activities.length,
      averageScore: 0,
      totalGames: 0,
      totalAssessments: 0,
      totalTherapySessions: 0,
      byActivityType: {},
      progressOverTime: [],
      recentActivities: activities.slice(0, 10),
      gamesList: [],
      assessmentsList: []
    };

    let totalScore = 0;

    activities.forEach(activity => {
      totalScore += activity.percentage || 0;

      if (activity.activityType === 'game') {
        stats.totalGames++;
        stats.gamesList.push({
          name: activity.activityName,
          score: activity.percentage,
          completedAt: activity.completedAt,
          timeTaken: activity.timeTaken
        });
      }
      if (activity.activityType === 'assessment') {
        stats.totalAssessments++;
        stats.assessmentsList.push({
          name: activity.activityName,
          score: activity.percentage,
          completedAt: activity.completedAt,
          category: activity.category || 'General'
        });
      }
      if (activity.activityType === 'therapy') stats.totalTherapySessions++;

      if (!stats.byActivityType[activity.activityName]) {
        stats.byActivityType[activity.activityName] = {
          count: 0,
          totalScore: 0,
          averageScore: 0
        };
      }
      stats.byActivityType[activity.activityName].count++;
      stats.byActivityType[activity.activityName].totalScore += activity.percentage || 0;
    });

    stats.averageScore = totalScore / activities.length;

    Object.keys(stats.byActivityType).forEach(key => {
      const data = stats.byActivityType[key];
      data.averageScore = data.totalScore / data.count;
    });

    const progressMap = {};
    activities.forEach(activity => {
      const date = activity.completedAt.toISOString().split('T')[0];
      
      if (!progressMap[date]) {
        progressMap[date] = { date, count: 0, totalScore: 0 };
      }
      progressMap[date].count++;
      progressMap[date].totalScore += activity.percentage || 0;
    });

    stats.progressOverTime = Object.values(progressMap)
      .map(item => ({
        ...item,
        averageScore: item.totalScore / item.count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return stats;
  }

  /**
   * Get child activities
   */
  async getChildActivities(childId, activityType = null, limit = null) {
    if (activityType) {
      return await activityDataAccess.findByChildIdAndType(childId, activityType, limit);
    }
    return await activityDataAccess.findByChildId(childId, limit);
  }

  /**
   * Add activity for child
   */
  async addActivity(childId, activityData) {
    const activityRecord = {
      childId,
      ...activityData
    };

    const activity = await activityDataAccess.create(activityRecord);
    return activity;
  }
}

export default new ChildService();
