import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  class: string;
  section: string;
  rollNumber: string;
  contactNumber: string;
  address: string;
  totalFee: number;
  photo?: string;
  admissionNumber?: string;
  dateOfBirth?: Date;
  fatherName?: string;
  motherName?: string;
  dateOfAdmission?: Date;
  aadharNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: String,
      required: true,
      enum: [
        'Nursery',
        'LKG',
        'UKG',
        '1st',
        '2nd',
        '3rd',
        '4th',
        '5th',
        '6th',
        '7th',
        '8th',
        '9th',
        '10th',
      ],
    },
    section: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D'],
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    totalFee: {
      type: Number,
      required: true,
      min: 0,
    },
    photo: {
      type: String,
      default: undefined,
    },
    admissionNumber: {
      type: String,
      required: false,
      trim: true,
      default: undefined,
    },
    dateOfBirth: {
      type: Date,
      required: false,
      default: undefined,
    },
    fatherName: {
      type: String,
      required: false,
      trim: true,
      default: undefined,
    },
    motherName: {
      type: String,
      required: false,
      trim: true,
      default: undefined,
    },
    dateOfAdmission: {
      type: Date,
      required: false,
      default: undefined,
    },
    aadharNumber: {
      type: String,
      required: false,
      trim: true,
      default: undefined,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>('Student', studentSchema);
