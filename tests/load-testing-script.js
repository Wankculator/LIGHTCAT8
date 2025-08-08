#!/usr/bin/env node

/**
 * LIGHTCAT Load Testing Script
 * Tests system performance under various load conditions
 */

const axios = require('axios');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const WS_URL = process.env.WS_URL || 'ws://localhost:3000';

class LoadTester {
    constructor() {
        this.results = {
            requests: [],
            errors: [],
            websockets: [],
            startTime: 0,
            endTime: 0
        };
    }

    // Test 1: Concurrent Invoice Creation
    async testConcurrentInvoiceCreation(numUsers = 100) {
        console.log(`\n🚀 Testing ${numUsers} concurrent invoice creations...`);
        
        const promises = [];
        const startTime = performance.now();
        
        for (let i = 0; i < numUsers; i++) {
            const promise = this.createInvoice(i);
            promises.push(promise);
        }
        
        const results = await Promise.allSettled(promises);
        const endTime = performance.now();
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        const avgTime = (endTime - startTime) / numUsers;
        
        console.log(`✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏱️  Average time per request: ${avgTime.toFixed(2)}ms`);
        console.log(`📊 Requests per second: ${(1000 / avgTime).toFixed(2)}`);
        
        return { successful, failed, avgTime };
    }

    async createInvoice(userId) {
        const startTime = performance.now();
        
        try {
            const response = await axios.post(`${BASE_URL}/api/rgb/invoice`, {
                rgbInvoice: `rgb:utxob:load_test_${userId}_${Date.now()}`,
                batchCount: Math.floor(Math.random() * 3) + 1,
                tier: ['bronze', 'silver', 'gold'][Math.floor(Math.random() * 3)]
            });
            
            const endTime = performance.now();
            this.results.requests.push({
                userId,
                duration: endTime - startTime,
                status: response.status
            });
            
            return response.data;
        } catch (error) {
            this.results.errors.push({
                userId,
                error: error.message,
                status: error.response?.status
            });
            throw error;
        }
    }

    // Test 2: Payment Webhook Bombardment
    async testPaymentWebhookLoad(numPayments = 100) {
        console.log(`\n💰 Testing ${numPayments} payment webhooks...`);
        
        // First create invoices
        const invoices = [];
        for (let i = 0; i < Math.min(numPayments, 10); i++) {
            const invoice = await this.createInvoice(i);
            invoices.push(invoice);
        }
        
        // Then bombard with payment confirmations
        const promises = [];
        const startTime = performance.now();
        
        for (let i = 0; i < numPayments; i++) {
            const invoice = invoices[i % invoices.length];
            const promise = this.simulatePayment(invoice.invoiceId, i);
            promises.push(promise);
        }
        
        const results = await Promise.allSettled(promises);
        const endTime = performance.now();
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const throughput = numPayments / ((endTime - startTime) / 1000);
        
        console.log(`✅ Payments processed: ${successful}`);
        console.log(`📊 Throughput: ${throughput.toFixed(2)} payments/second`);
        
        return { successful, throughput };
    }

    async simulatePayment(invoiceId, index) {
        try {
            const response = await axios.post(`${BASE_URL}/api/webhooks/lightning`, {
                invoiceId,
                status: 'paid',
                amount: 2000,
                txId: `load_test_tx_${index}_${Date.now()}`
            });
            return response.data;
        } catch (error) {
            this.results.errors.push({
                type: 'payment',
                error: error.message
            });
            throw error;
        }
    }

