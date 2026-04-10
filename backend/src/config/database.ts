import mongoose from 'mongoose';

const connectWithRetry = async (mongoUri: string, options: mongoose.ConnectOptions, retries: number): Promise<void> => {
  while (retries > 0) {
    try {
      await mongoose.connect(mongoUri, options);
      console.log('MongoDB connected successfully');
      return;
    } catch (error) {
      retries -= 1;
      console.error('MongoDB connection error:', error);
      if (retries === 0) {
        console.error('MongoDB connection failed after retries. Exiting.');
        process.exit(1);
      }
      console.log(`Retrying MongoDB connection (${retries} attempts left)...`);
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  }
};

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI or MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  const options: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
  };

  await connectWithRetry(mongoUri, options, 3);
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
};
