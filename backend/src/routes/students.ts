import express from 'express';
import Student, { IStudent } from '../models/Student.js';
import FeeCatalog from '../models/FeeCatalog.js';
import PromotionBatch from '../models/PromotionBatch.js';
import Payment from '../models/Payment.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

const CLASS_ORDER = [
  'Nursery',
  'LKG',
  'UKG',
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th',
  '12th',
  'Alumni',
];

const parseDate = (value: any): Date | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, 'Invalid date value');
  }
  return parsed;
};

const getClassFee = async (className: string): Promise<number> => {
  if (className === 'Alumni') {
    return 0;
  }
  const catalogItem = await FeeCatalog.findOne({ class: className });
  if (!catalogItem) {
    throw new AppError(400, `Fee catalog entry not found for class ${className}`);
  }
  return catalogItem.annualFee;
};

const getNextClass = (currentClass: string): string | null => {
  const index = CLASS_ORDER.indexOf(currentClass);
  if (index === -1 || index === CLASS_ORDER.length - 1) {
    return null;
  }
  return CLASS_ORDER[index + 1];
};

const syncStudentBalancesForClass = async (className: string): Promise<number> => {
  const catalogItem = await FeeCatalog.findOne({ class: className });
  if (!catalogItem) {
    throw new AppError(404, `Fee catalog entry not found for class ${className}`);
  }

  const students = await Student.find({ class: className });
  if (!students.length) return 0;

  const bulkOps = students.map((student) => {
    const presentBalance = catalogItem.annualFee;
    const discount = Number(student.discount ?? 0);
    const paid = Number(student.paid ?? 0);
    const totalBalance = calculateTotalBalance(student.previousBalance, presentBalance, discount, paid);
    return {
      updateOne: {
        filter: { _id: student._id },
        update: {
          $set: {
            presentBalance,
            totalBalance,
          },
        },
      },
    };
  });

  await Student.bulkWrite(bulkOps);
  return students.length;
};

const parseNonNegativeNumber = (value: any): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return undefined;
  return parsed;
};

const calculateTotalBalance = (previousBalance: number, presentBalance: number, discount: number, paid: number = 0): number => {
  const total = previousBalance + presentBalance - discount - paid;
  return Math.max(0, Number.isFinite(total) ? total : 0);
};

// Get all students
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const feeCatalogEntries = await FeeCatalog.find();
    const feeMap = new Map(feeCatalogEntries.map((entry) => [entry.class, entry.annualFee]));
    const students = await Student.find().sort({ createdAt: -1 });

    const bulkOps: any[] = [];
    const normalized = students.map((student) => {
      const presentBalance = Number(student.presentBalance ?? 0);
      const previousBalance = Number(student.previousBalance ?? 0);
      const discount = Number(student.discount ?? 0);
      const paid = Number(student.paid ?? 0);
      const targetFee = feeMap.has(student.class) ? feeMap.get(student.class)! : presentBalance;
      const finalPresent = targetFee !== undefined && targetFee > 0 ? targetFee : presentBalance;
      const finalTotal = calculateTotalBalance(previousBalance, finalPresent, discount, paid);

      if (student.presentBalance !== finalPresent || student.totalBalance !== finalTotal) {
        bulkOps.push({
          updateOne: {
            filter: { _id: student._id },
            update: {
              $set: {
                presentBalance: finalPresent,
                totalBalance: finalTotal,
              },
            },
          },
        });
      }

      return {
        ...student.toObject(),
        presentBalance: finalPresent,
        totalBalance: finalTotal,
      };
    });

    if (bulkOps.length) {
      await Student.bulkWrite(bulkOps);
    }

    res.json(normalized);
  } catch (error) {
    next(error);
  }
});

// Get current promotion state
router.get('/promotion-status', authenticateToken, async (req, res, next) => {
  try {
    const activeBatch = await PromotionBatch.findOne({ undone: false }).sort({ promotedAt: -1 });
    res.json({ hasActivePromotion: Boolean(activeBatch), lastBatchId: activeBatch?.batchId, promotedAt: activeBatch?.promotedAt });
  } catch (error) {
    next(error);
  }
});

