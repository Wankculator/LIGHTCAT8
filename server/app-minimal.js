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

// Import controllers
const enhancedRgbPaymentController = require('./controllers/enhancedRgbPaymentController');

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'LIGHTCAT API Running' });
});

// RGB invoice routes
app.post('/api/rgb/invoice', (req, res) => {
    // Add mock database service for now
    req.databaseService = {
        createPurchase: async (data) => data,
        getPurchase: async (id) => null,
        getSalesStats: async () => ({ batches_sold: 1000 }),
        updateSalesStats: async () => {}
    };
    
    enhancedRgbPaymentController.createInvoice(req, res);
});

app.get('/api/rgb/invoice/:invoiceId/status', (req, res) => {
    req.databaseService = {
        getPurchase: async (id) => null,
        updatePurchase: async () => {}
    };
    
    enhancedRgbPaymentController.checkPaymentStatus(req, res);
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

// Error handling
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`LIGHTCAT server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`RGB Mock Mode: ${process.env.RGB_MOCK_MODE}`);
});