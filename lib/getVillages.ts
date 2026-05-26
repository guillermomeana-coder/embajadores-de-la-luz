import { dbConnect } from '@/lib/mongoose';
import VillageStats, { IVillageStats } from '@/lib/models/VillageStats';
import { VILLAGES, Village } from '@/lib/villages';

export type LiveVillage = Village;

export async function getLiveVillages(): Promise<LiveVillage[]> {
  await dbConnect();

  // Ensure all villages have a VillageStats row (seed on first use)
  const existingIds = (await VillageStats.find({}, 'villageId').lean()).map(
    (d: Partial<IVillageStats>) => d.villageId
  );

  const toCreate = VILLAGES.filter((v) => !existingIds.includes(v.id)).map((v) => ({
    villageId: v.id,
    raised: 0,
    supporters: 0,
    target: v.target,
  }));
  if (toCreate.length) await VillageStats.insertMany(toCreate, { ordered: false }).catch(() => {});

  const stats = await VillageStats.find({}).lean();
  const statsMap: Record<string, Partial<IVillageStats>> = {};
  for (const s of stats) statsMap[s.villageId as string] = s;

  return VILLAGES.map((v) => {
    const s = statsMap[v.id] ?? {};
    return {
      ...v,
      raised: (s.raised as number) ?? 0,
      supporters: (s.supporters as number) ?? 0,
      target: (s.target as number) ?? v.target,
      days: 0,
    };
  });
}