// Backfill student balances from fee catalog
router.put('/backfill-balances', authenticateToken, async (req, res, next) => {
  try {
    const feeCatalogEntries = await FeeCatalog.find();
    const feeMap = new Map(feeCatalogEntries.map((entry) => [entry.class, entry.annualFee]));
    const students = await Student.find();

    const bulkOps: any[] = [];
    students.forEach((student) => {
      const previousBalance = Number(student.previousBalance ?? 0);
      const discount = Number(student.discount ?? 0);
      const paid = Number(student.paid ?? 0);
      const targetFee = feeMap.get(student.class);
      if (targetFee !== undefined) {
        const presentBalance = targetFee;
        const totalBalance = calculateTotalBalance(previousBalance, presentBalance, discount, paid);
        if (student.presentBalance !== presentBalance || student.totalBalance !== totalBalance) {
          bulkOps.push({
            updateOne: {
              filter: { _id: student._id },
              update: {
                $set: {
                  presentBalance,
                  totalBalance,
                },
              },
            },
          });
        }
      }
    });

    if (bulkOps.length) {
      await Student.bulkWrite(bulkOps);
    }

    res.json({ updated: bulkOps.length });
  } catch (error) {
    next(error);
  }
});

// Promote all students to next class
router.put('/promote-all', authenticateToken, async (req, res, next) => {
  try {
    const activeBatch = await PromotionBatch.findOne({ undone: false });
    if (activeBatch) {
      throw new AppError(400, 'A promotion batch is already active. Undo it before promoting again.');
    }

    const feeCatalogEntries = await FeeCatalog.find();
    const feeMap = new Map(feeCatalogEntries.map((entry) => [entry.class, entry.annualFee]));
    const students = await Student.find();

    const snapshots: any[] = [];
    const bulkOps: any[] = [];

    students.forEach((student) => {
      const nextClass = getNextClass(student.class);
      if (!nextClass) return;
      const oldPreviousBalance = Number(student.previousBalance ?? 0);
      const oldPresentBalance = Number(student.presentBalance ?? 0);
      const oldDiscount = Number(student.discount ?? 0);
      const oldPaid = Number(student.paid ?? 0);
      const oldTotalBalance = Number(student.totalBalance ?? 0);
      const nextFee = nextClass === 'Alumni' ? 0 : feeMap.get(nextClass) ?? 0;

      if (nextClass !== 'Alumni' && !feeMap.has(nextClass)) {
        throw new AppError(400, `Fee catalog entry missing for class ${nextClass}`);
      }

      snapshots.push({
        studentId: student._id,
        oldClass: student.class,
        oldPreviousBalance,
        oldPresentBalance,
        oldDiscount,
        oldPaid,
        oldTotalBalance,
      });

      const newPreviousBalance = oldTotalBalance;
      const newPresentBalance = nextFee;
      const newTotalBalance = calculateTotalBalance(newPreviousBalance, newPresentBalance, oldDiscount, 0);

      bulkOps.push({
        updateOne: {
          filter: { _id: student._id },
          update: {
            $set: {
              class: nextClass,
              previousBalance: newPreviousBalance,
              presentBalance: newPresentBalance,
              paid: 0,
              totalBalance: newTotalBalance,
            },
          },
        },
      });
    });

    if (!bulkOps.length) {
      throw new AppError(400, 'No students found to promote');
    }

    const batchId = `PROMO-${Date.now()}`;
    await Student.bulkWrite(bulkOps);
    await PromotionBatch.create({ batchId, promotedAt: new Date(), undone: false, snapshots });

    res.json({ message: 'Promotion completed', batchId, promotedCount: bulkOps.length });
  } catch (error) {
    next(error);
  }
});

// Undo the latest global promotion
router.put('/undo-promote-all', authenticateToken, async (req, res, next) => {
  try {
    const activeBatch = await PromotionBatch.findOne({ undone: false }).sort({ promotedAt: -1 });
    if (!activeBatch) {
      throw new AppError(400, 'No active promotion batch to undo');
    }

    const bulkOps = activeBatch.snapshots.map((snapshot) => ({
      updateOne: {
        filter: { _id: snapshot.studentId },
        update: {
          $set: {
            class: snapshot.oldClass,
            previousBalance: snapshot.oldPreviousBalance,
            presentBalance: snapshot.oldPresentBalance,
            discount: snapshot.oldDiscount ?? 0,
            paid: snapshot.oldPaid ?? 0,
            totalBalance: snapshot.oldTotalBalance,
          },
        },
      },
    }));

    if (!bulkOps.length) {
      throw new AppError(400, 'No promotions to undo');
    }

    await Student.bulkWrite(bulkOps);
    activeBatch.undone = true;
    activeBatch.undoneAt = new Date();
    await activeBatch.save();

    res.json({ message: 'Promotion rollback completed', batchId: activeBatch.batchId, restoredCount: bulkOps.length });
  } catch (error) {
    next(error);
  }
});

