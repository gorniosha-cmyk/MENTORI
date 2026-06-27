const express = require('express');
const { employees } = require('../data/store');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/employees
router.get('/', verifyToken, (_req, res) => {
  res.json(employees);
});

module.exports = router;
