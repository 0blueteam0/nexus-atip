/**
 * Example Plugin - Collector
 * Demonstrates how to create a custom data collector
 */

function collectExampleData() {
    return {
        message: 'Hello from example plugin!',
        timestamp: new Date().toISOString(),
        stats: {
            randomNumber: Math.floor(Math.random() * 100),
            status: 'active'
        }
    };
}

function getExampleStats() {
    return {
        pluginName: 'example-plugin',
        version: '1.0.0',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed
    };
}

module.exports = {
    collectExampleData,
    getExampleStats
};
