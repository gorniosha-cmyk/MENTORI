const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const { iikoConfig, requests } = require('../data/store');

const router = express.Router();

// GET /api/iiko/status
router.get('/status', verifyToken, (_req, res) => {
  res.json({ connected: iikoConfig.connected, url: iikoConfig.url });
});

// POST /api/iiko/test — test connection (simulated)
router.post('/test', verifyToken, requireRole('manager'), (req, res) => {
  const { url, apiKey } = req.body;
  if (!url || !apiKey)
    return res.status(400).json({ error: 'Укажите URL и API ключ' });

  // Simulate connection delay
  setTimeout(() => {
    // Simulate: URLs starting with https:// are "valid"
    if (url.startsWith('http')) {
      iikoConfig.connected = true;
      iikoConfig.url = url;
      iikoConfig.apiKey = apiKey;
      res.json({ success: true, message: 'Подключение к iiko установлено', version: '7.8.5' });
    } else {
      iikoConfig.connected = false;
      res.status(400).json({ success: false, message: 'Не удалось подключиться. Проверьте URL.' });
    }
  }, 1500);
});

// POST /api/iiko/sync/:id — sync approved request to iiko (simulated)
router.post('/sync/:id', verifyToken, requireRole('manager'), (req, res) => {
  const request = requests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Заявка не найдена' });
  if (request.status !== 'approved')
    return res.status(400).json({ error: 'Синхронизировать можно только одобренные заявки' });

  // Simulate API call to iiko
  setTimeout(() => {
    const iikoActId = `ACT-${Date.now().toString(36).toUpperCase()}`;
    request.iikoSynced = true;
    request.iikoActId = iikoActId;

    res.json({
      success: true,
      iikoActId,
      message: `Акт списания создан в iiko: ${iikoActId}`,
      syncedAt: new Date().toISOString(),
    });
  }, 2000);
});

module.exports = router;
