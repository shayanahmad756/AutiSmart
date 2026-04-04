/**
 * AutiSmart AI Chat Service
 * Provides a compassionate autism-therapy AI assistant via Groq.
 */
import Groq from 'groq-sdk';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are AutiSmart AI, a compassionate and knowledgeable AI assistant specializing in Autism Spectrum Disorder (ASD) therapy and child development. You help caregivers and therapy experts with:

- Understanding autism spectrum disorder symptoms and behaviors
- Therapy recommendations (ABA, speech therapy, occupational therapy, play therapy)
- Communication strategies for children with autism
- Tips for daily living, routines, and sensory sensitivities
- Interpreting assessment results and autism levels
- Game and activity suggestions tailored to the child's needs
- Emotional support and guidance for families

Always be empathetic, supportive, and provide evidence-based information. Keep responses concise but helpful. Use bullet points or numbered lists when listing multiple items for readability. If asked anything unrelated to autism, child development, or therapy, kindly redirect to your area of expertise.`;

class AIChatService {
  constructor() {
    this.groq = null;
    this._initialized = false;
  }

  _init() {
    if (this._initialized) return;
    this._initialized = true;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('[AIChatService] GROQ_API_KEY is missing from environment variables.');
      return;
    }
    try {
      this.groq = new Groq({ apiKey });
      console.log('[AIChatService] ✅ AutiSmart AI initialized');
    } catch (err) {
      console.error('[AIChatService] ❌ Initialization failed:', err.message);
    }
  }

  /**
   * Generate an AI response given a user message and conversation history.
   * @param {string} userMessage - The latest user message
   * @param {Array<{role: string, content: string}>} history - Previous conversation turns
   * @returns {Promise<string>} AI reply
   */
  async chat(userMessage, history = []) {
    this._init();
    if (!this.groq) {
      throw new Error('AutiSmart AI is not configured. Please set GROQ_API_KEY in your environment.');
    }

    // Keep only the last 10 turns of history to stay within token limits
    const trimmedHistory = history.slice(-10);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...trimmedHistory.map((h) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: String(h.content || ''),
      })),
      { role: 'user', content: userMessage },
    ];

    const completion = await this.groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';
  }
}

export default new AIChatService();
