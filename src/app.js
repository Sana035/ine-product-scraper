const express = require('express');
const cors = require('cors');
require('dotenv').config();

const catalogRoutes = require('./routes/catalogRoutes');
const productRoutes = require('./routes/productRoutes');
const exportRoutes = require('./routes/exportRoutes');
const cronRoutes = require('./routes/cronRoutes');

const app = express();

// Enable CORS for local dev and production Vercel frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-cron-secret']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Health Check
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'INE Price Tracker API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes Registration
app.use('/api/catalog', catalogRoutes);
app.use('/api/products', productRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/cron', cronRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err.stack || err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

module.exports = app;
