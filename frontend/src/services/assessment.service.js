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
   * Get all assessments (Admin)
   */
  async getAllAssessments(filters = {}) {
    return await assessmentAPI.getAllAssessments(filters);
  }

  /**
   * Get assessment by ID (Admin)
   */
  async getAssessmentById(assessmentId) {
    return await assessmentAPI.getAssessmentById(assessmentId);
  }

  /**
   * Create new assessment (Admin)
   */
  async createAssessment(assessmentData) {
    if (!assessmentData.title || !assessmentData.level || !assessmentData.description) {
      throw new Error('Title, level, and description are required');
    }
    return await assessmentAPI.createAssessment(assessmentData);
  }

  /**
   * Update assessment (Admin)
   */
  async updateAssessment(assessmentId, assessmentData) {
    return await assessmentAPI.updateAssessment(assessmentId, assessmentData);
  }

  /**
   * Toggle assessment status (Admin)
   */
  async toggleAssessmentStatus(assessmentId) {
    return await assessmentAPI.toggleAssessmentStatus(assessmentId);
  }

  /**
   * Delete assessment (Admin)
   */
  async deleteAssessment(assessmentId) {
    return await assessmentAPI.deleteAssessment(assessmentId);
  }

  /**
   * AI: Generate questions using Gemini
   */
  async generateQuestions({ level, categories, count }) {
    return await assessmentAPI.generateQuestions({ level, categories, count });
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
