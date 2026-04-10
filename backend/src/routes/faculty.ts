import express, { Response } from 'express';
import User from '../models/User.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Root-level faculty listing route used by the admin faculty management page.
router.get('/faculty-management', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  console.log('Faculty API hit: /faculty-management');

  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError(403, 'Admin access required');
    }

    const faculties = await User.find({ role: 'faculty' }).select('-password');
    res.status(200).json({ faculties });
  } catch (error) {
    console.error('Faculty fetch error:', error);
    next(error);
  }
});

export default router;
