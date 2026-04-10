import mongoose, { Schema, Document } from 'mongoose';

export interface IFeeCatalog extends Document {
  class: string;
  annualFee: number;
  createdAt: Date;
  updatedAt: Date;
}

const feeCatalogSchema = new Schema<IFeeCatalog>(
  {
    class: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    annualFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IFeeCatalog>('FeeCatalog', feeCatalogSchema);
