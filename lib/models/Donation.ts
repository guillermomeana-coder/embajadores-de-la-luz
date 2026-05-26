import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDonation extends Document {
  userId: mongoose.Types.ObjectId;
  villageId: string;
  amount: number;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

const DonationSchema = new Schema<IDonation>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  villageId: { type: String, required: true },
  amount: { type: Number, required: true },
  stripeSessionId: { type: String, required: true, unique: true },
  stripePaymentIntentId: String,
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const Donation: Model<IDonation> = mongoose.models.Donation || mongoose.model<IDonation>('Donation', DonationSchema);
export default Donation;
