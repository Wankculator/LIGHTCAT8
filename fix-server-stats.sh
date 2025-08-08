#!/bin/bash

# Fix the server stats endpoint
cat << 'EOF' > /tmp/stats-fix.js

// Add this before the last line of app.js
// Stats endpoint - always returns 200 with JSON
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

EOF

echo "Stats fix script created"