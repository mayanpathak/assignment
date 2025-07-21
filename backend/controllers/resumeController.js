import Resume from '../models/Resume.js';
import { uploadResumeToCloudinary } from '../services/cloudinaryService.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { analyzeResumeWithGemini } from '../services/geminiService.js';

// Upload and process resume
export const uploadResume = async (req, res) => {
  try {
    const userId = req.user._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        message: 'No resume file provided' 
      });
    }

    // Extract text from PDF
    console.log('Extracting text from PDF...');
    const pdfData = await extractTextFromPDF(file.buffer);
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Could not extract text from PDF. Please ensure the PDF contains readable text.' 
      });
    }

    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const cloudinaryResult = await uploadResumeToCloudinary(
      file.buffer, 
      file.originalname
    );

    // Analyze with Gemini AI
    console.log('Analyzing with Gemini AI...');
    const geminiAnalysis = await analyzeResumeWithGemini(pdfData.text);

    // Save to database
    const resume = new Resume({
      user: userId,
      cloudinaryUrl: cloudinaryResult.url,
      extractedText: pdfData.text,
      geminiAnalysis
    });

    await resume.save();

    res.status(200).json({
      message: 'Resume uploaded and analyzed successfully',
      resumeUrl: cloudinaryResult.url,
      geminiAnalysis,
      resumeId: resume._id,
      extractedInfo: {
        pages: pdfData.pages,
        textLength: pdfData.text.length
      }
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    
    // Handle specific error types
    if (error.message.includes('Cloudinary')) {
      return res.status(500).json({ 
        message: 'Failed to upload resume to cloud storage. Please try again.' 
      });
    }
    
    if (error.message.includes('PDF')) {
      return res.status(400).json({ 
        message: 'Invalid PDF file or could not extract text. Please ensure your resume is a valid PDF with readable text.' 
      });
    }
    
    if (error.message.includes('Gemini')) {
      // Even if Gemini fails, we can still save the resume
      console.warn('Gemini analysis failed, proceeding without AI analysis');
    }

    res.status(500).json({ 
      message: 'Resume upload failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's resumes
export const getUserResumes = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const resumes = await Resume.find({ user: userId })
      .sort({ uploadedAt: -1 })
      .select('-extractedText'); // Exclude large text field for list view

    res.status(200).json({
      message: 'Resumes retrieved successfully',
      resumes,
      count: resumes.length
    });

  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve resumes' 
    });
  }
};

// Get specific resume details
export const getResumeDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const resumeId = req.params.resumeId;

    const resume = await Resume.findOne({ 
      _id: resumeId, 
      user: userId 
    });

    if (!resume) {
      return res.status(404).json({ 
        message: 'Resume not found' 
      });
    }

    res.status(200).json({
      message: 'Resume details retrieved successfully',
      resume
    });

  } catch (error) {
    console.error('Get resume details error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve resume details' 
    });
  }
};