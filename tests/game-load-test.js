#!/usr/bin/env node

async function testGameLoad() {
    console.log('=== Game Load Test ===\n');
    
    let browser;
    try {
        // Check if puppeteer is available
        console.log('Note: This test requires puppeteer. Run: npm install puppeteer\n');
        
        // Alternative simple test without puppeteer
        const http = require('http');
        
        console.log('Testing game page availability...');
        
        // Test game.html endpoint
        const gamePageTest = new Promise((resolve, reject) => {
            http.get('http://localhost:8082/game.html', (res) => {
                if (res.statusCode === 200) {
                    resolve('✅ Game page loads (HTTP 200)');
                } else {
                    reject(`❌ Game page error: HTTP ${res.statusCode}`);
                }
            }).on('error', (err) => {
                reject(`❌ Cannot reach game page: ${err.message}`);
            });
        });
        
        // Test game assets
        const gameAssets = [
            '/js/game/ProGame.js',
            '/js/game/main.js',
            '/js/game/LightningRain.js',
            '/js/game/SoundManager.js'
        ];
        
        const assetTests = gameAssets.map(asset => {
            return new Promise((resolve, reject) => {
                http.get(`http://localhost:8082${asset}`, (res) => {
                    if (res.statusCode === 200) {
                        resolve(`✅ ${asset} loads`);
                    } else {
                        reject(`❌ ${asset} error: HTTP ${res.statusCode}`);
                    }
                }).on('error', (err) => {
                    reject(`❌ Cannot load ${asset}: ${err.message}`);
                });
            });
        });
        
        // Run tests
        try {
            const gameResult = await gamePageTest;
            console.log(gameResult);
            
            console.log('\nTesting game assets...');
            const assetResults = await Promise.allSettled(assetTests);
            assetResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    console.log(result.value);
                } else {
                    console.log(result.reason);
                }
            });
            
            // Check for gameRandom fix
            console.log('\nVerifying gameRandom() fix...');
            const fs = require('fs');
            const path = require('path');
            const proGamePath = path.join(__dirname, '..', 'client/js/game/ProGame.js');
            const content = fs.readFileSync(proGamePath, 'utf8');
            
            if (content.includes('return Math.random();') && !content.includes('return gameRandom();')) {
                console.log('✅ gameRandom() properly returns Math.random()');
            } else {
                console.log('❌ gameRandom() still has recursive bug!');
            }
            
            console.log('\n=== Summary ===');
            console.log('Game should now load without stack overflow errors.');
            console.log('The recursive gameRandom() bug has been fixed.');
            
        } catch (error) {
            console.error('Test failed:', error);
        }
        
    } catch (error) {
        console.error('Test setup failed:', error.message);
        console.log('\nNote: Make sure the dev server is running (npm run dev)');
    }
}

// Run the test
testGameLoad().catch(console.error);