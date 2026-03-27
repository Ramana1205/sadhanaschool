import express from 'express';
import Student, { IStudent } from '../models/Student.js';
import Payment from '../models/Payment.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all students
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
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
    const { name, class: className, section, rollNumber, contactNumber, address, totalFee, photo } = req.body;
    const parsedTotalFee = totalFee !== undefined && totalFee !== null ? Number(totalFee) : undefined;

    if (!name || !className || !section || !rollNumber || !contactNumber || !address || parsedTotalFee === undefined || Number.isNaN(parsedTotalFee)) {
      throw new AppError(400, 'Missing required fields');
    }

    const existingStudent = await Student.findOne({ rollNumber });
    if (existingStudent) {
      throw new AppError(400, 'Roll number already exists');
    }

    const student = new Student({
      name,
      class: className,
      section,
      rollNumber,
      contactNumber,
      address,
      totalFee: parsedTotalFee,
      photo: photo || undefined,
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
    const { name, class: className, section, rollNumber, contactNumber, address, totalFee, photo } = req.body;
    const parsedTotalFee = totalFee !== undefined && totalFee !== null ? Number(totalFee) : undefined;

    const student = await Student.findById(req.params.id);
    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    if (parsedTotalFee !== undefined && Number.isNaN(parsedTotalFee)) {
      throw new AppError(400, 'Invalid total fee');
    }

    // Check if rollNumber is being updated and if it already exists
    if (rollNumber && rollNumber !== student.rollNumber) {
      const existingStudent = await Student.findOne({ rollNumber });
      if (existingStudent) {
        throw new AppError(400, 'Roll number already exists');
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name: name || student.name,
        class: className || student.class,
        section: section || student.section,
        rollNumber: rollNumber || student.rollNumber,
        contactNumber: contactNumber || student.contactNumber,
        address: address || student.address,
        totalFee: parsedTotalFee !== undefined ? parsedTotalFee : student.totalFee,
        photo: photo !== undefined ? photo : student.photo,
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
