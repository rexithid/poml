import { Router } from 'express';
import Order from '../models/Order.js';
import Session from '../models/Session.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

async function nextOrderNo(sessionId) {
  const last = await Order.findOne({ session: sessionId }).sort({ no: -1 }).select('no').lean();
  return last ? last.no + 1 : 1;
}

// Halaman live (publik): semua order di 1 sesi, bisa dicari via ?q=
router.get('/session/:sessionId', async (req, res) => {
  const { q } = req.query;
  const filter = { session: req.params.sessionId };
  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [{ customerId: regex }, { server: regex }];
  }
  const orders = await Order.find(filter).sort({ no: 1 });
  res.json(orders.map((o) => o.toClientJSON()));
});

// Halaman worker: hanya order yang ada jatah untuk worker itu.
router.get('/session/:sessionId/worker/:worker', authenticate, async (req, res) => {
  const { worker } = req.params;
  if (!['AR', 'DR'].includes(worker)) return res.status(400).json({ message: 'Worker tidak valid' });
  if (req.user.role !== 'admin' && req.user.role !== worker) {
    return res.status(403).json({ message: 'Tidak punya akses ke data worker lain' });
  }
  const orders = await Order.find({
    session: req.params.sessionId,
    [`assignments.${worker}.qty`]: { $gt: 0 },
  }).sort({ no: 1 });
  res.json(orders.map((o) => o.toClientJSON({ forWorker: worker })));
});

router.post('/session/:sessionId', authenticate, authorize('admin'), async (req, res) => {
  const { productId, customerId, server, quantity, assignAR = 0, assignDR = 0 } = req.body || {};
  if (!productId || !customerId || !server || !quantity) {
    return res.status(400).json({ message: 'productId, customerId, server, quantity wajib diisi' });
  }
  const qty = Number(quantity);
  const ar = Number(assignAR) || 0;
  const dr = Number(assignDR) || 0;
  if (ar + dr > qty) {
    return res.status(400).json({ message: 'Total pembagian ke worker melebihi kuantitas order' });
  }
  const session = await Session.findById(req.params.sessionId);
  if (!session) return res.status(404).json({ message: 'Sesi tidak ditemukan' });

  const no = await nextOrderNo(req.params.sessionId);
  const order = await Order.create({
    session: req.params.sessionId,
    product: productId,
    no,
    customerId: String(customerId).trim(),
    server: String(server).trim(),
    quantity: qty,
    assignments: {
      AR: { qty: ar, done: 0, refund: 0 },
      DR: { qty: dr, done: 0, refund: 0 },
    },
  });
  res.status(201).json(order.toClientJSON());
});

// Admin: edit data dasar order atau ubah pembagian jatah worker.
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

  const { customerId, server, quantity, assignAR, assignDR } = req.body || {};
  const oldCustomerId = order.customerId;
  const oldServer = order.server;

  if (customerId !== undefined) order.customerId = String(customerId).trim();
  if (server !== undefined) order.server = String(server).trim();
  if (quantity !== undefined) order.quantity = Number(quantity);
  if (assignAR !== undefined) order.assignments.AR.qty = Number(assignAR);
  if (assignDR !== undefined) order.assignments.DR.qty = Number(assignDR);

  if (order.assignments.AR.qty + order.assignments.DR.qty > order.quantity) {
    return res.status(400).json({ message: 'Total pembagian ke worker melebihi kuantitas order' });
  }

  // Kalau order lagi ditandai "ID salah" dan admin baru saja mengubah ID/server-nya,
  // anggap itu perbaikan: otomatis lepas status salah id + kabari worker yang tadi menandainya.
  const idOrServerChanged = order.customerId !== oldCustomerId || order.server !== oldServer;
  if (order.salahId && idOrServerChanged) {
    order.salahId = false;
    if (order.salahIdBy) {
      order.idFixedNotice = { for: order.salahIdBy, at: new Date() };
    }
    order.salahIdBy = null;
    order.updateHistory.push({ by: 'admin', at: new Date(), fixed: true });
  }

  await order.save();
  res.json(order.toClientJSON());
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.json({ deleted: true });
});

