import express, { Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AuthRequest, authenticateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer config for picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, email, role, name } = req.body;

    if (!username || !password || !name) {
      throw new AppError(400, 'Username, password, and name are required');
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new AppError(400, 'Username already exists');
    }

    const user = new User({
      username,
      password,
      email,
      role: role || 'faculty',
      name,
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError(400, 'Username and password are required');
    }

    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Unauthorized');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create faculty (admin only)
router.post('/faculty', authenticateToken, upload.single('picture'), async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError(403, 'Admin access required');
    }

    const { username, password, name, subject, qualification, classes } = req.body;

    if (!username || !password || !name || !subject || !qualification) {
      throw new AppError(400, 'All faculty fields (username, password, name, subject, qualification, classes) are required');
    }

    const classArray = Array.isArray(classes)
      ? classes
      : typeof classes === 'string'
        ? classes.split(',').map((c: string) => c.trim()).filter(Boolean)
        : [];

    if (classArray.length === 0) {
      throw new AppError(400, 'Classes is required and must include at least one class value.');
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new AppError(400, 'Username already exists');
    }

    const picture = req.file ? `/uploads/${req.file.filename}` : undefined;

    console.log('Create faculty request body:', { username, name, subject, qualification, classes: classArray, picture });
    console.log('Create faculty req.file:', req.file);

    const user = new User({
      username,
      password,
      role: 'faculty',
      name,
      picture,
      subject,
      qualification,
      classes: classArray,
    });

    await user.save();

    res.status(201).json({
      message: 'Faculty created successfully',
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all faculties (admin only)
router.get('/faculties', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  console.log('Faculty API hit: /faculties');

  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError(403, 'Admin access required');
    }

    const faculties = await User.find({ role: 'faculty' }).select('-password');
    res.json({ faculties });
  } catch (error) {
    next(error);
  }
});

// Delete faculty (admin only)
router.delete('/faculties/:id', authenticateToken, async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError(403, 'Admin access required');
    }

    const { id } = req.params;

    const deletedFaculty = await User.findOneAndDelete({ _id: id, role: 'faculty' });
    if (!deletedFaculty) {
      throw new AppError(404, 'Faculty not found');
    }

    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
