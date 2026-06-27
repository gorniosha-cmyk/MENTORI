const express = require('express');
const { stores } = require('../data/store');
const { employees } = require('../data/store');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/stores
router.get('/', verifyToken, (_req, res) => {
  res.json(stores);
});

module.exports = router;
