import express from 'express';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments();
    
    const classDistribution = await Student.aggregate([
      {
        $group: {
          _id: '$class',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalFeesData = await Student.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalFee' },
        },
      },
    ]);

    const totalFees = totalFeesData[0]?.total || 0;

    const paymentStats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
        },
      },
    ]);

    const totalCollected = paymentStats[0]?.totalCollected || 0;
    const paymentCount = paymentStats[0]?.paymentCount || 0;
    const totalPending = totalFees - totalCollected;

    // Get recent payments
    const recentPayments = await Payment.find()
      .populate('studentId', 'name rollNumber')
      .sort({ date: -1 })
      .limit(5);

    // Get recent students
    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalStudents,
      totalFees,
      totalCollected,
      totalPending,
      pendingPercentage: totalFees > 0 ? Math.round((totalPending / totalFees) * 100) : 0,
      paymentCount,
      classDistribution,
      recentPayments,
      recentStudents,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
