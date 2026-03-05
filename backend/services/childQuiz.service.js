import childQuizDataAccess from '../dataAccess/childQuiz.dataAccess.js';
import assessmentResultDataAccess from '../dataAccess/assessmentResult.dataAccess.js';
import Child from '../models/Child.js';
import geminiService from './gemini.service.js';

// Single stored level key — DB schema requires one of the enum values
const QUIZ_LEVEL = 'easy';

class ChildQuizService {
  /**
   * Get the personalized quiz for a child.
   * Returns the quiz if it exists, otherwise returns a pending placeholder.
   */
  async getQuizForChild(childId) {
    const childQuiz = await childQuizDataAccess.findByChildAndLevel(childId, QUIZ_LEVEL);

    if (childQuiz) {
      return {
        id: childQuiz._id,
        title: childQuiz.title,
        description: childQuiz.description,
        questions: childQuiz.questions,
        isPersonalized: true,
        iteration: childQuiz.iteration
      };
    }

    // No quiz yet — generation is in progress or has not started
    return {
      title: 'Personalized Assessment Quiz',
      description: 'Your personalized quiz is being prepared by Groq AI...',
      questions: [],
      isPersonalized: false,
      pending: true,
      iteration: 0
    };
  }

  /**
   * Generate and persist a single personalized quiz for a child.
   * Called on child create/update and via admin regenerate endpoint.
   */
  async generateAndSave(childId, adminUserId) {
    const child = await Child.findById(childId).lean();
    if (!child) throw new Error('Child not found');

    const pastResults = await assessmentResultDataAccess.findLatestByChild(childId);
    const questions = await geminiService.generateChildQuiz({ child, pastResults });

    const quiz = await childQuizDataAccess.upsert(childId, QUIZ_LEVEL, {
      title: `${child.name}'s Personalized Assessment Quiz`,
      description: `Adaptive quiz tailored to ${child.name}'s profile and progress`,
      questions,
      generatedBy: adminUserId ? adminUserId.toString() : 'ai'
    });

    return quiz;
  }

  /**
   * Get quiz metadata for all children (admin overview)
   */
  async getAllChildrenQuizSummary(childIds) {
    const summaries = [];
    for (const childId of childIds) {
      const quiz = await childQuizDataAccess.findByChildAndLevel(childId, QUIZ_LEVEL);
      summaries.push({
        childId,
        hasQuiz: !!quiz,
        iteration: quiz?.iteration || 0,
        updatedAt: quiz?.updatedAt || null
      });
    }
    return summaries;
  }
}

export default new ChildQuizService();
