import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    name: { type: String, required: true, trim: true },
    // Harga satuan per pcs, dipakai admin untuk menghitung pembayaran worker. Tidak ditampilkan ke worker.
    harga: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ session: 1, name: 1 }, { unique: true });

export default mongoose.model('Product', productSchema);
