// Simple stats endpoint
module.exports = function(app) {
    app.get('/api/rgb/stats', (req, res) => {
        res.json({
            uptimeSec: Math.floor(process.uptime()),
            remainingBatches: 23700,
            tier: 'bronze',
            mintedToday: 0,
            totalMinted: 0,
            health: 'ok'
        });
    });
    console.log('✅ Stats endpoint registered at /api/rgb/stats');
};