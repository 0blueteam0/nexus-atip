/**
 * Example Plugin - Router
 * Demonstrates how to create API endpoints for a plugin
 */

const express = require('express');
const router = express.Router();
const { collectExampleData, getExampleStats } = require('./collector');

// GET /api/plugins/example
router.get('/', (req, res) => {
    try {
        const data = collectExampleData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/plugins/example/stats
router.get('/stats', (req, res) => {
    try {
        const stats = getExampleStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/plugins/example/action
router.post('/action', (req, res) => {
    try {
        const { action, data } = req.body;

        // Example: emit a socket event
        if (req.io) {
            req.io.emit('plugin-example-action', { action, data, timestamp: new Date().toISOString() });
        }

        res.json({
            success: true,
            action,
            processed: true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
