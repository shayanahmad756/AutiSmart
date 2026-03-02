import assessmentResultDataAccess from '../dataAccess/assessmentResult.dataAccess.js';
import childQuizDataAccess from '../dataAccess/childQuiz.dataAccess.js';
import Child from '../models/Child.js';
import geminiService from './gemini.service.js';

class AssessmentResultService {
  /**
   * Determine autism level label from score percentage
   */
  _getAutismLevel(scorePercentage) {
    if (scorePercentage <= 40) return 'Beginner Level';
    if (scorePercentage <= 60) return 'Intermediate Level';
    return 'Advanced Level';
  }

  /**
   * Save a child's assessment submission, then async-trigger AI quiz regeneration
   */
  async saveResult(childId, resultData, userId) {
    const { totalScore, totalQuestions, categoryScores, answers, assessmentLevel } = resultData;

    const scorePercentage = Math.round((totalScore / (totalQuestions * 3)) * 100);
    const autismLevel = this._getAutismLevel(scorePercentage);

    const saved = await assessmentResultDataAccess.create({
      childId,
      submittedBy: userId,
      assessmentLevel: assessmentLevel || 'all',
      totalScore,
      totalQuestions,
      scorePercentage,
      autismLevel,
      categoryScores: categoryScores || {},
      answers: answers || []
    });

    // Trigger AI quiz regeneration asynchronously (non-blocking)
    this._regenerateChildQuizAsync(childId, assessmentLevel).catch(err => {
      console.warn(`⚠️  Async quiz regeneration failed for child ${childId}:`, err.message);
    });

    return saved;
  }

  /**
   * Async helper — regenerates child quiz after submission (non-blocking)
   */
  async _regenerateChildQuizAsync(childId, level) {
    const levels = level && level !== 'all'
      ? [level]
      : ['easy', 'intermediate', 'advanced', 'sensory'];

    const child = await Child.findById(childId).lean();
    if (!child) return;

    const pastResults = await assessmentResultDataAccess.findLatestByChild(childId);

    for (const lvl of levels) {
      try {
        const questions = await geminiService.generateChildQuiz({
          child,
          level: lvl,
          pastResults
        });

        await childQuizDataAccess.upsert(childId, lvl, {
          title: `${child.name}'s Personalized ${lvl.charAt(0).toUpperCase() + lvl.slice(1)} Quiz`,
          description: `Adaptive quiz tailored to ${child.name}'s progress`,
          questions,
          generatedBy: 'ai'
        });

        console.log(`✅ Child quiz regenerated for ${child.name} — level: ${lvl}`);
      } catch (err) {
        console.warn(`⚠️  Failed to regenerate quiz for child ${child.name}, level ${lvl}:`, err.message);
      }
    }
  }

  /**
   * Get all results for a child
   */
  async getResultsByChild(childId) {
    return await assessmentResultDataAccess.findByChild(childId);
  }

  /**
   * Get summary stats for a child
   */
  async getChildStats(childId) {
    const results = await assessmentResultDataAccess.findByChild(childId);
    if (results.length === 0) return null;

    const latest = results[0];
    const totalAttempts = results.length;
    const avgScore = Math.round(results.reduce((s, r) => s + r.scorePercentage, 0) / totalAttempts);

    return { latest, totalAttempts, avgScore };
  }
}

export default new AssessmentResultService();
