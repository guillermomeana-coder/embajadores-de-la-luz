import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  image?: string;
  role: 'donor' | 'admin';
  totalDonated: number;
  ambassadorBadge: 'semilla' | 'llama' | 'sol' | null;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: String,
  role: { type: String, enum: ['donor', 'admin'], default: 'donor' },
  totalDonated: { type: Number, default: 0 },
  ambassadorBadge: { type: String, enum: ['semilla', 'llama', 'sol', null], default: null },
  createdAt: { type: Date, default: Date.now },
});

export function calcBadge(total: number): IUser['ambassadorBadge'] {
  if (total >= 5000) return 'sol';
  if (total >= 2000) return 'llama';
  if (total > 0) return 'semilla';
  return null;
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
