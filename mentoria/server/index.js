require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const httpServer = http.createServer(app);

// ---- Socket.io ----
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', credentials: true },
});
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join-role', (role) => {
    if (role === 'manager') socket.join('managers');
    if (role === 'employee') socket.join('employees');
  });
});

// ---- Middleware ----
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---- Routes ----
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/stores',    require('./routes/stores'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/requests',  require('./routes/requests'));
app.use('/api/iiko',      require('./routes/iiko'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// 404
app.use((_req, res) => res.status(404).json({ error: 'Маршрут не найден' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n✅ WriteOff Pro Server running on http://localhost:${PORT}`);
  console.log(`   Socket.io ready for real-time events\n`);
});
