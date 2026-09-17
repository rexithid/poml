import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Belum login' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { role: 'admin'|'AR'|'DR', username }
    next();
  } catch {
    return res.status(401).json({ message: 'Sesi tidak valid, silakan login ulang' });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Tidak punya akses untuk aksi ini' });
    }
    next();
  };
}

// Middleware khusus: yang boleh akses hanya admin ATAU worker milik role tsb sendiri
export function authorizeWorkerSelf(req, res, next) {
  const { role } = req.user;
  const paramWorker = req.params.worker;
  if (role === 'admin') return next();
  if ((role === 'AR' || role === 'DR') && role === paramWorker) return next();
  return res.status(403).json({ message: 'Tidak punya akses untuk data worker lain' });
}
