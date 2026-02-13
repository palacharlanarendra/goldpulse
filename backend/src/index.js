// src/index.js - forceful restart
// Main application entry point
// Sets up Express server, middleware, and routes.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db'); // Import database module
const priceService = require('./services/priceService');
const alertService = require('./services/alertService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Schedule Cron Job: Every 5 minutes
cron.schedule('*/5 * * * *', () => {
    priceService.fetchAndStorePrice();
});

// Health Check Endpoint
// GET /health
// Checks database connectivity and returns status
app.get('/health', async (req, res) => {
    try {
        // Execute a simple query to check DB connection
        await db.query('SELECT 1');

        res.json({
            status: 'ok',
            db: 1,
        });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
        });
    }
});

// GET /price/latest
app.get('/price/latest', async (req, res) => {
    const data = priceService.getLatestPrice();

    // If cache is empty, try to fetch last from DB
    if (!data.price) {
        try {
            const result = await db.query('SELECT * FROM price_snapshots ORDER BY fetched_at DESC LIMIT 1');
            if (result.rows.length > 0) {
                const row = result.rows[0];
                return res.json({
                    metal: row.metal,
                    price: parseFloat(row.price),
                    currency: 'INR',
                    updated_at: row.fetched_at
                });
            }
        } catch (err) {
            console.error('DB Read Error:', err);
        }
    }

    res.json(data);
});

// POST /alerts
app.post('/alerts', async (req, res) => {
    const { device_token, target_price, direction } = req.body;

    if (!device_token || !target_price) {
        return res.status(400).json({ status: 'error', message: 'device_token and target_price required' });
    }

    try {
        const userId = await alertService.createOrGetUser(device_token);

        // Fetch current price to determine direction (if not provided) or validate
        const currentPrice = await priceService.getCurrentPrice();

        const alert = await alertService.createAlert(userId, target_price, currentPrice, direction);

        res.json({
            status: 'alert_created',
            id: alert.id,
            metal: alert.metal,
            target_price: alert.target_price,
            direction: alert.direction
        });
    } catch (err) {
        if (err.code === 'DUPLICATE_ALERT') {
            return res.status(409).json({ status: 'error', message: err.message });
        }
        console.error('Create alert error:', err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// GET /alerts
app.get('/alerts', async (req, res) => {
    const { device_token } = req.query;

    if (!device_token) {
        return res.status(400).json({ status: 'error', message: 'device_token required' });
    }

    try {
        const userId = await alertService.createOrGetUser(device_token);
        const alerts = await alertService.getUserAlerts(userId);
        res.json(alerts);
    } catch (err) {
        console.error('Get alerts error:', err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// DELETE /alerts/:id
app.delete('/alerts/:id', async (req, res) => {
    const { id } = req.params;
    // Accept token from body (legacy) or query (standard)
    const device_token = req.body.device_token || req.query.device_token;

    if (!device_token) {
        return res.status(400).json({ status: 'error', message: 'device_token required' });
    }

    try {
        const userId = await alertService.createOrGetUser(device_token);
        const success = await alertService.deleteAlert(id, userId);

        if (success) {
            res.json({ status: 'success', message: 'Alert deleted' });
        } else {
            res.status(404).json({ status: 'error', message: 'Alert not found or unauthorized' });
        }
    } catch (err) {
        console.error('Delete alert error:', err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
