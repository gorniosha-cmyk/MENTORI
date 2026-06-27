const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requests, stores } = require('../data/store');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Helper — safe request view
function safeReq(r) { return { ...r }; }

// GET /api/requests — manager sees all, employee sees own
router.get('/', verifyToken, (req, res) => {
  let list = req.user.role === 'manager'
    ? [...requests]
    : requests.filter((r) => r.authorId === req.user.id);

  // Filters via query
  const { status, deductionType, search } = req.query;
  if (status && status !== 'all') list = list.filter((r) => r.status === status);
  if (deductionType && deductionType !== 'all')
    list = list.filter((r) => r.deductionType === deductionType);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (r) =>
        r.product.toLowerCase().includes(q) ||
        r.storeName.toLowerCase().includes(q) ||
        r.authorName.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q)
    );
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list.map(safeReq));
});

// GET /api/requests/:id
router.get('/:id', verifyToken, (req, res) => {
  const r = requests.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Заявка не найдена' });
  if (req.user.role === 'employee' && r.authorId !== req.user.id)
    return res.status(403).json({ error: 'Нет доступа' });
  res.json(safeReq(r));
});

// POST /api/requests — create new request (multipart/form-data)
router.post('/', verifyToken, requireRole('employee'), upload.single('photo'), (req, res) => {
  const { storeId, product, qty, deductionType, deductionEmployeeId, deductionEmployeeName, comment } = req.body;

  if (!storeId || !product || !qty || !comment)
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  if (comment.trim().length < 10)
    return res.status(400).json({ error: 'Комментарий минимум 10 символов' });

  const store = stores.find((s) => s.id === storeId);
  if (!store) return res.status(400).json({ error: 'Торговая точка не найдена' });

  const newReq = {
    id: uuidv4(),
    authorId: req.user.id,
    authorName: req.user.name,
    storeId,
    storeName: store.name,
    product: product.trim(),
    qty: qty.trim(),
    deductionType: deductionType === 'yes' ? 'yes' : 'no',
    deductionEmployeeId: deductionType === 'yes' ? (deductionEmployeeId || null) : null,
    deductionEmployeeName: deductionType === 'yes' ? (deductionEmployeeName || null) : null,
    comment: comment.trim(),
    photoPath: req.file ? `/uploads/${req.file.filename}` : null,
    status: 'pending',
    rejectReason: null,
    iikoSynced: false,
    createdAt: new Date().toISOString(),
    reviewedAt: null,
  };

  requests.unshift(newReq);

  // Emit socket.io event to manager room
  const io = req.app.get('io');
  if (io) {
    io.to('managers').emit('new-request', safeReq(newReq));
  }

  res.status(201).json(safeReq(newReq));
});

// PATCH /api/requests/:id — approve or reject (manager only)
router.patch('/:id', verifyToken, requireRole('manager'), (req, res) => {
  const r = requests.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Заявка не найдена' });
  if (r.status !== 'pending')
    return res.status(400).json({ error: 'Заявка уже обработана' });

  const { action, rejectReason } = req.body;

  if (action === 'approve') {
    r.status = 'approved';
    r.reviewedAt = new Date().toISOString();

    // Trigger iiko sync automatically
    const io = req.app.get('io');
    if (io) io.to('employees').emit('request-updated', { id: r.id, status: 'approved' });
  } else if (action === 'reject') {
    if (!rejectReason || rejectReason.trim().length < 3)
      return res.status(400).json({ error: 'Укажите причину отклонения' });
    r.status = 'rejected';
    r.rejectReason = rejectReason.trim();
    r.reviewedAt = new Date().toISOString();

    const io = req.app.get('io');
    if (io) io.to('employees').emit('request-updated', { id: r.id, status: 'rejected' });
  } else {
    return res.status(400).json({ error: 'action должен быть approve или reject' });
  }

  res.json(safeReq(r));
});

module.exports = router;
