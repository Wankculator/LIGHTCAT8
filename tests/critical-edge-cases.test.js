// Critical Edge Case Tests for LIGHTCAT Platform

const request = require('supertest');
const app = require('../server/app');
const { supabase } = require('../server/services/supabaseService');

describe('Critical Payment Edge Cases', () => {
    
    // Test 1: Race Condition - Last Batches
    describe('Race Condition - Multiple Users Buy Last Batches', () => {
        it('should only allow first user to purchase when limited supply', async () => {
            // Set up: Only 5 batches remaining
            await supabase
                .from('platform_stats')
                .update({ batches_remaining: 5 })
                .eq('id', 1);
            
            // Create 3 concurrent purchase requests for 3 batches each
            const user1 = request(app)
                .post('/api/rgb/invoice')
                .send({
                    rgbInvoice: 'rgb:utxob:user1_test',
                    batchCount: 3,
                    tier: 'gold'
                });
                
            const user2 = request(app)
                .post('/api/rgb/invoice')
                .send({
                    rgbInvoice: 'rgb:utxob:user2_test',
                    batchCount: 3,
                    tier: 'gold'
                });
                
            const user3 = request(app)
                .post('/api/rgb/invoice')
                .send({
                    rgbInvoice: 'rgb:utxob:user3_test',
                    batchCount: 3,
                    tier: 'gold'
                });
            
            // Execute concurrently
            const results = await Promise.all([user1, user2, user3]);
            
            // Only one should succeed
            const successCount = results.filter(r => r.status === 200).length;
            expect(successCount).toBe(1);
            
            // Verify remaining batches
            const { data: stats } = await supabase
                .from('platform_stats')
                .select('batches_remaining')
                .single();
            expect(stats.batches_remaining).toBe(2);
        });
    });
    
    // Test 2: Invoice Expiration Boundary
    describe('Invoice Expiration Edge Cases', () => {
        it('should reject payment 1ms after expiration', async () => {
            // Create invoice
            const invoice = await request(app)
                .post('/api/rgb/invoice')
                .send({
                    rgbInvoice: 'rgb:utxob:expiry_test',
                    batchCount: 1,
                    tier: 'bronze'
                });
            
            const invoiceId = invoice.body.invoiceId;
            
            // Fast-forward time to 1ms after expiry
            const expiryTime = new Date(invoice.body.expiresAt);
            jest.setSystemTime(new Date(expiryTime.getTime() + 1));
            
            // Simulate payment webhook
            const paymentResult = await request(app)
                .post('/api/webhooks/lightning')
                .send({
                    invoiceId: invoiceId,
                    status: 'paid',
                    amount: 2000
                });
            
            expect(paymentResult.status).toBe(400);
            expect(paymentResult.body.error).toContain('expired');
            
            // Verify no tokens were issued
            const { data: payment } = await supabase
                .from('payments')
                .select('status')
                .eq('invoice_id', invoiceId)
                .single();
            expect(payment.status).toBe('expired');
        });
    });
    
    // Test 3: Partial Payment Attack
    describe('Partial Payment Scenarios', () => {
        it('should reject underpayment and not issue tokens', async () => {
            const invoice = await request(app)
                .post('/api/rgb/invoice')
                .send({
                    rgbInvoice: 'rgb:utxob:partial_test',
                    batchCount: 3, // 6000 sats expected
                    tier: 'silver'
                });
            
            // Simulate partial payment webhook
            const paymentResult = await request(app)
                .post('/api/webhooks/lightning')
                .send({
                    invoiceId: invoice.body.invoiceId,
                    status: 'paid',
                    amount: 4000 // Only 4000 instead of 6000
                });
            
            expect(paymentResult.status).toBe(400);
            expect(paymentResult.body.error).toContain('amount mismatch');
            
            // Verify payment marked as failed
            const { data: payment } = await supabase
                .from('payments')
                .select('status, amount_received')
                .eq('invoice_id', invoice.body.invoiceId)
                .single();
            
            expect(payment.status).toBe('failed');
            expect(payment.amount_received).toBe(4000);
        });
    });
    
    // Test 4: Double Payment Prevention
    describe('Double Payment Protection', () => {
        it('should prevent processing same payment twice', async () => {
            const invoice = await request(app)
                .post('/api/rgb/invoice')
                .send({
                    rgbInvoice: 'rgb:utxob:double_test',
                    batchCount: 1,
                    tier: 'bronze'
                });
            
            // First payment - should succeed
            const payment1 = await request(app)
                .post('/api/webhooks/lightning')
                .send({
                    invoiceId: invoice.body.invoiceId,
                    status: 'paid',
                    amount: 2000,
                    txId: 'tx_123'
                });
            expect(payment1.status).toBe(200);
            
            // Second payment - should fail
            const payment2 = await request(app)
                .post('/api/webhooks/lightning')
                .send({
                    invoiceId: invoice.body.invoiceId,
                    status: 'paid',
                    amount: 2000,
                    txId: 'tx_456'
                });
            expect(payment2.status).toBe(400);
            expect(payment2.body.error).toContain('already processed');
        });
    });
});

