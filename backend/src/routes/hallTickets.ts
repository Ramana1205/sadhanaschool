import express from 'express';
import HallTicket from '../models/HallTicket.js';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all hall tickets
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const hallTickets = await HallTicket.find()
      .populate('studentIds', 'name rollNumber class section')
      .sort({ createdAt: -1 });
    res.json(hallTickets);
  } catch (error) {
    next(error);
  }
});

// Get hall tickets for a specific class and section
router.get('/class/:className/:section', authenticateToken, async (req, res, next) => {
  try {
    const { className, section } = req.params;
    const hallTickets = await HallTicket.find({ 
      className: className,
      section: section 
    })
      .populate('studentIds', 'name rollNumber class section')
      .sort({ createdAt: -1 });
    res.json(hallTickets);
  } catch (error) {
    next(error);
  }
});

// Create hall ticket
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { className, section, examName, academicYear, subjects, generationType, studentIds } = req.body;

    if (!className || !section || !examName || !academicYear || !subjects || !Array.isArray(subjects)) {
      throw new AppError(400, 'Missing required fields');
    }

    const hallTicket = new HallTicket({
      className,
      section,
      examName,
      academicYear,
      subjects,
      generationType: generationType || 'single',
      studentIds: studentIds || [],
    });

    await hallTicket.save();
    await hallTicket.populate('studentIds', 'name rollNumber class section');

    res.status(201).json(hallTicket);
  } catch (error) {
    next(error);
  }
});

// Get hall ticket by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const hallTicket = await HallTicket.findById(req.params.id).populate(
      'studentIds',
      'name rollNumber class section'
    );
    if (!hallTicket) {
      throw new AppError(404, 'Hall ticket not found');
    }
    res.json(hallTicket);
  } catch (error) {
    next(error);
  }
});

// Update hall ticket
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { examName, academicYear, subjects, studentIds } = req.body;

    const hallTicket = await HallTicket.findById(req.params.id);
    if (!hallTicket) {
      throw new AppError(404, 'Hall ticket not found');
    }

    const updatedHallTicket = await HallTicket.findByIdAndUpdate(
      req.params.id,
      {
        examName: examName || hallTicket.examName,
        academicYear: academicYear || hallTicket.academicYear,
        subjects: subjects || hallTicket.subjects,
        studentIds: studentIds !== undefined ? studentIds : hallTicket.studentIds,
      },
      { new: true, runValidators: true }
    ).populate('studentIds', 'name rollNumber class section');

    res.json(updatedHallTicket);
  } catch (error) {
    next(error);
  }
});

// Delete hall ticket
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const hallTicket = await HallTicket.findByIdAndDelete(req.params.id);
    if (!hallTicket) {
      throw new AppError(404, 'Hall ticket not found');
    }
    res.json({ message: 'Hall ticket deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
