import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: [
      'Eye Contact',
      'Social Interaction',
      'Communication',
      'Repetitive Behavior',
      'Sensory Sensitivity',
      'Focus & Attention'
    ]
  },
  question: { type: String, required: true, trim: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => arr.length === 3,
      message: 'Each question must have exactly 3 options'
    }
  },
  scores: {
    type: [Number],
    required: true,
    validate: {
      validator: (arr) => arr.length === 3 && arr.every(s => s >= 1 && s <= 3),
      message: 'Each question must have exactly 3 scores between 1 and 3'
    }
  }
}, { _id: false });

const childQuizSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    index: true
  },
  level: {
    type: String,
    required: true,
    enum: ['easy', 'intermediate', 'advanced', 'sensory']
  },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'Quiz must have at least one question'
    }
  },
  generatedBy: {
    type: String,   // 'ai' or a user ObjectId stringified
    default: 'ai'
  },
  iteration: { type: Number, default: 1 }
}, {
  timestamps: true
});

// One active quiz per child per level
childQuizSchema.index({ childId: 1, level: 1 }, { unique: true });

const ChildQuiz = mongoose.model('ChildQuiz', childQuizSchema);
export default ChildQuiz;
