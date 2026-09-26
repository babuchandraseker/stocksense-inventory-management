const express = require('express');
const statusRoutes = require('./statusRoutes');
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const receiptRoutes = require('./receiptRoutes');
const stockMovementRoutes = require('./stockMovementRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const alertRoutes = require('./alertRoutes');

const router = express.Router();

// Mount status & health check routes
router.use('/', statusRoutes);

// Mount Auth routes (/api/auth)
router.use('/auth', authRoutes);

// Mount Product routes (/api/products)
router.use('/products', productRoutes);

// Mount Inventory routes (/api/inventory)
router.use('/inventory', inventoryRoutes);

// Mount Receipt routes (/api/receipts)
router.use('/receipts', receiptRoutes);

// Mount Stock Movement / Ledger routes (/api/stock-movements and /api/ledger)
router.use('/stock-movements', stockMovementRoutes);
router.use('/ledger', stockMovementRoutes);

// Mount Dashboard routes (/api/dashboard)
router.use('/dashboard', dashboardRoutes);

// Mount Alert routes (/api/alerts)
router.use('/alerts', alertRoutes);

module.exports = router;
