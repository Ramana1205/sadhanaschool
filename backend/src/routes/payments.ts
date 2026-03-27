import express from 'express';
import Payment, { IPayment } from '../models/Payment.js';
import Student from '../models/Student.js';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Generate receipt number
const generateReceiptNumber = (): string => {
  const prefix = 'RCP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Get all payments
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('studentId', 'name rollNumber')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// Get payments by student ID
router.get('/student/:studentId', authenticateToken, async (req, res, next) => {
  try {
    const payments = await Payment.find({ studentId: req.params.studentId })
      .populate('studentId', 'name rollNumber')
      .sort({ date: -1 });
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// Create payment
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { studentId, amount, mode, date } = req.body;

    if (!studentId || !amount || !mode) {
      throw new AppError(400, 'Missing required fields');
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    const payment = new Payment({
      studentId,
      amount,
      mode,
      date: date || new Date(),
      receiptNumber: generateReceiptNumber(),
    });

    await payment.save();
    await payment.populate('studentId', 'name rollNumber');

    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
});

// Get payment by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('studentId', 'name rollNumber');
    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
});

// Update payment
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { amount, mode, date } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        amount: amount !== undefined ? amount : payment.amount,
        mode: mode || payment.mode,
        date: date || payment.date,
      },
      { new: true, runValidators: true }
    ).populate('studentId', 'name rollNumber');

    res.json(updatedPayment);
  } catch (error) {
    next(error);
  }
});

// Delete payment
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get payment statistics
router.get('/stats/summary', authenticateToken, async (req, res, next) => {
  try {
    const totalCollected = await Payment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const byMode = await Payment.aggregate([
      {
        $group: {
          _id: '$mode',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalCollected: totalCollected[0]?.total || 0,
      paymentCount: totalCollected[0]?.count || 0,
      byMode: byMode || [],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
