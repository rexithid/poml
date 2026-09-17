import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
