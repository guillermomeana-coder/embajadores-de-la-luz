import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVillageStats extends Document {
  villageId: string;
  raised: number;
  supporters: number;
  target: number;
  lastDonationAt?: Date;
}

const VillageStatsSchema = new Schema<IVillageStats>({
  villageId: { type: String, required: true, unique: true },
  raised: { type: Number, default: 0 },
  supporters: { type: Number, default: 0 },
  target: { type: Number, required: true },
  lastDonationAt: Date,
});

const VillageStats: Model<IVillageStats> =
  mongoose.models.VillageStats || mongoose.model<IVillageStats>('VillageStats', VillageStatsSchema);

export default VillageStats;
