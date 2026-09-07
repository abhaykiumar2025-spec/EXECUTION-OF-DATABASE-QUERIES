require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { connectDB, getDbStatus } = require('./config/db');
const { seedInitialData } = require('./utils/seeder');

const authRoutes = require('./routes/authRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Static files (Serve the frontend dashboard directly)
app.use(express.static(path.join(__dirname, '.')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/mar', analyticsRoutes);
app.use('/api/logs', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health Check & DB Status Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Smart Pill Dispenser for Elderly Care Backend',
    version: '2.5.0',
    authSystem: 'JWT + Bcrypt.js Active',
    database: getDbStatus(),
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API Route Not Found' });
  }
});

// Start Server
const startServer = async () => {
  console.log('====================================================');
  console.log('💊 SMART PILL DISPENSER FOR ELDERLY CARE BACKEND');
  console.log('🔒 JWT Authentication & Token Security Enabled');
  console.log('====================================================');

  const conn = await connectDB();
  app.locals.dbConnected = !!conn;
  await seedInitialData(app.locals.dbConnected);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Web App Dashboard: http://localhost:${PORT}`);
    console.log(`📡 API Base Endpoint: http://localhost:${PORT}/api/status`);
    console.log(`🔐 Auth Endpoint: http://localhost:${PORT}/api/auth/login`);
    console.log('====================================================');
  });
};

startServer();
