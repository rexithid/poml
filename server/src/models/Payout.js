import mongoose from 'mongoose';

const payoutItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    totalOrder: Number, // total jatah (pcs) worker ini di produk tsb, buat transparansi ke worker
    doneCount: Number,
    refundCount: Number,
    harga: Number,
    subtotal: Number,
  },
  { _id: false }
);

const payoutSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    worker: { type: String, enum: ['AR', 'DR'], required: true },
    items: [payoutItemSchema],
    total: { type: Number, default: 0 },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

payoutSchema.index({ session: 1, worker: 1 }, { unique: true });

export default mongoose.model('Payout', payoutSchema);