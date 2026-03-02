import ChildQuiz from '../models/ChildQuiz.js';

class ChildQuizDataAccess {
  async upsert(childId, level, data) {
    return await ChildQuiz.findOneAndUpdate(
      { childId, level },
      {
        ...data,
        childId,
        level,
        $inc: { iteration: 1 }
      },
      { new: true, upsert: true, runValidators: true }
    );
  }

  async findByChildAndLevel(childId, level) {
    return await ChildQuiz.findOne({ childId, level }).lean();
  }

  async findAllByChild(childId) {
    return await ChildQuiz.find({ childId }).lean();
  }

  async deleteByChild(childId) {
    return await ChildQuiz.deleteMany({ childId });
  }
}

export default new ChildQuizDataAccess();
