import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import { calculateJobMatches } from '../services/jobMatchService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get job matches for user
export const getJobMatches = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user preferences
    const user = await User.findById(userId).select('preferredRole location salaryRange');
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Get user's latest resume analysis
    const latestResume = await Resume.findOne({ user: userId })
      .sort({ uploadedAt: -1 })
      .select('geminiAnalysis');

    if (!latestResume) {
      return res.status(400).json({ 
        message: 'No resume found. Please upload a resume first to get job matches.' 
      });
    }

    // Load jobs from JSON file
    const jobsFilePath = path.join(__dirname, '../data/jobs.json');
    const jobsData = await fs.readFile(jobsFilePath, 'utf8');
    const jobs = JSON.parse(jobsData);

    // Calculate job matches
    const matchedJobs = calculateJobMatches(
      jobs,
      {
        preferredRole: user.preferredRole,
        location: user.location,
        salaryRange: user.salaryRange
      },
      latestResume.geminiAnalysis
    );

    res.status(200).json({
      message: 'Job matches retrieved successfully',
      matches: matchedJobs,
      totalMatches: matchedJobs.length,
      userPreferences: {
        preferredRole: user.preferredRole,
        location: user.location,
        salaryRange: user.salaryRange
      },
      resumeAnalysis: latestResume.geminiAnalysis
    });

  } catch (error) {
    console.error('Job matching error:', error);
    
    if (error.code === 'ENOENT') {
      return res.status(500).json({ 
        message: 'Job data file not found. Please contact support.' 
      });
    }

    res.status(500).json({ 
      message: 'Failed to retrieve job matches. Please try again.' 
    });
  }
};

// Get all available jobs (optional endpoint)
export const getAllJobs = async (req, res) => {
  try {
    const jobsFilePath = path.join(__dirname, '../data/jobs.json');
    const jobsData = await fs.readFile(jobsFilePath, 'utf8');
    const jobs = JSON.parse(jobsData);

    res.status(200).json({
      message: 'All jobs retrieved successfully',
      jobs,
      totalJobs: jobs.length
    });

  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve jobs' 
    });
  }
};
