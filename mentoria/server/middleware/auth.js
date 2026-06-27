const jwt = require('jsonwebtoken');
const { users } = require('../data/store');

const SECRET = process.env.JWT_SECRET || 'writeoff-pro-secret-2025';

function verifyToken(req, res, next) {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!token) {
    return res.status(401).json({ error: 'Нет токена авторизации' });
  }

  try {
    const payload = jwt.verify(token, SECRET);
    const user = users.find((u) => u.id === payload.id);
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Невалидный или просроченный токен' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole, SECRET };
