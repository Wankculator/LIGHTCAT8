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

// Simple in-memory storage for invoices
const invoiceStore = new Map();

// BTCPay API request helper
async function btcpayRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BTCPAY_URL);
        const options = {
            method,
            headers: {
                'Authorization': `token ${BTCPAY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        logger.info(`BTCPay Request: ${method} ${url.toString()}`);
        logger.info(`Using API key: ${BTCPAY_API_KEY?.substring(0, 10)}...`);

        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                logger.info(`BTCPay Response Status: ${res.statusCode}`);
                logger.info(`BTCPay Response Headers:`, res.headers);
                logger.info(`BTCPay Response Body: ${body.substring(0, 500)}...`);
                
                try {
                    const result = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(result);
                    } else {
                        logger.error(`BTCPay API Error - Status ${res.statusCode}:`, result);
                        reject(new Error(`BTCPay error (${res.statusCode}): ${result.message || result.error || body}`));
                    }
                } catch (e) {
                    if (res.statusCode === 401) {
                        reject(new Error(`Authentication failed. Please check API key.`));
                    } else {
                        reject(new Error(`Failed to parse BTCPay response: ${body}`));
                    }
                }
            });
        });

        req.on('error', (error) => {
            logger.error('BTCPay request error:', error);
            reject(error);
        });
        
        if (data) {
            const payload = JSON.stringify(data);
            logger.info(`BTCPay Request Body: ${payload}`);
            req.write(payload);
        }
        
        req.end();
    });
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'LIGHTCAT API Running',
        paymentMode: BTCPAY_API_KEY ? 'REAL' : 'MOCK'
    });
});

// RGB invoice creation - REAL PAYMENTS
app.post('/api/rgb/invoice', async (req, res) => {
    try {
        const { rgbInvoice, batchCount, email, tier, gameSessionId } = req.body;
        
        logger.info('Creating REAL invoice', { 
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
            bronze: 10,
            silver: 20,
            gold: 30
        };
        
        // Convert batchCount to number if it's a string
        const batchCountNum = parseInt(batchCount, 10);
        
        // Check if batch count is valid
        if (!batchCountNum || isNaN(batchCountNum) || batchCountNum < 1) {
            return res.status(400).json({
                success: false,
                error: 'Please select at least one batch'
            });
        }
        
        if (batchCountNum > maxBatches[tier]) {
            return res.status(400).json({
                success: false,
                error: `${tier} tier allows maximum ${maxBatches[tier]} batches`
            });
        }
        
        const amount = batchCountNum * 2000; // 2000 sats per batch
        const invoiceId = `rgb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        
        // Create BTCPay invoice if configured
        let paymentRequest, btcpayInvoiceId;
        
        if (BTCPAY_API_KEY) {
            try {
                logger.info('Creating BTCPay invoice...');
                
                const btcpayData = {
                    amount: amount.toString(),
                    currency: 'SATS',
                    metadata: {
                        orderId: invoiceId,
                        rgbInvoice: rgbInvoice,
                        batchCount: batchCount,
                        tier: tier,
                        gameSessionId: gameSessionId
                    }
                };
                
                const btcpayResponse = await btcpayRequest(
                    `/api/v1/stores/${BTCPAY_STORE_ID}/invoices`,
                    'POST',
                    btcpayData
                );
                
                logger.info('BTCPay raw response:', JSON.stringify(btcpayResponse, null, 2));
                
                btcpayInvoiceId = btcpayResponse.id;
                
                // Fetch payment methods separately to get Lightning invoice
                try {
                    const paymentMethodsResponse = await btcpayRequest(
                        `/api/v1/stores/${BTCPAY_STORE_ID}/invoices/${btcpayInvoiceId}/payment-methods`,
                        'GET'
                    );
                    
                    logger.info('Payment methods response:', JSON.stringify(paymentMethodsResponse, null, 2));
                    
                    // Find Lightning payment method
                    const lightningMethod = paymentMethodsResponse.find(
                        method => method.paymentMethodId === 'BTC-LN' || 
                                 method.paymentMethodId === 'BTC-LightningNetwork'
                    );
                    
                    if (lightningMethod && lightningMethod.destination) {
                        paymentRequest = lightningMethod.destination;
                        logger.info('Found Lightning invoice:', paymentRequest.substring(0, 50) + '...');
                    } else {
                        logger.warn('No Lightning payment method found');
                        paymentRequest = `lightning:${btcpayInvoiceId}`;
                    }
                    
                } catch (pmError) {
                    logger.error('Failed to fetch payment methods:', pmError);
                    paymentRequest = `lightning:${btcpayInvoiceId}`;
                }
                
                logger.info('BTCPay invoice created', { 
                    btcpayId: btcpayInvoiceId,
                    amount: amount,
                    hasPaymentRequest: !!paymentRequest
                });
                
            } catch (error) {
                logger.error('BTCPay invoice creation failed:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create payment invoice. Please try again.'
                });
            }
        } else {
            // Mock mode
            paymentRequest = `lnbc${amount}n1mock${crypto.randomBytes(32).toString('hex')}`;
            logger.warn('Using MOCK invoice - no real payments!');
        }
        
        // Store invoice data
        const invoiceData = {
            invoiceId,
            btcpayInvoiceId,
            rgbInvoice,
            batchCount,
            amount,
            tier,
            gameSessionId,
            email,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
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
            remainingBatches: 25800 - 2100, // Mock remaining
            tier: tier,
            idempotencyKey: crypto.randomBytes(16).toString('hex')
        };
        
        logger.info('Invoice created successfully', { 
            invoiceId, 
            amount, 
            tier,
            isReal: !!BTCPAY_API_KEY
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
    
    // Check BTCPay status if configured
    if (BTCPAY_API_KEY && invoice.btcpayInvoiceId) {
        try {
            const btcpayStatus = await btcpayRequest(
                `/api/v1/stores/${BTCPAY_STORE_ID}/invoices/${invoice.btcpayInvoiceId}`
            );
            
            if (btcpayStatus.status === 'Settled' || btcpayStatus.status === 'Processing') {
                invoice.status = 'paid';
                invoiceStore.set(invoiceId, invoice);
                
                return res.json({
                    success: true,
                    status: 'paid',
                    message: 'Payment received! Your RGB tokens are ready.',
                    consignment: `mock-consignment-${invoiceId}` // In production, generate real RGB consignment
                });
            }
        } catch (error) {
            logger.error('Failed to check BTCPay status:', error);
        }
    }
    
    res.json({
        success: true,
        status: invoice.status,
        message: invoice.status === 'pending' ? 'Waiting for payment...' : 'Payment received!'
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

// BTCPay webhook endpoint
app.post('/api/webhooks/btcpay', (req, res) => {
    const signature = req.headers['btcpay-sig'];
    
    // In production, verify webhook signature
    logger.info('BTCPay webhook received:', req.body);
    
    // Process payment confirmation
    if (req.body.type === 'InvoiceSettled') {
        const metadata = req.body.metadata;
        if (metadata && metadata.orderId) {
            const invoice = invoiceStore.get(metadata.orderId);
            if (invoice) {
                invoice.status = 'paid';
                invoiceStore.set(metadata.orderId, invoice);
                logger.info('Payment confirmed for invoice:', metadata.orderId);
            }
        }
    }
    
    res.status(200).send('OK');
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
    console.log(`Payment Mode: ${BTCPAY_API_KEY ? '💰 REAL PAYMENTS' : '🧪 MOCK MODE'}`);
    
    if (BTCPAY_API_KEY) {
        console.log('✅ BTCPay configured - Real Lightning payments enabled!');
        console.log(`BTCPay URL: ${BTCPAY_URL}`);
        console.log(`Store ID: ${BTCPAY_STORE_ID}`);
    } else {
        console.log('⚠️  BTCPay not configured - Using mock invoices');
    }
});