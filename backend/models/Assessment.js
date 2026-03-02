import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
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
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length === 3;
      },
      message: 'Each question must have exactly 3 options'
    }
  },
  scores: {
    type: [Number],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length === 3 && arr.every(score => score >= 1 && score <= 3);
      },
      message: 'Each question must have exactly 3 scores between 1 and 3'
    }
  }
});

const assessmentSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    enum: ['easy', 'intermediate', 'advanced', 'sensory'],
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  questions: {
    type: [questionSchema],
    default: []
  },
  // Stores react-form-builder2 JSON definition for the visual quiz builder
  formDefinition: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property to convert _id to id
assessmentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Index for faster queries
assessmentSchema.index({ createdAt: -1 });

// Ensure unique level for active assessments (one assessment per level)
assessmentSchema.index({ level: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

const Assessment = mongoose.model('Assessment', assessmentSchema);

export default Assessment;