// Get student by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      throw new AppError(404, 'Student not found');
    }
    res.json(student);
  } catch (error) {
    next(error);
  }
});

// Create student
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      name,
      class: className,
      section,
      rollNumber,
      contactNumber,
      address,
      previousBalance,
      presentBalance,
      discount,
      photo,
      admissionNumber,
      dateOfBirth,
      fatherName,
      motherName,
      dateOfAdmission,
      aadharNumber,
    } = req.body;

    const parsedPreviousBalance = previousBalance !== undefined && previousBalance !== null && previousBalance !== ''
      ? Number(previousBalance)
      : 0;
    const parsedPresentBalance = parseNonNegativeNumber(presentBalance);
    const parsedDiscount = discount !== undefined && discount !== null && discount !== ''
      ? Number(discount)
      : 0;
    const parsedPaidValue = req.body.paid !== undefined && req.body.paid !== null && req.body.paid !== ''
      ? Number(req.body.paid)
      : 0;

    if (!name || !className || !section || !rollNumber || !contactNumber || !address) {
      throw new AppError(400, 'Missing required fields');
    }

    if (parsedPreviousBalance < 0 || Number.isNaN(parsedPreviousBalance) || Number.isNaN(parsedDiscount) || parsedDiscount < 0 || Number.isNaN(parsedPaidValue) || parsedPaidValue < 0) {
      throw new AppError(400, 'Invalid balance, discount, or paid values');
    }

    const existingStudent = await Student.findOne({ rollNumber });
    if (existingStudent) {
      throw new AppError(400, 'Roll number already exists');
    }

    const classFee = await getClassFee(className);
    const finalPresentBalance = parsedPresentBalance !== undefined ? parsedPresentBalance : classFee;
    const totalBalance = calculateTotalBalance(parsedPreviousBalance, finalPresentBalance, parsedDiscount, parsedPaidValue);

    const student = new Student({
      name,
      class: className,
      section,
      rollNumber,
      contactNumber,
      address,
      previousBalance: parsedPreviousBalance,
      presentBalance: finalPresentBalance,
      discount: parsedDiscount,
      paid: parsedPaidValue,
      totalBalance,
      photo: photo || undefined,
      admissionNumber: admissionNumber || undefined,
      dateOfBirth: parseDate(dateOfBirth),
      fatherName: fatherName || undefined,
      motherName: motherName || undefined,
      dateOfAdmission: parseDate(dateOfAdmission),
      aadharNumber: aadharNumber || undefined,
    });

    await student.save();
    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
});

