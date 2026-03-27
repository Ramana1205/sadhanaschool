import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  studentId: mongoose.Types.ObjectId;
  amount: number;
  mode: 'cash' | 'online';
  date: Date;
  receiptNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    mode: {
      type: String,
      enum: ['cash', 'online'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: new Date(),
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>('Payment', paymentSchema);
