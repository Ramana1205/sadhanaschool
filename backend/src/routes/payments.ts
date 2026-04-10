import express from 'express';
import { isValidObjectId } from 'mongoose';
import Payment, { IPayment } from '../models/Payment.js';
import Student from '../models/Student.js';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const calculateTotalBalance = (previousBalance: number, presentBalance: number, discount: number, paid: number = 0): number => {
  const total = previousBalance + presentBalance - discount - paid;
  return Math.max(0, Number.isFinite(total) ? total : 0);
};

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
    if (!isValidObjectId(req.params.studentId)) {
      throw new AppError(400, 'Invalid student ID');
    }

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

    if (!studentId || amount === undefined || amount === null || !mode) {
      throw new AppError(400, 'Missing required fields');
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      throw new AppError(400, 'Invalid payment amount');
    }

    if (!isValidObjectId(studentId)) {
      throw new AppError(400, 'Invalid student ID');
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    const payment = new Payment({
      studentId,
      amount: parsedAmount,
      mode,
      date: date || new Date(),
      receiptNumber: generateReceiptNumber(),
    });

    await payment.save();

    const updatedPaid = Number(student.paid ?? 0) + parsedAmount;
    student.paid = updatedPaid;
    student.totalBalance = calculateTotalBalance(
      Number(student.previousBalance ?? 0),
      Number(student.presentBalance ?? 0),
      Number(student.discount ?? 0),
      updatedPaid
    );
    await student.save();

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

    const parsedAmount = amount !== undefined && amount !== null ? Number(amount) : payment.amount;
    if (amount !== undefined && (Number.isNaN(parsedAmount) || parsedAmount < 0)) {
      throw new AppError(400, 'Invalid payment amount');
    }

    const student = await Student.findById(payment.studentId);
    if (!student) {
      throw new AppError(404, 'Related student not found');
    }

    const amountDelta = parsedAmount - payment.amount;
    const updatedPaid = Math.max(0, Number(student.paid ?? 0) + amountDelta);
    student.paid = updatedPaid;
    student.totalBalance = calculateTotalBalance(
      Number(student.previousBalance ?? 0),
      Number(student.presentBalance ?? 0),
      Number(student.discount ?? 0),
      updatedPaid
    );
    await student.save();

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        amount: parsedAmount,
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
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      throw new AppError(404, 'Payment not found');
    }

    const student = await Student.findById(payment.studentId);
    if (!student) {
      throw new AppError(404, 'Related student not found');
    }

    const updatedPaid = Math.max(0, Number(student.paid ?? 0) - Number(payment.amount));
    student.paid = updatedPaid;
    student.totalBalance = calculateTotalBalance(
      Number(student.previousBalance ?? 0),
      Number(student.presentBalance ?? 0),
      Number(student.discount ?? 0),
      updatedPaid
    );
    await student.save();

    await payment.deleteOne();
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
