const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
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

// BTCPay configuration
const BTCPAY_URL = process.env.BTCPAY_URL || 'https://btcpay0.voltageapp.io';
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID;

// Force mock mode for safety until BTCPay is properly configured
const USE_REAL_PAYMENTS = false; // Set to true only when BTCPay is confirmed working

// Simple in-memory storage for invoices
const invoiceStore = new Map();

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'LIGHTCAT API Running',
        paymentMode: USE_REAL_PAYMENTS ? 'REAL' : 'MOCK',
        warning: USE_REAL_PAYMENTS ? null : 'Real payments disabled - using mock invoices'
    });
});

// RGB invoice creation
app.post('/api/rgb/invoice', async (req, res) => {
    try {
        const { rgbInvoice, batchCount, email, tier, gameSessionId } = req.body;
        
        logger.info('Creating invoice', { 
            rgbInvoice: rgbInvoice?.substring(0, 20) + '...', 
            batchCount, 
            tier, 
            gameSessionId,
            mode: USE_REAL_PAYMENTS ? 'REAL' : 'MOCK'
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
        
        const amount = batchCount * 2000; // 2000 sats per batch
        const invoiceId = `rgb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        
        // Generate payment request
        let paymentRequest;
        
        if (USE_REAL_PAYMENTS && BTCPAY_API_KEY) {
            // TODO: Implement real BTCPay integration when API key is confirmed working
            logger.warn('Real payments not yet implemented - using mock');
            paymentRequest = `lnbc${amount}n1mock${crypto.randomBytes(32).toString('hex')}`;
        } else {
            // Mock invoice for testing
            paymentRequest = `lnbc${amount}n1mock${crypto.randomBytes(32).toString('hex')}`;
            logger.info('Generated MOCK invoice - DO NOT PAY THIS');
        }
        
        // Store invoice data
        const invoiceData = {
            invoiceId,
            rgbInvoice,
            batchCount,
            amount,
            tier,
            gameSessionId,
            email,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            isMock: !USE_REAL_PAYMENTS
        };
        
        invoiceStore.set(invoiceId, invoiceData);
        
        const response = {
            success: true,
            invoice: {
                id: invoiceId,
                payment_request: paymentRequest,
                amount: amount,
                expires_at: invoiceData.expiresAt,
                qrCode: `lightning:${paymentRequest}`
            },
            invoiceId: invoiceId,
            lightningInvoice: paymentRequest,
            amount: amount,
            expiresAt: invoiceData.expiresAt,
            qrCode: `lightning:${paymentRequest}`,
            remainingBatches: 25800 - 2100,
            tier: tier,
            idempotencyKey: crypto.randomBytes(16).toString('hex'),
            warning: USE_REAL_PAYMENTS ? null : 'This is a MOCK invoice - DO NOT PAY'
        };
        
        logger.info('Invoice created successfully', { 
            invoiceId, 
            amount, 
            tier,
            isMock: !USE_REAL_PAYMENTS
        });
        
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
app.get('/api/rgb/invoice/:invoiceId/status', async (req, res) => {
    const { invoiceId } = req.params;
    const invoice = invoiceStore.get(invoiceId);
    
    if (!invoice) {
        return res.status(404).json({
            success: false,
            error: 'Invoice not found'
        });
    }
    
    // For mock invoices, simulate payment after 5 seconds
    if (invoice.isMock && !USE_REAL_PAYMENTS) {
        const elapsed = Date.now() - new Date(invoice.createdAt).getTime();
        if (elapsed > 5000) {
            invoice.status = 'paid';
            invoiceStore.set(invoiceId, invoice);
        }
    }
    
    res.json({
        success: true,
        status: invoice.status,
        message: invoice.status === 'pending' ? 'Waiting for payment...' : 'Payment received!',
        consignment: invoice.status === 'paid' ? `mock-consignment-${invoiceId}` : null,
        warning: invoice.isMock ? 'This is a mock payment - not real' : null
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
    console.log(`Payment Mode: ${USE_REAL_PAYMENTS ? '💰 REAL PAYMENTS' : '🧪 MOCK MODE'}`);
    
    if (!USE_REAL_PAYMENTS) {
        console.log('⚠️  Real payments disabled for safety - using mock invoices');
        console.log('⚠️  DO NOT PAY any invoices generated by this server');
        console.log('⚠️  Mock payments will auto-complete after 5 seconds');
    }
    
    if (BTCPAY_API_KEY) {
        console.log('📋 BTCPay credentials found but not active');
        console.log('   To enable real payments, verify API key and set USE_REAL_PAYMENTS=true');
    }
});