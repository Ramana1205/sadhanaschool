import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'faculty';

export interface IUser extends Document {
  username: string;
  password: string;
  email?: string;
  role: UserRole;
  name: string;
  picture?: string;
  subject?: string;
  qualification?: string;
  classes?: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ['admin', 'faculty'],
      default: 'faculty',
    },
    name: {
      type: String,
      required: true,
    },
    picture: {
      type: String,
    },
    subject: {
      type: String,
    },
    qualification: {
      type: String,
    },
    classes: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
