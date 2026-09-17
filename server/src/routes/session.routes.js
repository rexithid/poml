import { Router } from 'express';
import Session from '../models/Session.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Publik: dipakai halaman live & juga admin/worker untuk daftar tab sesi.
router.get('/', async (req, res) => {
  const sessions = await Session.find().sort({ createdAt: 1 }).lean();
  res.json(sessions);
});

// Ringkasan produk + total qty per sesi (indikator di bawah tab sesi).
// role query dipakai supaya worker hanya melihat jumlah jatah miliknya sendiri.
router.get('/:id/summary', async (req, res) => {
  const { id } = req.params;
  const role = req.query.role; // 'AR' | 'DR' | undefined
  const products = await Product.find({ session: id }).sort({ createdAt: 1 }).lean();
  const orders = await Order.find({ session: id }).lean();

  const summary = products.map((p) => {
    const productOrders = orders.filter((o) => String(o.product) === String(p._id));
    let total;
    if (role === 'AR' || role === 'DR') {
      total = productOrders.reduce((sum, o) => sum + (o.assignments?.[role]?.qty || 0), 0);
    } else {
      total = productOrders.reduce((sum, o) => sum + o.quantity, 0);
    }
    return { productId: p._id, name: p.name, total };
  });

  res.json(summary);
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ message: 'Nama sesi wajib diisi' });
  const session = await Session.create({ name: name.trim() });
  res.status(201).json(session);
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { id } = req.params;
  const products = await Product.find({ session: id }).select('_id');
  await Order.deleteMany({ session: id });
  await Product.deleteMany({ session: id });
  await Session.findByIdAndDelete(id);
  res.json({ deleted: true, productsRemoved: products.length });
});

export default router;
