const express = require('express');
const cors = require('cors');
const path = require('path');
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
    error: (msg, data) => console.error(`[ERROR] ${msg}`, data || '')
};

// In-memory storage for invoices
const invoices = new Map();

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: Date.now()
    });
});

// Create invoice endpoint
app.post('/api/rgb/invoice', (req, res) => {
    const { rgbInvoice, batchCount, email } = req.body;
    
    const invoiceId = 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const amount = batchCount * 2000; // 2000 sats per batch
    const tokenAmount = batchCount * 700; // 700 tokens per batch
    
    const invoice = {
        id: invoiceId,
        rgbInvoice,
        batchCount,
        tokenAmount,
        amount,
        email,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        paymentRequest: `lnbc${amount}n1pjmock${Math.random().toString(36).substr(2, 20)}`
    };
    
    invoices.set(invoiceId, invoice);
    
    logger.info('Created invoice', { invoiceId, batchCount, amount });
    
    res.json({
        success: true,
        invoiceId,
        paymentRequest: invoice.paymentRequest,
        amount,
        batchCount,
        tokenAmount,
        expiresAt: invoice.expiresAt
    });
});

// Check invoice status
app.get('/api/rgb/invoice/:id/status', (req, res) => {
    const { id } = req.params;
    const invoice = invoices.get(id);
    
    if (!invoice) {
        // Return mock data for testing
        return res.json({
            success: true,
            status: 'processing',
            invoice: {
                id,
                batchCount: 5,
                tokenAmount: 3500,
                amount: 10000,
                status: 'processing'
            }
        });
    }
    
    // Simulate payment processing
    if (invoice.status === 'pending' && Math.random() > 0.7) {
        invoice.status = 'paid';
        invoice.paidAt = new Date().toISOString();
    }
    
    if (invoice.status === 'paid' && Math.random() > 0.5) {
        invoice.status = 'processing';
    }
    
    if (invoice.status === 'processing' && Math.random() > 0.6) {
        invoice.status = 'delivered';
        invoice.consignment = Buffer.from('MOCK_CONSIGNMENT_DATA').toString('base64');
    }
    
    res.json({
        success: true,
        status: invoice.status,
        invoice: {
            id: invoice.id,
            batchCount: invoice.batchCount,
            tokenAmount: invoice.tokenAmount,
            amount: invoice.amount,
            status: invoice.status
        },
        consignment: invoice.consignment,
        paid: invoice.status !== 'pending'
    });
});

// Stats endpoint
app.get('/api/rgb/stats', (req, res) => {
    res.json({
        success: true,
        stats: {
            totalSupply: 21000000,
            circulatingSupply: 5000000,
            totalBatches: 30000,
            batchesSold: invoices.size,
            totalTransactions: invoices.size,
            activeUsers: Math.floor(invoices.size * 0.7)
        }
    });
});

// Game score endpoint
app.post('/api/game/score', (req, res) => {
    const { score } = req.body;
    
    let tier = null;
    let maxBatches = 0;
    
    if (score >= 25) {
        tier = 'gold';
        maxBatches = 30;
    } else if (score >= 15) {
        tier = 'silver';
        maxBatches = 20;
    } else if (score >= 11) {
        tier = 'bronze';
        maxBatches = 10;
    }
    
    res.json({
        success: true,
        score,
        tier,
        maxBatches,
        message: tier ? `Congratulations! You've unlocked ${tier} tier!` : 'Keep trying to unlock rewards!'
    });
});

// Webhook endpoint (mock)
app.post('/api/rgb/webhook/btcpay', (req, res) => {
    logger.info('Webhook received', req.body);
    res.json({ success: true });
});

app.post('/api/webhooks/btcpay', (req, res) => {
    logger.info('Legacy webhook received', req.body);
    res.json({ success: true });
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
    console.log(`🐱⚡ LIGHTCAT API server running on port ${PORT}`);
    console.log(`Mode: Development/Mock`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET  /api/health`);
    console.log(`  POST /api/rgb/invoice`);
    console.log(`  GET  /api/rgb/invoice/:id/status`);
    console.log(`  GET  /api/rgb/stats`);
    console.log(`  POST /api/game/score`);
    console.log(`  POST /api/rgb/webhook/btcpay`);
});