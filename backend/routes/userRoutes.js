import express from 'express';
import { getProfile, updatePreferences } from '../controllers/userController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateUser);

// GET /api/users/me
router.get('/me', getProfile);

// POST /api/users/preferences
router.post('/preferences', updatePreferences);

export default router;