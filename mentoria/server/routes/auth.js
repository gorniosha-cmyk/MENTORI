const express = require('express');
const jwt = require('jsonwebtoken');
const { users } = require('../data/store');
const { SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password)
    return res.status(400).json({ error: 'Введите логин и пароль' });

  const user = users.find(
    (u) => u.login === login.trim() && u.password === password
  );
  if (!user)
    return res.status(401).json({ error: 'Неверный логин или пароль' });

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 3600 * 1000,
    sameSite: 'lax',
    secure: false,
  });

  const { password: _pw, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// GET /api/auth/me
const { verifyToken } = require('../middleware/auth');
router.get('/me', verifyToken, (req, res) => {
  const { password: _pw, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

module.exports = router;
