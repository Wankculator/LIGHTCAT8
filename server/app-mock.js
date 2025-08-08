const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../client')));

// Simple logger
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    warn: (msg, data) => console.log(`[WARN] ${msg}`, data || ''),
    error: (msg, data) => console.error(`[ERROR] ${msg}`, data || '')
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'LIGHTCAT API Running' });
});

// RGB invoice creation
app.post('/api/rgb/invoice', async (req, res) => {
    try {
        const { rgbInvoice, batchCount, email, tier, gameSessionId } = req.body;
        
        logger.info('Creating invoice', { 
            rgbInvoice: rgbInvoice?.substring(0, 20) + '...', 
            batchCount, 
            tier, 
            gameSessionId 
        });
        
        // Basic validation
        if (!rgbInvoice || !rgbInvoice.startsWith('rgb:')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid RGB invoice format'
            });
        }
        
        if (!tier) {
            return res.status(400).json({
                success: false,
                error: 'Mint is locked! You must play the game to unlock purchasing. Score 11+ for Bronze tier.'
            });
        }
        
        // Validate batch count for tier
        const maxBatches = {
            bronze: 5,
            silver: 8,
            gold: 10
        };
        
        if (batchCount > maxBatches[tier]) {
            return res.status(400).json({
                success: false,
                error: `${tier} tier allows maximum ${maxBatches[tier]} batches`
            });
        }
        
        // Generate invoice data
        const invoiceId = `rgb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const amount = batchCount * 2000; // 2000 sats per batch
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
        
        // Mock Lightning invoice (in production, this would call BTCPay)
        const paymentRequest = process.env.RGB_MOCK_MODE === 'true' 
            ? `lnbc${amount}n1mock${crypto.randomBytes(32).toString('hex')}`
            : 'lnbc100n1test'; // This would be from BTCPay in production
        
        const response = {
            success: true,
            invoice: {
                id: invoiceId,
                payment_request: paymentRequest,
                amount: amount,
                expires_at: expiresAt,
                qrCode: `lightning:${paymentRequest}`
            },
            invoiceId: invoiceId,
            lightningInvoice: paymentRequest,
            amount: amount,
            expiresAt: expiresAt,
            qrCode: `lightning:${paymentRequest}`,
            remainingBatches: 25800 - 2100, // Mock remaining
            tier: tier,
            idempotencyKey: crypto.randomBytes(16).toString('hex')
        };
        
        logger.info('Invoice created successfully', { invoiceId, amount, tier });
        
        res.json(response);
        
    } catch (error) {
        logger.error('Failed to create invoice:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create invoice. Please try again.'
        });
    }
});

// Payment status check
app.get('/api/rgb/invoice/:invoiceId/status', (req, res) => {
    const { invoiceId } = req.params;
    
    // Mock response
    res.json({
        success: true,
        status: 'pending',
        message: 'Waiting for payment...'
    });
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
    res.json({
        tokens_sold: 1470000,
        circulation_percentage: 7,
        holders: 489,
        total_batches: 27900,
        batches_sold: 2100,
        remaining_batches: 25800,
        price_per_batch_sats: 2000
    });
});

// Game score submission
app.post('/api/game/score', (req, res) => {
    const { score } = req.body;
    
    let tier = null;
    let maxBatches = 0;
    
    if (score >= 28) {
        tier = 'gold';
        maxBatches = 10;
    } else if (score >= 18) {
        tier = 'silver';
        maxBatches = 8;
    } else if (score >= 11) {
        tier = 'bronze';
        maxBatches = 5;
    }
    
    res.json({
        success: true,
        score,
        tier,
        maxBatches,
        message: tier ? `Congratulations! You've unlocked ${tier} tier!` : 'Keep trying to unlock rewards!'
    });
});

// Error handling
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`🐱⚡ LIGHTCAT server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`RGB Mock Mode: ${process.env.RGB_MOCK_MODE}`);
});