// Update student
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const {
      name,
      class: className,
      section,
      rollNumber,
      contactNumber,
      address,
      previousBalance,
      presentBalance,
      discount,
      photo,
      admissionNumber,
      dateOfBirth,
      fatherName,
      motherName,
      dateOfAdmission,
      aadharNumber,
    } = req.body;
    const parsedPreviousBalance = previousBalance !== undefined && previousBalance !== null && previousBalance !== ''
      ? Number(previousBalance)
      : undefined;
    const parsedPresentBalance = parseNonNegativeNumber(presentBalance);
    const parsedDiscount = discount !== undefined && discount !== null && discount !== ''
      ? Number(discount)
      : undefined;
    const parsedPaid = req.body.paid !== undefined && req.body.paid !== null && req.body.paid !== ''
      ? Number(req.body.paid)
      : undefined;

    const student = await Student.findById(req.params.id);
    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    if ((parsedPreviousBalance !== undefined && (Number.isNaN(parsedPreviousBalance) || parsedPreviousBalance < 0)) ||
        (presentBalance !== undefined && parsedPresentBalance === undefined) ||
        (discount !== undefined && (Number.isNaN(parsedDiscount!) || parsedDiscount! < 0)) ||
        (req.body.paid !== undefined && (Number.isNaN(parsedPaid!) || parsedPaid! < 0))) {
      throw new AppError(400, 'Invalid balance, discount, or paid values');
    }

    // Check if rollNumber is being updated and if it already exists
    if (rollNumber && rollNumber !== student.rollNumber) {
      const existingStudent = await Student.findOne({ rollNumber });
      if (existingStudent) {
        throw new AppError(400, 'Roll number already exists');
      }
    }

    let updatedPreviousBalance = parsedPreviousBalance !== undefined ? parsedPreviousBalance : student.previousBalance;
    let updatedPresentBalance = parsedPresentBalance !== undefined ? parsedPresentBalance : student.presentBalance;
    let updatedDiscount = parsedDiscount !== undefined ? parsedDiscount : student.discount;
    let updatedPaid = parsedPaid !== undefined ? parsedPaid : student.paid;
    let updatedClass = className || student.class;

    if (className && className !== student.class) {
      const classFee = await getClassFee(className);
      updatedPresentBalance = classFee;
      updatedClass = className;
    }

    const updatedTotalBalance = calculateTotalBalance(updatedPreviousBalance, updatedPresentBalance, updatedDiscount, updatedPaid);

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name: name || student.name,
        class: updatedClass,
        section: section || student.section,
        rollNumber: rollNumber || student.rollNumber,
        contactNumber: contactNumber || student.contactNumber,
        address: address || student.address,
        previousBalance: updatedPreviousBalance,
        presentBalance: updatedPresentBalance,
        discount: updatedDiscount,
        paid: updatedPaid,
        totalBalance: updatedTotalBalance,
        photo: photo !== undefined ? photo : student.photo,
        admissionNumber: admissionNumber !== undefined ? (admissionNumber || undefined) : student.admissionNumber,
        dateOfBirth: dateOfBirth !== undefined ? parseDate(dateOfBirth) : student.dateOfBirth,
        fatherName: fatherName !== undefined ? (fatherName || undefined) : student.fatherName,
        motherName: motherName !== undefined ? (motherName || undefined) : student.motherName,
        dateOfAdmission: dateOfAdmission !== undefined ? parseDate(dateOfAdmission) : student.dateOfAdmission,
        aadharNumber: aadharNumber !== undefined ? (aadharNumber || undefined) : student.aadharNumber,
      },
      { new: true, runValidators: true }
    );

    res.json(updatedStudent);
  } catch (error) {
    next(error);
  }
});

// Switch class for a student
router.put('/switch-class/:id', authenticateToken, async (req, res, next) => {
  try {
    const { newClass } = req.body;
    if (!newClass) {
      throw new AppError(400, 'New class is required');
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    if (newClass === student.class) {
      throw new AppError(400, 'Student is already in the selected class');
    }

    const classFee = await getClassFee(newClass);
    const discount = Number(student.discount ?? 0);

    const switchHistory = {
      oldClass: student.class,
      oldPreviousBalance: student.previousBalance,
      oldPresentBalance: student.presentBalance,
      oldDiscount: discount,
      oldPaid: Number(student.paid ?? 0),
      oldTotalBalance: student.totalBalance,
      switchedAt: new Date(),
    };

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        class: newClass,
        previousBalance: student.totalBalance,
        presentBalance: classFee,
        discount,
        paid: 0,
        totalBalance: calculateTotalBalance(student.totalBalance, classFee, discount, 0),
        switchHistory,
      },
      { new: true, runValidators: true }
    );

    res.json(updatedStudent);
  } catch (error) {
    next(error);
  }
});

// Undo class switch
router.put('/undo-switch/:id', authenticateToken, async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    if (!student.switchHistory) {
      throw new AppError(400, 'No switch history available to undo');
    }

    const { oldClass, oldPreviousBalance, oldPresentBalance, oldDiscount, oldPaid, oldTotalBalance } = student.switchHistory;
    const restoredDiscount = oldDiscount !== undefined ? oldDiscount : Number(student.discount ?? 0);
    const restoredPaid = oldPaid !== undefined ? oldPaid : Number(student.paid ?? 0);

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        class: oldClass,
        previousBalance: oldPreviousBalance,
        presentBalance: oldPresentBalance,
        discount: restoredDiscount,
        paid: restoredPaid,
        totalBalance: oldTotalBalance,
        switchHistory: undefined,
      },
      { new: true, runValidators: true }
    );

    res.json(updatedStudent);
  } catch (error) {
    next(error);
  }
});

// Delete student
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    // Delete associated payments
    await Payment.deleteMany({ studentId: req.params.id });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get student statistics
router.get('/stats/distribution', authenticateToken, async (req, res, next) => {
  try {
    const distribution = await Student.aggregate([
      {
        $group: {
          _id: '$class',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json(distribution);
  } catch (error) {
    next(error);
  }
});

export default router;
