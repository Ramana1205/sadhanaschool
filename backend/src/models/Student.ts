import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  class: string;
  section: string;
  rollNumber: string;
  contactNumber: string;
  address: string;
  previousBalance: number;
  presentBalance: number;
  totalBalance: number;
  discount: number;
  paid: number;
  switchHistory?: {
    oldClass: string;
    oldPreviousBalance: number;
    oldPresentBalance: number;
    oldDiscount: number;
    oldPaid: number;
    oldTotalBalance: number;
    switchedAt: Date;
  };
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
        '11th',
        '12th',
        'Alumni',
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
    previousBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    presentBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    paid: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    switchHistory: {
      type: {
        oldClass: { type: String, required: true },
        oldPreviousBalance: { type: Number, required: true, min: 0 },
        oldPresentBalance: { type: Number, required: true, min: 0 },
        oldDiscount: { type: Number, required: true, min: 0 },
        oldPaid: { type: Number, required: true, min: 0 },
        oldTotalBalance: { type: Number, required: true, min: 0 },
        switchedAt: { type: Date, required: true },
      },
      required: false,
      default: undefined,
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