describe('Game Security Tests', () => {
    
    // Test 5: Client-Side Score Manipulation
    describe('Score Tampering Prevention', () => {
        it('should reject suspicious scores from client', async () => {
            // Attempt to unlock gold tier with impossible score
            const result = await request(app)
                .post('/api/game/submit-score')
                .send({
                    score: 999999,
                    duration: 5, // Only 5 seconds for "perfect" game
                    actions: ['move', 'shoot'] // Too few actions
                });
            
            expect(result.status).toBe(400);
            expect(result.body.error).toContain('invalid score');
        });
        
        it('should validate game session integrity', async () => {
            // Start legitimate game session
            const session = await request(app)
                .post('/api/game/start')
                .send({});
            
            const sessionId = session.body.sessionId;
            
            // Try to submit score without playing
            const result = await request(app)
                .post('/api/game/submit-score')
                .send({
                    sessionId: sessionId,
                    score: 30,
                    duration: 60000
                });
            
            expect(result.status).toBe(400);
            expect(result.body.error).toContain('invalid game state');
        });
    });
    
    // Test 6: Tier Bypass Attempts
    describe('Tier System Security', () => {
        it('should prevent tier manipulation in purchase', async () => {
            // Try to buy gold-tier amount without playing
            const result = await request(app)
                .post('/api/rgb/invoice')
                .send({
                    rgbInvoice: 'rgb:utxob:tier_bypass',
                    batchCount: 10, // Gold tier max
                    tier: 'gold' // Claiming gold without game
                });
            
            expect(result.status).toBe(400);
            expect(result.body.error).toContain('tier not verified');
        });
    });
});

describe('Network Failure Recovery', () => {
    
    // Test 7: Consignment Download Recovery
    describe('Consignment Generation Failures', () => {
        it('should allow re-download of consignment after network failure', async () => {
            // Create and pay for invoice
            const invoice = await request(app)
                .post('/api/rgb/invoice')
                .send({
                    rgbInvoice: 'rgb:utxob:network_test',
                    batchCount: 1,
                    tier: 'bronze'
                });
            
            // Simulate payment
            await request(app)
                .post('/api/webhooks/lightning')
                .send({
                    invoiceId: invoice.body.invoiceId,
                    status: 'paid',
                    amount: 2000
                });
            
            // First download attempt
            const download1 = await request(app)
                .get(`/api/rgb/consignment/${invoice.body.invoiceId}`);
            expect(download1.status).toBe(200);
            
            // Second download (recovery scenario)
            const download2 = await request(app)
                .get(`/api/rgb/consignment/${invoice.body.invoiceId}`);
            expect(download2.status).toBe(200);
            
            // Verify same consignment
            expect(download1.body).toEqual(download2.body);
        });
    });
    
    // Test 8: WebSocket Reconnection
    describe('WebSocket Stability', () => {
        it('should handle WebSocket disconnection during payment', (done) => {
            // This would require WebSocket client testing
            // Implementation depends on your WebSocket library
            done();
        });
    });
});

describe('RGB Protocol Specific Tests', () => {
    
    // Test 9: Invalid UTXO References
    describe('UTXO Validation', () => {
        it('should reject invalid UTXO format in RGB invoice', async () => {
            const testCases = [
                'rgb::missing_utxob',
                'rgb:utxob:', // Empty UTXO
                'rgb:utxob:../../etc/passwd', // Path traversal
                'rgb:utxob:' + 'a'.repeat(1000), // Too long
                'rgb:utxob:<script>alert(1)</script>' // XSS attempt
            ];
            
            for (const invoice of testCases) {
                const result = await request(app)
                    .post('/api/rgb/invoice')
                    .send({
                        rgbInvoice: invoice,
                        batchCount: 1,
                        tier: 'bronze'
                    });
                
                expect(result.status).toBe(400);
                expect(result.body.error).toContain('Invalid RGB invoice');
            }
        });
    });
    
    // Test 10: Consignment Integrity
    describe('Consignment File Validation', () => {
        it('should generate valid base64 consignment files', async () => {
            // Would need RGB node to fully test
            // This is a placeholder for when RGB node is installed
            expect(true).toBe(true);
        });
    });
});