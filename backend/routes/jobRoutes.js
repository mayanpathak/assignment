import express from 'express';
import { getJobMatches, getAllJobs } from '../controllers/jobController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// All job routes require authentication
router.use(authenticateUser);

// GET /api/jobs/match
router.get('/match', getJobMatches);

// GET /api/jobs/all (optional)
router.get('/all', getAllJobs);

export default router;