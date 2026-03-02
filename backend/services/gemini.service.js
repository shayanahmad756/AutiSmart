/**
 * Gemini AI Service
 * Handles quiz generation using Google Gemini API
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

const VALID_CATEGORIES = [
  'Eye Contact',
  'Social Interaction',
  'Communication',
  'Repetitive Behavior',
  'Sensory Sensitivity',
  'Focus & Attention'
];

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = null;

    if (this.apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      } catch (err) {
        console.warn('⚠️  Gemini model initialization failed:', err.message);
      }
    }
  }

  _checkAvailability() {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to .env');
    }
    if (!this.model) {
      throw new Error('Gemini model is not initialized. Check your GEMINI_API_KEY.');
    }
  }

  /**
   * Parse JSON safely from Gemini response
   */
  _parseJSON(text) {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    return JSON.parse(cleaned);
  }

  /**
   * Generate quiz questions for global assessment (admin quiz builder)
   * @param {Object} params - { level, categories, count }
   */
  async generateQuizQuestions({ level, categories = VALID_CATEGORIES, count = 5 }) {
    this._checkAvailability();

    const levelDescriptions = {
      easy: 'basic observation-based questions suitable for initial autism screening',
      intermediate: 'situational and behavior-awareness questions at a moderate difficulty',
      advanced: 'complex reasoning and social-thinking questions',
      sensory: 'specialized sensory processing and attention questions'
    };

    const prompt = `You are an expert child psychologist specializing in autism spectrum disorder assessment.
Generate ${count} multiple-choice assessment questions for a ${level} level autism screening quiz.
Level description: ${levelDescriptions[level] || level}.
Focus on these categories: ${categories.join(', ')}.

IMPORTANT RULES:
- Each question must have EXACTLY 3 answer options
- Scores must be EXACTLY [1, 2, 3] — 1 = positive/typical, 2 = mixed/sometimes, 3 = concerning
- Questions should be observable behaviors a caregiver can report on
- Questions should be clear, non-clinical, and easy to understand
- Distribute categories as evenly as possible across the questions
- Each category must be exactly one of: ${VALID_CATEGORIES.join(', ')}

Return ONLY a valid JSON array (no markdown, no extra text) in this exact format:
[
  {
    "id": "${level}_gen_1",
    "category": "Social Interaction",
    "question": "Question text here?",
    "options": ["Positive option", "Mixed option", "Concerning option"],
    "scores": [1, 2, 3]
  }
]`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    let questions;
    try {
      questions = this._parseJSON(text);
    } catch {
      throw new Error('Gemini returned invalid JSON. Please try again.');
    }

    if (!Array.isArray(questions)) {
      throw new Error('Gemini did not return a question array. Please try again.');
    }

    // Validate and sanitize each question
    const timestamp = Date.now();
    return questions.map((q, i) => ({
      id: q.id || `${level}_gen_${timestamp}_${i + 1}`,
      category: VALID_CATEGORIES.includes(q.category) ? q.category : categories[i % categories.length],
      question: q.question || '',
      options: Array.isArray(q.options) && q.options.length === 3 ? q.options : ['Yes', 'Sometimes', 'No'],
      scores: Array.isArray(q.scores) && q.scores.length === 3 ? q.scores.map(Number) : [1, 2, 3]
    }));
  }

  /**
   * Generate personalized quiz for a specific child based on their past results
   * @param {Object} params - { child, level, pastResults }
   */
  async generateChildQuiz({ child, level, pastResults = [] }) {
    this._checkAvailability();

    // Build a summary of weak categories from past results
    const categoryAverages = {};
    if (pastResults.length > 0) {
      const categoryTotals = {};
      const categoryCounts = {};

      pastResults.forEach(result => {
        if (result.categoryScores) {
          Object.entries(result.categoryScores).forEach(([cat, data]) => {
            if (!categoryTotals[cat]) { categoryTotals[cat] = 0; categoryCounts[cat] = 0; }
            if (data.total > 0) {
              categoryTotals[cat] += data.score / data.total;
              categoryCounts[cat]++;
            }
          });
        }
      });

      Object.keys(categoryTotals).forEach(cat => {
        categoryAverages[cat] = (categoryTotals[cat] / categoryCounts[cat]).toFixed(2);
      });
    }

    const weakCategories = Object.entries(categoryAverages)
      .filter(([, avg]) => parseFloat(avg) > 1.8)
      .map(([cat]) => cat);

    const focusCategories = weakCategories.length > 0 ? weakCategories : VALID_CATEGORIES;

    const levelDescriptions = {
      easy: 'basic observation-based questions',
      intermediate: 'situational and behavior-awareness questions',
      advanced: 'complex reasoning and social-thinking questions',
      sensory: 'sensory processing and attention questions'
    };

    const childContext = [
      `Name: ${child.name}`,
      `Age: ${child.age} years old`,
      child.diagnosis ? `Diagnosis notes: ${child.diagnosis}` : null,
      child.specialNeeds ? `Special needs: ${child.specialNeeds}` : null,
      child.notes ? `Additional notes: ${child.notes}` : null,
      pastResults.length > 0
        ? `Past assessment average scores by category: ${JSON.stringify(categoryAverages)}`
        : 'This is the child\'s first assessment.',
      weakCategories.length > 0
        ? `Identified areas needing more attention: ${weakCategories.join(', ')}`
        : null
    ].filter(Boolean).join('\n');

    const prompt = `You are an expert child psychologist specializing in autism spectrum disorder assessment.
Generate 10 personalized multiple-choice assessment questions for the following child.

Child Profile:
${childContext}

Assessment level: ${level} (${levelDescriptions[level] || level})
Focus mainly on these categories (areas needing attention): ${focusCategories.join(', ')}

IMPORTANT RULES:
- Each question must have EXACTLY 3 answer options
- Scores must be EXACTLY [1, 2, 3] — 1 = positive/typical, 2 = mixed/sometimes, 3 = concerning
- Tailor questions to the child's age (${child.age} years old) and profile
- Questions should be observable behaviors a caregiver can report on
- Each category must be exactly one of: ${VALID_CATEGORIES.join(', ')}

Return ONLY a valid JSON array (no markdown, no extra text) in this exact format:
[
  {
    "id": "${child._id}_${level}_1",
    "category": "Social Interaction",
    "question": "Question text here?",
    "options": ["Positive option", "Mixed option", "Concerning option"],
    "scores": [1, 2, 3]
  }
]`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    let questions;
    try {
      questions = this._parseJSON(text);
    } catch {
      throw new Error('Gemini returned invalid JSON for child quiz. Please try again.');
    }

    if (!Array.isArray(questions)) {
      throw new Error('Gemini did not return a question array for child quiz.');
    }

    const timestamp = Date.now();
    return questions.map((q, i) => ({
      id: q.id || `${child._id}_${level}_${timestamp}_${i + 1}`,
      category: VALID_CATEGORIES.includes(q.category) ? q.category : focusCategories[i % focusCategories.length],
      question: q.question || '',
      options: Array.isArray(q.options) && q.options.length === 3 ? q.options : ['Yes', 'Sometimes', 'No'],
      scores: Array.isArray(q.scores) && q.scores.length === 3 ? q.scores.map(Number) : [1, 2, 3]
    }));
  }

  /**
   * Generate scenario-based rounds for Emotion Explorer levels 7-10
   * @param {Object} params - { child, level, levelName, pool, count }
   * @returns {Array} Array of { emotion, scenario, distractors }
   */
  async generateEmotionScenarios({ child, level, levelName, pool, count = 10 }) {
    this._checkAvailability();

    const prompt = `You are designing an emotion-recognition game for a child with autism.

Child Profile:
- Name: ${child.name}
- Age: ${child.age} years old
${child.specialNeeds ? `- Special needs: ${child.specialNeeds}` : ''}
${child.diagnosis ? `- Diagnosis notes: ${child.diagnosis}` : ''}

Task: Generate ${count} short everyday situations that cause a specific emotion.
Game level: ${level} (${levelName}) — use the FULL emotion list including subtle emotions.

Available emotions (use ONLY these exact strings): ${pool.join(', ')}

Rules:
1. Each scenario: 1–2 SHORT, SIMPLE sentences. Language suitable for a ${child.age}-year-old.
2. "emotion": the correct answer — must be one of the available emotions exactly as written.
3. "distractors": exactly 3 CLOSE/SIMILAR emotions from the available list (NOT the correct emotion). Make them challenging — similar enough that a child has to think carefully.
4. Situations should be relatable everyday experiences for a child.
5. Do NOT repeat the same emotion more than twice across all scenarios.

Return ONLY a valid JSON array (no markdown, no extra text):
[
  {
    "emotion": "Disappointed",
    "scenario": "You practiced drawing a picture for days, but your teacher chose someone else's work for the display.",
    "distractors": ["Sad", "Frustrated", "Annoyed"]
  }
]`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    let raw;
    try {
      raw = this._parseJSON(text);
    } catch {
      throw new Error('Gemini returned invalid JSON for emotion scenarios.');
    }

    if (!Array.isArray(raw)) {
      throw new Error('Gemini did not return a scenario array.');
    }

    const poolSet = new Set(pool);
    const validated = raw
      .filter(s =>
        s.emotion && poolSet.has(s.emotion) &&
        s.scenario && typeof s.scenario === 'string' &&
        Array.isArray(s.distractors)
      )
      .map(s => ({
        emotion: s.emotion,
        scenario: s.scenario.trim(),
        distractors: s.distractors
          .filter(d => poolSet.has(d) && d !== s.emotion)
          .slice(0, 3),
      }))
      .filter(s => s.distractors.length === 3)
      .slice(0, count);

    return validated;
  }

  /**
   * Generate encouraging feedback message for the Emotion Explorer game
   * @param {Object} params - { child, level, levelName, score, maxScore, correctAnswers, incorrectAnswers, emotionsStruggled }
   * @returns {string} A short, age-appropriate feedback message
   */
  async generateEmotionFeedback({ child, level, levelName, score, maxScore, correctAnswers, incorrectAnswers, emotionsStruggled = [] }) {
    this._checkAvailability();

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const totalAnswers = correctAnswers + incorrectAnswers;

    const performanceDesc =
      percentage >= 90 ? 'excellent' :
      percentage >= 70 ? 'great' :
      percentage >= 50 ? 'good' :
      'a solid attempt';

    const struggledText = emotionsStruggled.length > 0
      ? `The child had difficulty recognizing: ${emotionsStruggled.join(', ')}.`
      : 'The child recognized all emotions correctly.';

    const prompt = `You are a warm, encouraging child therapist writing a feedback message for a child with autism who just completed a game called "Emotion Explorer".

Child Profile:
- Name: ${child.name}
- Age: ${child.age} years old
${child.diagnosis ? `- Diagnosis notes: ${child.diagnosis}` : ''}
${child.specialNeeds ? `- Special needs: ${child.specialNeeds}` : ''}

Game Result:
- Level ${level} (${levelName})
- Score: ${score} out of ${maxScore} (${percentage}%)
- Correct answers: ${correctAnswers} out of ${totalAnswers}
- Performance: ${performanceDesc}
- ${struggledText}

Write a short (2–3 sentences MAX) feedback message that:
1. Addresses the child by name (${child.name})
2. Celebrates their effort warmly and specifically
3. If they struggled with emotions, gently encourages practice with those specific emotions
4. Uses simple, positive, age-appropriate language (the child is ${child.age} years old)
5. Ends with an enthusiastic motivational note for the next level

Return ONLY the plain text message — no quotes, no markdown, no extra commentary.`;

    const result = await this.model.generateContent(prompt);
    const feedback = result.response.text().trim();
    return feedback || `Amazing work, ${child.name}! You did a wonderful job exploring emotions today. Keep it up!`;
  }
}

export default new GeminiService();
