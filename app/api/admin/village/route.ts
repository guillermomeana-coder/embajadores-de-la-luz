export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/mongoose';
import VillageStats from '@/lib/models/VillageStats';
import { revalidatePath } from 'next/cache';

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { villageId, target } = await req.json();
  if (!villageId || typeof target !== 'number') {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  await dbConnect();
  await VillageStats.findOneAndUpdate({ villageId }, { $set: { target } }, { upsert: true });
  revalidatePath('/');
  revalidatePath('/admin');

  return NextResponse.json({ ok: true });
}
