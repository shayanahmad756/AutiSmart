import childQuizDataAccess from '../dataAccess/childQuiz.dataAccess.js';
import assessmentResultDataAccess from '../dataAccess/assessmentResult.dataAccess.js';
import Assessment from '../models/Assessment.js';
import Child from '../models/Child.js';
import geminiService from './gemini.service.js';

const LEVELS = ['easy', 'intermediate', 'advanced', 'sensory'];

class ChildQuizService {
  /**
   * Get quiz for a child — returns personalized quiz if exists, falls back to global assessment
   */
  async getQuizForChild(childId) {
    const result = {};

    for (const level of LEVELS) {
      // Try personalized quiz first
      const childQuiz = await childQuizDataAccess.findByChildAndLevel(childId, level);

      if (childQuiz) {
        result[level] = {
          id: childQuiz._id,
          level: childQuiz.level,
          title: childQuiz.title,
          description: childQuiz.description,
          questions: childQuiz.questions,
          isPersonalized: true,
          iteration: childQuiz.iteration
        };
      } else {
        // Fall back to global active assessment
        const globalAssessment = await Assessment.findOne({ level, isActive: true })
          .select('level title description questions')
          .lean();

        if (globalAssessment) {
          result[level] = {
            id: globalAssessment._id,
            level: globalAssessment.level,
            title: globalAssessment.title,
            description: globalAssessment.description,
            questions: globalAssessment.questions,
            isPersonalized: false,
            iteration: 0
          };
        }
      }
    }

    return result;
  }

  /**
   * Admin-triggered: generate and save a personalized quiz for a child
   */
  async generateAndSave(childId, level, adminUserId) {
    const child = await Child.findById(childId).lean();
    if (!child) throw new Error('Child not found');

    const levelsToGenerate = level ? [level] : LEVELS;
    const pastResults = await assessmentResultDataAccess.findLatestByChild(childId);
    const generated = [];

    for (const lvl of levelsToGenerate) {
      const questions = await geminiService.generateChildQuiz({
        child,
        level: lvl,
        pastResults
      });

      const quiz = await childQuizDataAccess.upsert(childId, lvl, {
        title: `${child.name}'s Personalized ${lvl.charAt(0).toUpperCase() + lvl.slice(1)} Quiz`,
        description: `Adaptive quiz tailored to ${child.name}'s progress`,
        questions,
        generatedBy: adminUserId ? adminUserId.toString() : 'ai'
      });

      generated.push(quiz);
    }

    return generated;
  }

  /**
   * Get quiz metadata for all children (admin overview)
   */
  async getAllChildrenQuizSummary(childIds) {
    const summaries = [];
    for (const childId of childIds) {
      const quizzes = await childQuizDataAccess.findAllByChild(childId);
      summaries.push({
        childId,
        quizCount: quizzes.length,
        levels: quizzes.map(q => ({
          level: q.level,
          iteration: q.iteration,
          updatedAt: q.updatedAt
        }))
      });
    }
    return summaries;
  }
}

export default new ChildQuizService();
