import express from 'express';
import { 
  uploadResume, 
  getUserResumes, 
  getResumeDetails 
} from '../controllers/resumeController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { uploadResume as uploadMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All resume routes require authentication
router.use(authenticateUser);

// POST /api/resume/upload
router.post('/upload', uploadMiddleware, uploadResume);

// GET /api/resume/list (specific route first)
router.get('/list', getUserResumes);

// GET /api/resume/:resumeId (parameterized route last)
router.get('/:resumeId', getResumeDetails);

export default router;
