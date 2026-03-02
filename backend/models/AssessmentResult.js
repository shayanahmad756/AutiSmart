import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  optionIndex: { type: Number, required: true },
  score: { type: Number, required: true }
}, { _id: false });

const categoryScoreSchema = new mongoose.Schema({
  score: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { _id: false });

const assessmentResultSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true,
    index: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentLevel: {
    type: String,
    required: true,
    enum: ['easy', 'intermediate', 'advanced', 'sensory', 'all']
  },
  totalScore: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  scorePercentage: { type: Number, required: true },
  autismLevel: {
    type: String,
    enum: ['Beginner Level', 'Intermediate Level', 'Advanced Level'],
    required: true
  },
  categoryScores: {
    'Eye Contact': { type: categoryScoreSchema, default: () => ({}) },
    'Social Interaction': { type: categoryScoreSchema, default: () => ({}) },
    'Communication': { type: categoryScoreSchema, default: () => ({}) },
    'Repetitive Behavior': { type: categoryScoreSchema, default: () => ({}) },
    'Sensory Sensitivity': { type: categoryScoreSchema, default: () => ({}) },
    'Focus & Attention': { type: categoryScoreSchema, default: () => ({}) }
  },
  answers: { type: [answerSchema], default: [] }
}, {
  timestamps: true
});

assessmentResultSchema.index({ childId: 1, createdAt: -1 });
assessmentResultSchema.index({ childId: 1, assessmentLevel: 1 });

const AssessmentResult = mongoose.model('AssessmentResult', assessmentResultSchema);
export default AssessmentResult;
