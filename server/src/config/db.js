import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI belum diset di .env');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('[db] terhubung ke MongoDB');
}
