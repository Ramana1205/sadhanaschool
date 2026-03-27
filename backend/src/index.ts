import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.ts';
import studentRoutes from './routes/students.js';
import paymentRoutes from './routes/payments.js';
import dashboardRoutes from './routes/dashboard.js';
import reportCardRoutes from './routes/reportCards.js';
import hallTicketRoutes from './routes/hallTickets.js';
import User from './models/User.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('public/uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/report-cards', reportCardRoutes);
app.use('/api/hall-tickets', hallTicketRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();

    // Ensure admin fallback user exists
    const adminUsername = 'Sadhana';
    const adminPassword = 'Sadhana@School@04';
    const adminName = 'Sadhana Administrator';

    const existingAdmin = await User.findOne({ username: adminUsername });
    if (!existingAdmin) {
      await new User({
        username: adminUsername,
        password: adminPassword,
        name: adminName,
        role: 'admin',
      }).save();
      console.log('Default admin account created:', adminUsername);
    }

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
