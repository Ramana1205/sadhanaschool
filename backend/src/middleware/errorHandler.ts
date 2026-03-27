import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      statusCode: error.statusCode,
    });
    return;
  }

  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation error',
      details: error.message,
    });
    return;
  }

  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    res.status(400).json({
      error: 'Database error',
      details: error.message,
    });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
  });
};