// Worker (atau admin) menambah/mengurangi counter done/refund untuk jatahnya sendiri.
router.patch('/:id/progress', authenticate, async (req, res) => {
  const { worker, action } = req.body || {}; // action: 'done' | 'refund' | 'undo-done' | 'undo-refund'
  if (!['AR', 'DR'].includes(worker)) return res.status(400).json({ message: 'Worker tidak valid' });
  if (req.user.role !== 'admin' && req.user.role !== worker) {
    return res.status(403).json({ message: 'Hanya boleh mengubah progres milik sendiri' });
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

  const mine = order.assignments[worker];
  const processed = mine.done + mine.refund;

  if (action === 'done') {
    if (processed >= mine.qty) return res.status(400).json({ message: 'Jatah sudah selesai semua' });
    mine.done += 1;
  } else if (action === 'refund') {
    if (processed >= mine.qty) return res.status(400).json({ message: 'Jatah sudah selesai semua' });
    mine.refund += 1;
  } else if (action === 'undo-done') {
    if (mine.done <= 0) return res.status(400).json({ message: 'Tidak ada progres done untuk dibatalkan' });
    mine.done -= 1;
  } else if (action === 'undo-refund') {
    if (mine.refund <= 0) return res.status(400).json({ message: 'Tidak ada progres reffund untuk dibatalkan' });
    mine.refund -= 1;
  } else {
    return res.status(400).json({ message: 'Aksi tidak dikenal' });
  }

  // Catatan: aksi progres (done/refund/undo) SENGAJA tidak menyentuh riwayat update.
  // Riwayat update hanya bertambah lewat tombol "Update" yang eksplisit (lihat /mark-update).
  await order.save();
  res.json(order.toClientJSON({ forWorker: req.user.role === 'admin' ? undefined : worker }));
});

// Tandai ID salah -> seluruh bar jadi merah. Ini juga tidak menyentuh riwayat update.
router.patch('/:id/salah-id', authenticate, async (req, res) => {
  const { worker, value } = req.body || {};
  if (!['AR', 'DR'].includes(worker)) return res.status(400).json({ message: 'Worker tidak valid' });
  if (req.user.role !== 'admin' && req.user.role !== worker) {
    return res.status(403).json({ message: 'Tidak punya akses' });
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });
  const next = value !== undefined ? !!value : !order.salahId;
  order.salahId = next;
  // Catat siapa yang menandai, supaya nanti kalau admin perbaiki ID, notifikasinya nyampe ke worker yang tepat.
  order.salahIdBy = next ? worker : null;
  await order.save();
  res.json(order.toClientJSON({ forWorker: req.user.role === 'admin' ? undefined : worker }));
});

// Worker menutup notifikasi "ID/server sudah diperbaiki admin" setelah dibaca.
router.patch('/:id/notice/ack', authenticate, async (req, res) => {
  if (!['AR', 'DR'].includes(req.user.role)) return res.status(400).json({ message: 'Role tidak valid' });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });
  if (order.idFixedNotice && order.idFixedNotice.for === req.user.role) {
    order.idFixedNotice = null;
    await order.save();
  }
  res.json(order.toClientJSON({ forWorker: req.user.role }));
});

// Tandai "sudah diupdate" -> TAMBAH baris baru ke riwayat (tidak menimpa yang lama),
// sekalian simpan SNAPSHOT progres saat itu juga (bukan progres terkini/live).
router.patch('/:id/mark-update', authenticate, async (req, res) => {
  const { worker } = req.body || {};
  let by;
  if (req.user.role === 'admin') {
    by = worker && ['AR', 'DR'].includes(worker) ? worker : 'admin';
  } else {
    if (!['AR', 'DR'].includes(req.user.role)) return res.status(400).json({ message: 'Role tidak valid' });
    by = req.user.role;
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

  // Kalau order lagi ditandai ID salah, riwayatnya cukup catat "ID salah" -- progres angka
  // nggak relevan/menyesatkan selama ID-nya sendiri belum benar.
  let entry;
  if (order.salahId) {
    entry = { by, at: new Date(), salahId: true };
  } else if (by === 'AR' || by === 'DR') {
    // Worker klik -> snapshot jatah & progres worker itu sendiri.
    const mine = order.assignments[by];
    entry = { by, at: new Date(), done: mine.done, refund: mine.refund, qty: mine.qty };
  } else {
    // Admin klik -> snapshot progres keseluruhan order (AR+DR).
    const ar = order.assignments.AR;
    const dr = order.assignments.DR;
    entry = { by, at: new Date(), done: ar.done + dr.done, refund: ar.refund + dr.refund, qty: order.quantity };
  }

  order.updateHistory.push(entry);
  await order.save();
  res.json(order.toClientJSON({ forWorker: req.user.role === 'admin' ? undefined : req.user.role }));
});

export default router;