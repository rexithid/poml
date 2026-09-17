import { Router } from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Daftar produk dalam satu sesi (dipakai semua role untuk isi tab).
router.get('/session/:sessionId', async (req, res) => {
  const products = await Product.find({ session: req.params.sessionId }).sort({ createdAt: 1 }).lean();
  res.json(products);
});

router.post('/session/:sessionId', authenticate, authorize('admin'), async (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ message: 'Nama produk wajib diisi' });
  try {
    const product = await Product.create({ session: req.params.sessionId, name: name.trim() });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Produk dengan nama itu sudah ada di sesi ini' });
    }
    throw err;
  }
});

// Admin set/ubah harga satuan produk (dipakai untuk hitung payout worker).
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { harga, name } = req.body || {};
  const update = {};
  if (harga !== undefined) update.harga = Math.max(0, Number(harga) || 0);
  if (name !== undefined && name.trim()) update.name = name.trim();
  const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
  res.json(product);
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  await Order.deleteMany({ product: req.params.id });
  await Product.findByIdAndDelete(req.params.id);
  res.json({ deleted: true });
});

export default router;
