import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? '';

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: mongoose.Connection | null; promise: Promise<typeof import('mongoose')> | null };
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false }).then((m) => m);
  }
  await cached.promise;
  cached.conn = mongoose.connection;
  return cached.conn;
}
