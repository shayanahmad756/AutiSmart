/**
 * Recommendation Service
 * Analyzes a child's latest assessment category scores and ranks therapy games
 * by how much they address the child's specific autism problem areas.
 */
import assessmentResultDataAccess from '../dataAccess/assessmentResult.dataAccess.js';

// Maps each active game to the 2 autism categories it most directly addresses.
// Game IDs match the `id` values in the frontend Games.jsx games array.
const GAME_PROBLEM_MAP = [
  {
    id: 1,
    name: 'Memory Match',
    categories: ['Focus & Attention', 'Repetitive Behavior'],
    route: '/games/memory-match',
  },
  {
    id: 2,
    name: 'Sound Matching',
    categories: ['Sensory Sensitivity', 'Communication'],
    route: '/games/sound-matching',
  },
  {
    id: 10,
    name: 'Color Matching',
    categories: ['Focus & Attention', 'Sensory Sensitivity'],
    route: '/games/color-matching',
  },
  {
    id: 3,
    name: 'Emotion Explorer',
    categories: ['Eye Contact', 'Social Interaction'],
    route: '/games/emotion-explorer',
  },
  {
    id: 11,
    name: 'Communication Builder',
    categories: ['Communication', 'Social Interaction'],
    route: '/games/communication-builder',
  },
];

// Severity threshold: a category with (score / total) above this value is treated
// as a problem area. Aligns with the "Beginner Level" boundary in AssessmentResult.js.
const SEVERITY_THRESHOLD = 0.40;

/**
 * Calculate game recommendations for a child based on their latest assessment.
 *
 * @param {string} childId - MongoDB ObjectId of the child
 * @returns {Promise<Object>} Result object:
 *   - hasAssessment (boolean): false if no assessment exists for this child
 *   - assessmentDate (Date|undefined): date of the latest assessment
 *   - autismLevel (string|undefined): "Beginner Level" / "Intermediate Level" / "Advanced Level"
 *   - recommendations (Array): games sorted by relevanceScore descending, each with:
 *       id, name, route, relevanceScore, isRecommended, problemAreas, targetedCategories
 */
const getGameRecommendations = async (childId) => {
  const results = await assessmentResultDataAccess.findLatestByChild(childId);

  if (!results || results.length === 0) {
    return { hasAssessment: false, recommendations: [] };
  }

  const latestResult = results[0];
  const categoryScores = latestResult.categoryScores || {};

  // Compute severity (0.0–1.0) for each assessed category
  const severities = {};
  for (const [category, data] of Object.entries(categoryScores)) {
    const score = data.score || 0;
    const total = data.total || 1;
    severities[category] = total > 0 ? score / total : 0;
  }

  // Score each game based on its targeted categories
  const recommendations = GAME_PROBLEM_MAP.map((game) => {
    let relevanceScore = 0;
    const problemAreas = [];

    for (const category of game.categories) {
      const severity = severities[category] || 0;
      if (severity > SEVERITY_THRESHOLD) {
        relevanceScore += severity;
        problemAreas.push(category);
      }
    }

    return {
      id: game.id,
      name: game.name,
      route: game.route,
      relevanceScore: Math.round(relevanceScore * 10000) / 10000,
      isRecommended: relevanceScore > 0,
      problemAreas,
      targetedCategories: game.categories,
    };
  });

  // Sort by relevance score descending (most relevant game first)
  recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return {
    hasAssessment: true,
    assessmentDate: latestResult.createdAt,
    autismLevel: latestResult.autismLevel,
    recommendations,
  };
};

export default { getGameRecommendations };
