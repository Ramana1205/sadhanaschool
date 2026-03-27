import mongoose, { Schema, Document } from 'mongoose';

export interface Subject {
  name: string;
  date: string;
}

export interface IHallTicket extends Document {
  className: string;
  section: string;
  examName: string;
  academicYear: string;
  subjects: Subject[];
  generationType: 'single' | 'class';
  studentIds?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const hallTicketSchema = new Schema<IHallTicket>(
  {
    className: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    examName: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    subjects: [
      {
        name: {
          type: String,
          required: true,
        },
        date: {
          type: String,
          required: true,
        },
      },
    ],
    generationType: {
      type: String,
      enum: ['single', 'class'],
      default: 'single',
    },
    studentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IHallTicket>('HallTicket', hallTicketSchema);
