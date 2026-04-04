/**
 * Child Data Access Layer
 * Handles all database operations for Child model
 */
import Child from '../models/Child.js';

class ChildDataAccess {
  /**
   * Create new child
   */
  async create(childData) {
    return await Child.create(childData);
  }

  /**
   * Find child by ID
   */
  async findById(id) {
    return await Child.findById(id);
  }

  /**
   * Find all children by caregiver ID
   */
  async findByCaregiverId(caregiverId) {
    return await Child.find({ caregiverId }).sort({ createdAt: -1 });
  }

  /**
   * Find all children
   */
  async findAll(filters = {}) {
    return await Child.find(filters).sort({ createdAt: -1 });
  }

  /**
   * Update child by ID
   */
  async updateById(id, updateData) {
    return await Child.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete child by ID
   */
  async deleteById(id) {
    return await Child.findByIdAndDelete(id);
  }

  /**
   * Count children by caregiver
   */
  async countByCaregiverId(caregiverId) {
    return await Child.countDocuments({ caregiverId });
  }

  /**
   * Count all children
   */
  async countAll(filters = {}) {
    return await Child.countDocuments(filters);
  }

  /**
   * Find child by ID and caregiver ID (for authorization)
   */
  async findByIdAndCaregiverId(id, caregiverId) {
    return await Child.findOne({ _id: id, caregiverId });
  }

  /**
   * Find all children belonging to any of the given caregiver IDs
   */
  async findByCaregiverIds(ids) {
    if (!ids || ids.length === 0) return [];
    return await Child.find({ caregiverId: { $in: ids } }).sort({ createdAt: -1 });
  }
}

export default new ChildDataAccess();
