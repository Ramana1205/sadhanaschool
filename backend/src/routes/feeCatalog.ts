import express from 'express';
import FeeCatalog from '../models/FeeCatalog.js';
import Student from '../models/Student.js';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const calculateTotalBalance = (previousBalance: number, presentBalance: number, discount: number, paid: number = 0): number => {
  const total = previousBalance + presentBalance - discount - paid;
  return Math.max(0, Number.isFinite(total) ? total : 0);
};

const router = express.Router();

// List fee catalog entries
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const fees = await FeeCatalog.find().sort({ class: 1 });
    res.json(fees);
  } catch (error) {
    next(error);
  }
});

// Get fee for a specific class
router.get('/class/:className', authenticateToken, async (req, res, next) => {
  try {
    const fee = await FeeCatalog.findOne({ class: req.params.className });
    if (!fee) {
      throw new AppError(404, 'Fee catalog entry not found for selected class');
    }
    res.json(fee);
  } catch (error) {
    next(error);
  }
});

// Create fee catalog entry
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { class: className, annualFee } = req.body;
    const parsedAnnualFee = annualFee !== undefined && annualFee !== null ? Number(annualFee) : undefined;

    if (!className || parsedAnnualFee === undefined || Number.isNaN(parsedAnnualFee) || parsedAnnualFee < 0) {
      throw new AppError(400, 'Invalid fee catalog data');
    }

    const existing = await FeeCatalog.findOne({ class: className });
    if (existing) {
      throw new AppError(400, 'Fee catalog entry already exists for this class');
    }

    const entry = new FeeCatalog({ class: className, annualFee: parsedAnnualFee });
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

// Update fee catalog entry
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { class: className, annualFee } = req.body;
    const parsedAnnualFee = annualFee !== undefined && annualFee !== null ? Number(annualFee) : undefined;

    const entry = await FeeCatalog.findById(req.params.id);
    if (!entry) {
      throw new AppError(404, 'Fee catalog entry not found');
    }

    if (!className || parsedAnnualFee === undefined || Number.isNaN(parsedAnnualFee) || parsedAnnualFee < 0) {
      throw new AppError(400, 'Invalid fee catalog data');
    }

    const existing = await FeeCatalog.findOne({ class: className, _id: { $ne: entry._id } });
    if (existing) {
      throw new AppError(400, 'Fee catalog entry already exists for this class');
    }

    entry.class = className;
    entry.annualFee = parsedAnnualFee;
    await entry.save();

    // sync matching student balances for the updated class
    const matchingStudents = await Student.find({ class: className });
    if (matchingStudents.length) {
      const bulkOps = matchingStudents.map((student: any) => {
        const discount = Number(student.discount ?? 0);
        const paid = Number(student.paid ?? 0);
        return {
          updateOne: {
            filter: { _id: student._id },
            update: {
              $set: {
                presentBalance: parsedAnnualFee,
                totalBalance: calculateTotalBalance(student.previousBalance, parsedAnnualFee, discount, paid),
              },
            },
          },
        };
      });
      await Student.bulkWrite(bulkOps);
    }

    res.json(entry);
  } catch (error) {
    next(error);
  }
});

// Sync fee catalog with student balances for a class
router.put('/update-sync/:className', authenticateToken, async (req, res, next) => {
  try {
    const feeEntry = await FeeCatalog.findOne({ class: req.params.className });
    if (!feeEntry) {
      throw new AppError(404, 'Fee catalog entry not found for selected class');
    }

    const students = await Student.find({ class: feeEntry.class });
    if (!students.length) {
      return res.json({ updated: 0 });
    }

    const bulkOps = students.map((student: any) => {
      const discount = Number(student.discount ?? 0);
      const paid = Number(student.paid ?? 0);
      return {
        updateOne: {
          filter: { _id: student._id },
          update: {
            $set: {
              presentBalance: feeEntry.annualFee,
              totalBalance: calculateTotalBalance(student.previousBalance, feeEntry.annualFee, discount, paid),
            },
          },
        },
      };
    });

    await Student.bulkWrite(bulkOps);

    res.json({ updated: bulkOps.length });
  } catch (error) {
    next(error);
  }
});

// Delete fee catalog entry
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const entry = await FeeCatalog.findByIdAndDelete(req.params.id);
    if (!entry) {
      throw new AppError(404, 'Fee catalog entry not found');
    }
    res.json({ message: 'Fee catalog entry deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
