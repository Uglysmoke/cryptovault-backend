const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load env variables FIRST
dotenv.config();

const { connectDB } = require('./src/config/db');

// Connect to database
connectDB();

const app = express();

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====
app.use('/api/auth',  require('./src/routes/authRoutes'));
app.use('/api/user',  require('./src/routes/userRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ CryptoVault API is running',
    timestamp: new Date(),
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong' });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
});
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.CLIENT_URL,
    'https://cryptovault-frontend.vercel.app',
  ],
  credentials: true,
}));