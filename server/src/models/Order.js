import mongoose from 'mongoose';

const workerProgressSchema = new mongoose.Schema(
  {
    qty: { type: Number, default: 0, min: 0 }, // jumlah yang ditugaskan ke worker ini
    done: { type: Number, default: 0, min: 0 }, // jumlah pcs sukses
    refund: { type: Number, default: 0, min: 0 }, // jumlah pcs reffund
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    no: { type: Number, required: true }, // nomor antrian, sequential per sesi
    customerId: { type: String, required: true, trim: true },
    server: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    assignments: {
      AR: { type: workerProgressSchema, default: () => ({}) },
      DR: { type: workerProgressSchema, default: () => ({}) },
    },
    // ID salah total -> seluruh progress bar merah, terlepas dari counter.
    salahId: { type: Boolean, default: false },
    // Worker mana yang menandai ID salah -> dipakai buat kirim notifikasi ke worker yang tepat
    // begitu admin memperbaiki ID/server.
    salahIdBy: { type: String, enum: ['AR', 'DR', null], default: null },
    // Notifikasi ke worker: "ID/server sudah diperbaiki admin". Hilang begitu worker klik "Mengerti".
    idFixedNotice: {
      type: {
        for: { type: String, enum: ['AR', 'DR'] },
        at: { type: Date, default: Date.now },
      },
      default: null,
    },
    // Riwayat klik tombol "Update" -> TIDAK ditimpa, selalu nambah baris baru.
    // "by" diisi 'AR' | 'DR' | 'admin', supaya kelihatan siapa yang menandai update di hari/jam tsb.
    // done/refund/qty adalah SNAPSHOT progres pada saat itu juga (bukan progres terkini),
    // supaya riwayat bisa nunjukin "2/4 Selasa, 15 September 2026 pukul 17.45".
    // salahId=true di satu entri berarti saat itu order sedang ditandai ID salah (bukan progres).
    // fixed=true berarti entri ini adalah catatan admin memperbaiki ID/server.
    updateHistory: {
      type: [
        {
          by: { type: String, enum: ['AR', 'DR', 'admin'], required: true },
          at: { type: Date, default: Date.now },
          done: { type: Number, default: 0 },
          refund: { type: Number, default: 0 },
          qty: { type: Number, default: 0 },
          salahId: { type: Boolean, default: false },
          fixed: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

orderSchema.index({ session: 1, no: 1 }, { unique: true });
orderSchema.index({ session: 1, customerId: 1, server: 1 });

// Hitung status & progres turunan dari counter, dipakai di semua response API.
orderSchema.methods.toClientJSON = function (opts = {}) {
  const { forWorker } = opts; // 'AR' | 'DR' | undefined (undefined = live/admin, lihat semua)
  const AR = this.assignments.AR || { qty: 0, done: 0, refund: 0 };
  const DR = this.assignments.DR || { qty: 0, done: 0, refund: 0 };

  const totalDone = AR.done + DR.done;
  const totalRefund = AR.refund + DR.refund;
  const totalProcessed = totalDone + totalRefund;

  let status = 'antri';
  if (this.salahId) status = 'salah id';
  else if (totalProcessed === 0) status = 'antri';
  else if (totalProcessed < this.quantity) status = 'proses';
  else if (totalRefund === this.quantity) status = 'reffund';
  else status = 'done';

  // Riwayat diurutkan terbaru dulu, biar enak dipakai langsung di modal riwayat.
  const history = [...this.updateHistory].sort((a, b) => new Date(b.at) - new Date(a.at));
  const lastUpdate = history[0]?.at || null;

  const base = {
    id: this._id,
    no: this.no,
    session: this.session,
    product: this.product,
    customerId: this.customerId,
    server: this.server,
    quantity: this.quantity,
    status,
    salahId: this.salahId,
    lastUpdate, // waktu update TERAKHIR dari siapapun (AR/DR/admin), buat tampilan ringkas
    updateHistory: history, // seluruh riwayat, buat modal "lihat riwayat" (icon mata)
    progress: {
      done: totalDone,
      refund: totalRefund,
      pending: Math.max(this.quantity - totalProcessed, 0),
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  if (forWorker) {
    // Worker cuma boleh lihat jatahnya sendiri.
    const mine = forWorker === 'AR' ? AR : DR;
    const myLastUpdate = history.find((h) => h.by === forWorker)?.at || null;
    // Notifikasi "ID diperbaiki admin" cuma dikirim ke worker yang jadi targetnya.
    const notice =
      this.idFixedNotice && this.idFixedNotice.for === forWorker ? this.idFixedNotice : null;
    return {
      ...base,
      myAssignment: { qty: mine.qty, done: mine.done, refund: mine.refund },
      myLastUpdate, // dipakai buat kolom "Update" milik worker itu sendiri
      notice,
    };
  }

  // Admin & live page (customer) boleh lihat pembagian lengkap AR/DR.
  return {
    ...base,
    assignments: { AR, DR },
  };
};

export default mongoose.model('Order', orderSchema);