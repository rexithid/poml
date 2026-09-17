import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Payout from '../models/Payout.js';
import { authenticate, authorize, authorizeWorkerSelf } from '../middleware/auth.js';

const router = Router();

async function computeBreakdown(sessionId, worker) {
  const products = await Product.find({ session: sessionId }).lean();
  const orders = await Order.find({ session: sessionId }).lean();

  const items = products.map((p) => {
    const productOrders = orders.filter((o) => String(o.product) === String(p._id));
    // Total order = seluruh jatah worker ini di produk itu, terlepas status ID salah atau tidak
    // (tetap kerjaan yang ditugaskan). Done/reffund yang DIHITUNG ke pembayaran mengecualikan
    // order yang lagi ditandai ID salah, karena progresnya belum tentu valid selama ID belum benar.
    const totalOrder = productOrders.reduce((sum, o) => sum + (o.assignments?.[worker]?.qty || 0), 0);
    const validOrders = productOrders.filter((o) => !o.salahId);
    const doneCount = validOrders.reduce((sum, o) => sum + (o.assignments?.[worker]?.done || 0), 0);
    const refundCount = validOrders.reduce((sum, o) => sum + (o.assignments?.[worker]?.refund || 0), 0);
    const subtotal = doneCount * (p.harga || 0);
    return {
      product: p._id,
      productName: p.name,
      totalOrder,
      doneCount,
      refundCount,
      harga: p.harga || 0,
      subtotal,
    };
  });
  const total = items.reduce((sum, it) => sum + it.subtotal, 0);
  return { items, total };
}

// Admin klik "cek": hitung totalan terbaru tanpa menyimpan.
router.get('/session/:sessionId/:worker/compute', authenticate, authorize('admin'), async (req, res) => {
  const { sessionId, worker } = req.params;
  if (!['AR', 'DR'].includes(worker)) return res.status(400).json({ message: 'Worker tidak valid' });
  const breakdown = await computeBreakdown(sessionId, worker);
  res.json(breakdown);
});

// Admin klik "kirim ke worker": simpan snapshot supaya muncul di halaman worker.
router.post('/session/:sessionId/:worker/send', authenticate, authorize('admin'), async (req, res) => {
  const { sessionId, worker } = req.params;
  if (!['AR', 'DR'].includes(worker)) return res.status(400).json({ message: 'Worker tidak valid' });
  const { items, total } = await computeBreakdown(sessionId, worker);
  const payout = await Payout.findOneAndUpdate(
    { session: sessionId, worker },
    { items, total, sentAt: new Date() },
    { upsert: true, new: true }
  );
  res.json(payout);
});

// Admin (untuk worker manapun) atau worker yang bersangkutan (lihat punyanya sendiri).
router.get('/session/:sessionId/:worker', authenticate, authorizeWorkerSelf, async (req, res) => {
  const { sessionId, worker } = req.params;
  const payout = await Payout.findOne({ session: sessionId, worker });
  res.json(payout || { session: sessionId, worker, items: [], total: 0, sentAt: null });
});

export default router;