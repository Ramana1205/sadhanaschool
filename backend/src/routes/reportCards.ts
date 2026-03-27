import express from 'express';
import ReportCard from '../models/ReportCard.js';
import Student from '../models/Student.js';
import { authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all report cards
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const reportCards = await ReportCard.find()
      .populate('studentId', 'name rollNumber class section')
      .sort({ createdAt: -1 });
    res.json(reportCards);
  } catch (error) {
    next(error);
  }
});

// Get report card by student ID
router.get('/student/:studentId', authenticateToken, async (req, res, next) => {
  try {
    const reportCards = await ReportCard.find({ studentId: req.params.studentId })
      .populate('studentId', 'name rollNumber class section');
    res.json(reportCards);
  } catch (error) {
    next(error);
  }
});

// Create report card
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { studentId, term, subjects } = req.body;

    if (!studentId || !term || !subjects || !Array.isArray(subjects)) {
      throw new AppError(400, 'Missing required fields');
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    const reportCard = new ReportCard({
      studentId,
      term,
      subjects,
    });

    await reportCard.save();
    await reportCard.populate('studentId', 'name rollNumber class section');

    res.status(201).json(reportCard);
  } catch (error) {
    next(error);
  }
});

// Get report card by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const reportCard = await ReportCard.findById(req.params.id).populate(
      'studentId',
      'name rollNumber class section'
    );
    if (!reportCard) {
      throw new AppError(404, 'Report card not found');
    }
    res.json(reportCard);
  } catch (error) {
    next(error);
  }
});

// Update report card
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { term, subjects } = req.body;

    const reportCard = await ReportCard.findById(req.params.id);
    if (!reportCard) {
      throw new AppError(404, 'Report card not found');
    }

    const updatedReportCard = await ReportCard.findByIdAndUpdate(
      req.params.id,
      {
        term: term || reportCard.term,
        subjects: subjects || reportCard.subjects,
      },
      { new: true, runValidators: true }
    ).populate('studentId', 'name rollNumber class section');

    res.json(updatedReportCard);
  } catch (error) {
    next(error);
  }
});

// Delete report card
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const reportCard = await ReportCard.findByIdAndDelete(req.params.id);
    if (!reportCard) {
      throw new AppError(404, 'Report card not found');
    }
    res.json({ message: 'Report card deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
