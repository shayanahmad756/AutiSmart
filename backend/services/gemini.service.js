/**
 * AI Service (Groq)
 * Handles quiz generation using Groq API
 */
import Groq from 'groq-sdk';

const VALID_CATEGORIES = [
  'Eye Contact',
  'Social Interaction',
  'Communication',
  'Repetitive Behavior',
  'Sensory Sensitivity',
  'Focus & Attention'
];

const GROQ_MODEL = 'llama-3.3-70b-versatile';

class GeminiService {
  constructor() {
    this.groq = null;
    this._initialized = false;

    // Rate-limit queue — free tier allows 30 RPM; enforce 1 call per 3 s → ≤ 20 RPM
    this._queue = [];
    this._processing = false;
    this._MIN_INTERVAL_MS = 3000;
    this._lastCallAt = 0;
  }

  /**
   * Serialise every model.generateContent call so concurrent requests never
   * burst past the free-tier rate limit (30 RPM).
   */
  _enqueue(fn) {
    return new Promise((resolve, reject) => {
      this._queue.push({ fn, resolve, reject });
      this._drain();
    });
  }

  async _drain() {
    if (this._processing || this._queue.length === 0) return;
    this._processing = true;
    while (this._queue.length > 0) {
      const wait = Math.max(0, this._MIN_INTERVAL_MS - (Date.now() - this._lastCallAt));
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
      const { fn, resolve, reject } = this._queue.shift();
      try {
        this._lastCallAt = Date.now();
        resolve(await fn());
      } catch (err) {
        reject(err);
      }
    }
    this._processing = false;
  }

  // Lazy-initialize on first use — guarantees dotenv has already run
  _init() {
    if (this._initialized) return;
    this._initialized = true;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('[Groq] ❌ GROQ_API_KEY is missing from environment variables. Add it to backend/.env');
      return;
    }

    const maskedKey = `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
    console.log(`[Groq] 🔑 Initializing with API key: ${maskedKey}`);

    try {
      this.groq = new Groq({ apiKey });
      console.log(`[Groq] ✅ API key accepted — model "${GROQ_MODEL}" initialized and ready`);
    } catch (err) {
      console.error('[Groq] ❌ Initialization failed — invalid API key or network error:', err.message);
      this.groq = null;
    }
  }

  _checkAvailability() {
    this._init();
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not configured. Please add GROQ_API_KEY to .env');
    }
    if (!this.groq) {
      throw new Error('Groq client is not initialized. Check your GROQ_API_KEY.');
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
    console.log(`[Groq] generateQuizQuestions called — level: ${level}, count: ${count}`);
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

Return a JSON object with a "questions" key containing the array, in this exact format:
{
  "questions": [
    {
      "id": "${level}_gen_1",
      "category": "Social Interaction",
      "question": "Question text here?",
      "options": ["Positive option", "Mixed option", "Concerning option"],
      "scores": [1, 2, 3]
    }
  ]
}`;

