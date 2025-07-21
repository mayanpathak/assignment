import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cloudinaryUrl: {
    type: String,
    required: [true, 'Cloudinary URL is required']
  },
  extractedText: {
    type: String,
    required: [true, 'Extracted text is required']
  },
  geminiAnalysis: {
    skills: [{
      type: String,
      trim: true
    }],
    suggestedTitle: {
      type: String,
      trim: true
    },
    seniority: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'lead', 'executive'],
      default: 'mid'
    },
    summary: {
      type: String,
      trim: true
    }
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
resumeSchema.index({ user: 1, uploadedAt: -1 });

export default mongoose.model('Resume', resumeSchema);