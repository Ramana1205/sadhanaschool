import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPromotionSnapshot {
  studentId: Types.ObjectId;
  oldClass: string;
  oldPreviousBalance: number;
  oldPresentBalance: number;
  oldDiscount: number;
  oldPaid: number;
  oldTotalBalance: number;
}

export interface IPromotionBatch extends Document {
  batchId: string;
  promotedAt: Date;
  undone: boolean;
  undoneAt?: Date;
  snapshots: IPromotionSnapshot[];
}

const promotionSnapshotSchema = new Schema<IPromotionSnapshot>(
  {
    studentId: { type: Schema.Types.ObjectId, required: true, ref: 'Student' },
    oldClass: { type: String, required: true },
    oldPreviousBalance: { type: Number, required: true, min: 0 },
    oldPresentBalance: { type: Number, required: true, min: 0 },
    oldDiscount: { type: Number, required: true, min: 0 },
    oldPaid: { type: Number, required: true, min: 0 },
    oldTotalBalance: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const promotionBatchSchema = new Schema<IPromotionBatch>(
  {
    batchId: { type: String, required: true, unique: true },
    promotedAt: { type: Date, required: true, default: Date.now },
    undone: { type: Boolean, required: true, default: false },
    undoneAt: { type: Date, required: false },
    snapshots: { type: [promotionSnapshotSchema], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPromotionBatch>('PromotionBatch', promotionBatchSchema);