    const completion = await this._enqueue(() => this.groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7
    }));
    const text = completion.choices[0]?.message?.content ?? '';

    let questions;
    try {
      const parsed = this._parseJSON(text);
      questions = Array.isArray(parsed) ? parsed : parsed.questions;
    } catch (parseErr) {
      console.error('[Groq] ❌ generateQuizQuestions — failed to parse JSON response:', parseErr.message);
      throw new Error('Groq returned invalid JSON. Please try again.');
    }

    if (!Array.isArray(questions)) {
      console.error('[Groq] ❌ generateQuizQuestions — response is not an array');
      throw new Error('Groq did not return a question array. Please try again.');
    }
    console.log(`[Groq] ✅ generateQuizQuestions — ${questions.length} questions generated for level: ${level}`);

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
  async generateChildQuiz({ child, pastResults = [] }) {
    console.log(`[Groq] generateChildQuiz called — child: "${child.name}" (${child._id}), pastResults: ${pastResults.length}`);
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

    const childContext = [
      `Name: ${child.name}`,
      `Age: ${child.age} years old`,
      child.gender ? `Gender: ${child.gender}` : null,
      child.dateOfBirth ? `Date of Birth: ${child.dateOfBirth}` : null,
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

Focus on these categories (areas needing most attention): ${focusCategories.join(', ')}

IMPORTANT RULES:
- Each question must have EXACTLY 3 answer options
- Scores must be EXACTLY [1, 2, 3] — 1 = positive/typical, 2 = mixed/sometimes, 3 = concerning
- Tailor questions to the child's age (${child.age} years old) and profile
- Questions should be observable behaviors a caregiver can report on
- Each category must be exactly one of: ${VALID_CATEGORIES.join(', ')}

Return a JSON object with a "questions" key containing the array, in this exact format:
{
  "questions": [
    {
      "id": "${child._id}_quiz_1",
      "category": "Social Interaction",
      "question": "Question text here?",
      "options": ["Positive option", "Mixed option", "Concerning option"],
      "scores": [1, 2, 3]
    }
  ]
}`;

    // Retry on 429 rate-limit errors, respecting the suggested retry delay
    let completion;
    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      try {
        completion = await this._enqueue(() => this.groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7
        }));
        break;
      } catch (err) {
        attempt++;
        const retryMatch = err.message?.match(/retry in (\d+(\.\d+)?)s/i);
        const waitMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) * 1000 + 2000 : 60_000;
        if (attempt < maxAttempts && (err.status === 429 || err.message?.includes('429'))) {
          console.warn(`[Groq] ⚠️  Rate limited (attempt ${attempt}/${maxAttempts}). Retrying in ${waitMs / 1000}s...`);
          await new Promise(r => setTimeout(r, waitMs));
        } else {
          console.error(`[Groq] ❌ generateChildQuiz failed after ${attempt} attempt(s):`, err.message);
          throw err;
        }
      }
    }
    const text = completion.choices[0]?.message?.content ?? '';

    let questions;
    try {
      const parsed = this._parseJSON(text);
      questions = Array.isArray(parsed) ? parsed : parsed.questions;
    } catch (parseErr) {
      console.error(`[Groq] ❌ generateChildQuiz — failed to parse JSON for child "${child.name}":`, parseErr.message);
      throw new Error('Groq returned invalid JSON for child quiz. Please try again.');
    }

    if (!Array.isArray(questions)) {
      console.error(`[Groq] ❌ generateChildQuiz — non-array response for child "${child.name}"`);
      throw new Error('Groq did not return a question array for child quiz.');
    }
    console.log(`[Groq] ✅ generateChildQuiz — ${questions.length} questions generated for "${child.name}"`);

    const timestamp = Date.now();
    return questions.map((q, i) => ({
      id: q.id || `${child._id}_quiz_${timestamp}_${i + 1}`,
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
    console.log(`[Groq] generateEmotionScenarios called — child: "${child.name}", level: ${level} (${levelName}), count: ${count}`);
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

Return a JSON object with a "scenarios" key containing the array, in this exact format:
{
  "scenarios": [
    {
      "emotion": "Disappointed",
      "scenario": "You practiced drawing a picture for days, but your teacher chose someone else's work for the display.",
      "distractors": ["Sad", "Frustrated", "Annoyed"]
    }
  ]
}`;

    const completion = await this._enqueue(() => this.groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7
    }));
    const text = completion.choices[0]?.message?.content ?? '';

    let raw;
    try {
      const parsed = this._parseJSON(text);
      raw = Array.isArray(parsed) ? parsed : parsed.scenarios;
    } catch {
      throw new Error('Groq returned invalid JSON for emotion scenarios.');
    }

    if (!Array.isArray(raw)) {
      throw new Error('Groq did not return a scenario array.');
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
    console.log(`[Groq] generateEmotionFeedback called — child: "${child.name}", level: ${level}, score: ${score}/${maxScore}`);
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

    const completion = await this._enqueue(() => this.groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    }));
    const feedback = (completion.choices[0]?.message?.content ?? '').trim();
    return feedback || `Amazing work, ${child.name}! You did a wonderful job exploring emotions today. Keep it up!`;
  }
}

export default new GeminiService();
