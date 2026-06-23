import { Schema, model } from 'mongoose';
import { IUser } from 'shared';

const userSchema = new Schema<any>({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['parent', 'teacher'], default: 'parent' },
  children: [{ type: Schema.Types.ObjectId, ref: 'ChildProfile' }],
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  createdAt: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String }
});

export const User = model<IUser>('User', userSchema);
