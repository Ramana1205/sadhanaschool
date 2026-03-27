import mongoose, { Schema, Document } from 'mongoose';

export interface Subject {
  name: string;
  maxMarks: number;
  obtainedMarks: number;
}

export interface IReportCard extends Document {
  studentId: mongoose.Types.ObjectId;
  term: string;
  subjects: Subject[];
  createdAt: Date;
  updatedAt: Date;
}

const reportCardSchema = new Schema<IReportCard>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    term: {
      type: String,
      required: true,
      enum: ['Term 1', 'Term 2', 'Annual'],
    },
    subjects: [
      {
        name: {
          type: String,
          required: true,
        },
        maxMarks: {
          type: Number,
          required: true,
        },
        obtainedMarks: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IReportCard>('ReportCard', reportCardSchema);
