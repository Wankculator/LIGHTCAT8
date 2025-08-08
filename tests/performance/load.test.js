// Performance and load tests

const request = require('supertest');
const app = require('../../server/app');
const TestUtils = require('../helpers/test-utils');

describe('Performance Tests', () => {
    let server;
    
    beforeAll(() => {
        server = app.listen(0);
    });
    
    afterAll((done) => {
        server.close(done);
    });
    
    describe('Response Time Tests', () => {
        test('stats endpoint should respond within 200ms', async () => {
            const times = [];
            
            // Make 10 requests and measure
            for (let i = 0; i < 10; i++) {
                const start = Date.now();
                await request(server).get('/api/rgb/stats');
                const duration = Date.now() - start;
                times.push(duration);
            }
            
            // Calculate average
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            
            expect(avgTime).toBeLessThan(200);
            
            // Check 95th percentile
            times.sort((a, b) => a - b);
            const p95 = times[Math.floor(times.length * 0.95)];
            expect(p95).toBeLessThan(300);
        });
        
        test('invoice creation should respond within 1 second', async () => {
            const start = Date.now();
            
            await request(server)
                .post('/api/rgb/invoice')
                .send({
                    rgbInvoice: TestUtils.generateRGBInvoice(),
                    batchCount: 1,
                    walletAddress: TestUtils.generateBitcoinAddress()
                });
            
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(1000);
        });
        
        test('payment status check should be fast', async () => {
            const times = [];
            
            // Simulate rapid polling
            for (let i = 0; i < 20; i++) {
                const start = Date.now();
                await request(server).get('/api/rgb/invoice/test-123/status');
                const duration = Date.now() - start;
                times.push(duration);
            }
            
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            expect(avgTime).toBeLessThan(100); // Should be very fast
        });
    });
    
    describe('Concurrent Request Handling', () => {
        test('should handle 50 concurrent stats requests', async () => {
            const promises = [];
            const startTime = Date.now();
            
            // Create 50 concurrent requests
            for (let i = 0; i < 50; i++) {
                promises.push(
                    request(server)
                        .get('/api/rgb/stats')
                        .then(res => ({
                            status: res.status,
                            time: Date.now() - startTime
                        }))
                );
            }
            
            const results = await Promise.all(promises);
            
            // All should succeed
            results.forEach(result => {
                expect(result.status).toBe(200);
            });
            
            // Should complete within reasonable time
            const maxTime = Math.max(...results.map(r => r.time));
            expect(maxTime).toBeLessThan(2000); // 2 seconds for all
        });
        
        test('should handle mixed concurrent requests', async () => {
            const promises = [];
            
            // Mix of different endpoints
            for (let i = 0; i < 10; i++) {
                // Stats requests
                promises.push(request(server).get('/api/rgb/stats'));
                
                // Invoice creation
                promises.push(
                    request(server)
                        .post('/api/rgb/invoice')
                        .send({
                            rgbInvoice: TestUtils.generateRGBInvoice(),
                            batchCount: 1,
                            walletAddress: TestUtils.generateBitcoinAddress()
                        })
                );
                
                // Status checks
                promises.push(
                    request(server).get('/api/rgb/invoice/test-123/status')
                );
            }
            
            const startTime = Date.now();
            const results = await Promise.all(promises);
            const duration = Date.now() - startTime;
            
            // Should handle all within reasonable time
            expect(duration).toBeLessThan(3000);
            
            // Most should succeed (some might hit rate limits)
            const successCount = results.filter(r => r.status === 200).length;
            expect(successCount).toBeGreaterThan(results.length * 0.7);
        });
    });
    
    describe('Memory Usage', () => {
        test('should not leak memory on repeated requests', async () => {
            if (global.gc) {
                global.gc(); // Force garbage collection if available
            }
            
            const initialMemory = process.memoryUsage();
            
            // Make 100 requests
            for (let i = 0; i < 100; i++) {
                await request(server)
                    .get('/api/rgb/stats');
            }
            
            if (global.gc) {
                global.gc(); // Force garbage collection
            }
            
            const finalMemory = process.memoryUsage();
            
            // Memory increase should be minimal
            const heapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            const mbIncrease = heapIncrease / 1024 / 1024;
            
            expect(mbIncrease).toBeLessThan(50); // Less than 50MB increase
        });
    });
    
    describe('Database Connection Pool', () => {
        test('should handle database connection efficiently', async () => {
            const promises = [];
            
            // Simulate burst of database-heavy requests
            for (let i = 0; i < 20; i++) {
                promises.push(
                    request(server).get('/api/rgb/stats')
                );
            }
            
            const results = await Promise.all(promises);
            
            // All should succeed without connection errors
            results.forEach(result => {
                expect(result.status).toBe(200);
                expect(result.body.error).toBeUndefined();
            });
        });
    });
    
    describe('Caching Performance', () => {
        test('should cache static responses', async () => {
            // First request - uncached
            const start1 = Date.now();
            const response1 = await request(server).get('/api/rgb/stats');
            const time1 = Date.now() - start1;
            
            // Second request - should be cached
            const start2 = Date.now();
            const response2 = await request(server).get('/api/rgb/stats');
            const time2 = Date.now() - start2;
            
            // Cached request should be faster
            expect(time2).toBeLessThan(time1 * 0.5);
            
            // Data should be the same
            expect(response2.body).toEqual(response1.body);
        });
    });
    
    describe('Payload Size Optimization', () => {
        test('should compress API responses', async () => {
            const response = await request(server)
                .get('/api/rgb/stats')
                .set('Accept-Encoding', 'gzip');
            
            // Should have compression header
            expect(response.headers['content-encoding']).toBe('gzip');
        });
        
        test('should have reasonable response sizes', async () => {
            const endpoints = [
                { path: '/api/rgb/stats', maxSize: 1024 },      // 1KB
                { path: '/api/rgb/invoice/test/status', maxSize: 512 } // 512B
            ];
            
            for (const endpoint of endpoints) {
                const response = await request(server).get(endpoint.path);
                const size = JSON.stringify(response.body).length;
                
                expect(size).toBeLessThan(endpoint.maxSize);
            }
        });
    });
    
    describe('Resource Limits', () => {
        test('should limit request rate appropriately', async () => {
            const results = [];
            
            // Make requests rapidly
            for (let i = 0; i < 15; i++) {
                const response = await request(server)
                    .post('/api/rgb/invoice')
                    .send({
                        rgbInvoice: TestUtils.generateRGBInvoice(),
                        batchCount: 1,
                        walletAddress: TestUtils.generateBitcoinAddress()
                    });
                
                results.push({
                    status: response.status,
                    index: i
                });
            }
            
            // Should start getting rate limited
            const rateLimited = results.filter(r => r.status === 429);
            expect(rateLimited.length).toBeGreaterThan(0);
            
            // Rate limiting should kick in after limit
            const firstRateLimited = rateLimited[0];
            expect(firstRateLimited.index).toBeGreaterThanOrEqual(9); // After 10 requests
        });
    });
    
    describe('Stress Test Scenarios', () => {
        test('should handle rapid payment status polling', async () => {
            const invoiceId = 'stress-test-123';
            const pollPromises = [];
            
            // Simulate 3 users polling every 3 seconds for 9 seconds
            for (let user = 0; user < 3; user++) {
                for (let poll = 0; poll < 3; poll++) {
                    pollPromises.push(
                        new Promise(resolve => {
                            setTimeout(async () => {
                                const response = await request(server)
                                    .get(`/api/rgb/invoice/${invoiceId}/status`);
                                resolve(response.status);
                            }, poll * 3000);
                        })
                    );
                }
            }
            
            const results = await Promise.all(pollPromises);
            
            // All polls should succeed
            results.forEach(status => {
                expect([200, 404]).toContain(status);
            });
        });
        
        test('should handle game completion surge', async () => {
            // Simulate 20 players completing game simultaneously
            const promises = [];
            
            for (let i = 0; i < 20; i++) {
                promises.push(
                    request(server)
                        .post('/api/game/score')
                        .send({
                            score: Math.floor(Math.random() * 30) + 10,
                            time: 30000,
                            tier: ['bronze', 'silver', 'gold'][Math.floor(Math.random() * 3)]
                        })
                );
            }
            
            const startTime = Date.now();
            const results = await Promise.all(promises);
            const duration = Date.now() - startTime;
            
            // Should handle surge within 2 seconds
            expect(duration).toBeLessThan(2000);
            
            // Most should succeed
            const successCount = results.filter(r => [200, 201].includes(r.status)).length;
            expect(successCount).toBeGreaterThan(15);
        });
    });
});