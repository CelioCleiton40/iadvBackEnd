import mongoose, { Document, Schema } from 'mongoose';
import { hashPassword } from '../../utils/hash';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  oabNumber?: string;
  cpf: string;
  role: 'admin' | 'lawyer' | 'client';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    oabNumber: {
      type: String,
      sparse: true,
      trim: true
    },
    cpf: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'lawyer', 'client'],
      default: 'client'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);