    // Test 3: WebSocket Connection Storm
    async testWebSocketStorm(numConnections = 100) {
        console.log(`\n🌐 Testing ${numConnections} WebSocket connections...`);
        
        const connections = [];
        const startTime = performance.now();
        let connected = 0;
        let failed = 0;
        
        for (let i = 0; i < numConnections; i++) {
            const ws = new WebSocket(WS_URL);
            
            ws.on('open', () => {
                connected++;
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    channel: 'stats'
                }));
            });
            
            ws.on('error', (error) => {
                failed++;
                this.results.errors.push({
                    type: 'websocket',
                    error: error.message
                });
            });
            
            connections.push(ws);
        }
        
        // Wait for connections to establish
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const endTime = performance.now();
        const connectionTime = (endTime - startTime) / numConnections;
        
        console.log(`✅ Connected: ${connected}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏱️  Average connection time: ${connectionTime.toFixed(2)}ms`);
        
        // Send messages through all connections
        const messageStart = performance.now();
        connections.forEach((ws, index) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'test',
                    data: `Message ${index}`
                }));
            }
        });
        const messageEnd = performance.now();
        
        console.log(`📨 Message broadcast time: ${(messageEnd - messageStart).toFixed(2)}ms`);
        
        // Cleanup
        connections.forEach(ws => ws.close());
        
        return { connected, failed, connectionTime };
    }

    // Test 4: Game Session Load
    async testGameSessionLoad(numPlayers = 100) {
        console.log(`\n🎮 Testing ${numPlayers} concurrent game sessions...`);
        
        const sessions = [];
        const startTime = performance.now();
        
        // Start game sessions
        for (let i = 0; i < numPlayers; i++) {
            try {
                const response = await axios.post(`${BASE_URL}/api/game/start`);
                sessions.push(response.data.sessionId);
            } catch (error) {
                this.results.errors.push({
                    type: 'game_start',
                    error: error.message
                });
            }
        }
        
        console.log(`✅ Sessions started: ${sessions.length}`);
        
        // Simulate gameplay
        const gamePromises = sessions.map((sessionId, index) => 
            this.simulateGameplay(sessionId, index)
        );
        
        const results = await Promise.allSettled(gamePromises);
        const endTime = performance.now();
        
        const completed = results.filter(r => r.status === 'fulfilled').length;
        const avgGameTime = (endTime - startTime) / numPlayers;
        
        console.log(`🏁 Games completed: ${completed}`);
        console.log(`⏱️  Average game time: ${avgGameTime.toFixed(2)}ms`);
        
        return { completed, avgGameTime };
    }

    async simulateGameplay(sessionId, playerIndex) {
        // Simulate game actions
        const actions = ['move', 'shoot', 'jump', 'collect'];
        const gameActions = [];
        
        for (let i = 0; i < 50; i++) {
            gameActions.push({
                action: actions[Math.floor(Math.random() * actions.length)],
                timestamp: Date.now()
            });
        }
        
        // Submit score
        const score = Math.floor(Math.random() * 40) + 10;
        try {
            const response = await axios.post(`${BASE_URL}/api/game/submit-score`, {
                sessionId,
                score,
                duration: 60000,
                actions: gameActions
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    // Test 5: Database Connection Pool Stress
    async testDatabaseStress(numQueries = 1000) {
        console.log(`\n🗄️  Testing ${numQueries} database queries...`);
        
        const queries = [];
        const startTime = performance.now();
        
        for (let i = 0; i < numQueries; i++) {
            queries.push(axios.get(`${BASE_URL}/api/rgb/stats`));
        }
        
        const results = await Promise.allSettled(queries);
        const endTime = performance.now();
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const qps = numQueries / ((endTime - startTime) / 1000);
        
        console.log(`✅ Successful queries: ${successful}`);
        console.log(`📊 Queries per second: ${qps.toFixed(2)}`);
        
        return { successful, qps };
    }

    // Main test runner
    async runAllTests() {
        console.log('🧪 LIGHTCAT Load Testing Suite');
        console.log('==============================\n');
        
        this.results.startTime = Date.now();
        
        // Progressive load testing
        const testConfigs = [
            { users: 10, label: 'Light Load' },
            { users: 100, label: 'Medium Load' },
            { users: 500, label: 'Heavy Load' },
            { users: 1000, label: 'Stress Test' }
        ];
        
        for (const config of testConfigs) {
            console.log(`\n📊 Running ${config.label} (${config.users} users)`);
            console.log('='.repeat(50));
            
            await this.testConcurrentInvoiceCreation(config.users);
            await this.testPaymentWebhookLoad(config.users);
            await this.testWebSocketStorm(Math.min(config.users, 100));
            await this.testGameSessionLoad(Math.min(config.users, 50));
            await this.testDatabaseStress(config.users * 2);
            
            // Cool down between tests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        this.results.endTime = Date.now();
        
        // Generate report
        this.generateReport();
    }

    generateReport() {
        console.log('\n\n📊 LOAD TESTING REPORT');
        console.log('=' .repeat(50));
        console.log(`Total Duration: ${((this.results.endTime - this.results.startTime) / 1000).toFixed(2)} seconds`);
        console.log(`Total Requests: ${this.results.requests.length}`);
        console.log(`Total Errors: ${this.results.errors.length}`);
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ Error Summary:');
            const errorTypes = {};
            this.results.errors.forEach(err => {
                errorTypes[err.type || 'unknown'] = (errorTypes[err.type || 'unknown'] || 0) + 1;
            });
            Object.entries(errorTypes).forEach(([type, count]) => {
                console.log(`  - ${type}: ${count}`);
            });
        }
        
        console.log('\n✅ Test Complete!');
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new LoadTester();
    tester.runAllTests().catch(console.error);
}

module.exports = LoadTester;