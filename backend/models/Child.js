import mongoose from 'mongoose';

const childSchema = new mongoose.Schema({
  caregiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 18
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  dateOfBirth: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    default: ''
  },
  specialNeeds: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  autismDetections: [
    {
      date: { type: Date, default: Date.now },
      label: { type: String, enum: ['autistic', 'non_autistic'], required: true },
      confidence: { type: Number, required: true },
      note: { type: String, default: '' }
    }
  ]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property to convert _id to id
childSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Child = mongoose.model('Child', childSchema);

export default Child;
