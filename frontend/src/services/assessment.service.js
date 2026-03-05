import assessmentAPI from '../api/assessment.api';

/**
 * Assessment Service
 * Business logic for assessment operations
 */
class AssessmentService {
  /**
   * Get all active assessments
   */
  async getAssessments() {
    return await assessmentAPI.getAssessments();
  }

  /**
   * Get assessment by level
   */
  async getAssessmentByLevel(level) {
    // Validate level
    const validLevels = ['easy', 'intermediate', 'advanced', 'sensory'];
    if (!validLevels.includes(level)) {
      throw new Error('Invalid assessment level');
    }

    return await assessmentAPI.getAssessmentByLevel(level);
  }

  /**
   * Get all assessments (Admin - read-only reference)
   */
  async getAllAssessments(filters = {}) {
    return await assessmentAPI.getAllAssessments(filters);
  }

  /**
   * Get personalized quiz for a child (falls back to global)
   */
  async getChildQuiz(childId) {
    return await assessmentAPI.getChildQuiz(childId);
  }

  /**
   * Admin: Generate personalized AI quiz for a child
   */
  async generateChildQuiz(childId, level) {
    return await assessmentAPI.generateChildQuiz(childId, level);
  }

  /**
   * Submit assessment results for a child
   */
  async submitResult(childId, resultData) {
    return await assessmentAPI.submitResult(childId, resultData);
  }

  /**
   * Get past results for a child
   */
  async getChildResults(childId) {
    return await assessmentAPI.getChildResults(childId);
  }

  /**
   * Calculate assessment score
   */
  calculateScore(answers, questions) {
    if (!answers || !questions || questions.length === 0) {
      return 0;
    }

    let correctCount = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    return Math.round((correctCount / questions.length) * 100);
  }

  /**
   * Get assessment level label
   */
  getLevelLabel(level) {
    const labels = {
      easy: 'Easy',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      sensory: 'Sensory',
    };
    return labels[level] || level;
  }

  /**
   * Get assessment category label
   */
  getCategoryLabel(category) {
    const labels = {
      communication: 'Communication Skills',
      social: 'Social Skills',
      cognitive: 'Cognitive Skills',
      motor: 'Motor Skills',
      sensory: 'Sensory Processing',
    };
    return labels[category] || category;
  }

  /**
   * Format assessment for display
   */
  formatAssessmentForDisplay(assessment) {
    return {
      ...assessment,
      levelLabel: this.getLevelLabel(assessment.level),
      categoryLabel: this.getCategoryLabel(assessment.category),
      questionCount: assessment.questions?.length || 0,
      statusLabel: assessment.isActive ? 'Active' : 'Inactive',
    };
  }
}

export default new AssessmentService();
