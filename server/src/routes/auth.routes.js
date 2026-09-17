import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';

const router = Router();

function getAccounts() {
  return [
    { role: 'admin', username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD },
    { role: 'AR', username: process.env.AR_USERNAME, password: process.env.AR_PASSWORD },
    { role: 'DR', username: process.env.DR_USERNAME, password: process.env.DR_PASSWORD },
  ];
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }
  const account = getAccounts().find(
    (a) => a.username && a.password && a.username === username && a.password === password
  );
  if (!account) return res.status(401).json({ message: 'Username atau password salah' });

  const token = jwt.sign({ role: account.role, username: account.username }, process.env.JWT_SECRET, {
    expiresIn: '12h',
  });
  res.json({ token, role: account.role, username: account.username });
});

router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

export default router;
