#!/usr/bin/env node

/**
 * Simple Visual Test MCP - CSS and mobile responsiveness validation
 * No puppeteer dependency required
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// UI/UX requirements from CLAUDE.md
const UI_REQUIREMENTS = {
    minTouchTarget: 44, // pixels
    maxLoadTime: 2000, // ms
    minContrast: 4.5,
    requiredBreakpoints: [320, 375, 414, 768, 1024]
};

class SimpleVisualTest {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            warnings: [],
            score: 0
        };
    }

    run() {
        console.log('🎨 Simple Visual Test - Starting validation...\n');
        
        // Run tests
        this.checkServers();
        this.testResponsiveCSS();
        this.testTouchTargets();
        this.testMobileOptimization();
        this.testGameFiles();
        this.checkColorUsage();
        
        // Calculate score
        this.calculateScore();
        
        // Display results
        this.displayResults();
    }

    checkServers() {
        console.log('🌐 Checking servers...');
        try {
            execSync('curl -s http://localhost:8082/ | grep -q "RGBLightCat"', { stdio: 'ignore' });
            this.log('pass', 'UI server is running on port 8082');
        } catch {
            this.log('warn', 'UI server may not be running - start with: npm run dev');
        }
    }

    testResponsiveCSS() {
        console.log('\n📱 Testing Responsive CSS...');
        
        const cssFiles = [
            'client/css/mobile-ultimate-responsive.css',
            'client/css/mobile-optimized.css',
            'client/css/mobile-complete-fix.css',
            'client/css/responsive-breakpoints-complete.css',
            'client/css/style.css'
        ];
        
        let totalClampCount = 0;
        let totalVwCount = 0;
        let hasAllBreakpoints = false;
        
        for (const file of cssFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Check for clamp() usage
                const clampCount = (content.match(/clamp\(/g) || []).length;
                totalClampCount += clampCount;
                
                // Check for viewport units
                const vwCount = (content.match(/\d+vw/g) || []).length;
                totalVwCount += vwCount;
                
                // Check breakpoints
                const mediaQueries = content.match(/@media[^{]+/g) || [];
                const foundBreakpoints = UI_REQUIREMENTS.requiredBreakpoints.filter(bp => 
                    mediaQueries.some(mq => mq.includes(bp + 'px'))
                );
                
                if (foundBreakpoints.length === UI_REQUIREMENTS.requiredBreakpoints.length) {
                    hasAllBreakpoints = true;
                }
                
                console.log(`   ✓ ${file}: ${clampCount} clamp(), ${vwCount} vw units`);
            }
        }
        
        if (totalClampCount > 20) {
            this.log('pass', `Dynamic scaling with clamp() (${totalClampCount} total uses)`);
        } else {
            this.log('warn', `Limited clamp() usage (${totalClampCount} instances) - may need more dynamic scaling`);
        }
        
        if (totalVwCount > 10) {
            this.log('pass', `Viewport-based sizing (${totalVwCount} total uses)`);
        }
        
        if (hasAllBreakpoints) {
            this.log('pass', 'All required responsive breakpoints found');
        } else {
            this.log('fail', 'Missing some responsive breakpoints');
        }
    }

    testTouchTargets() {
        console.log('\n👆 Testing Touch Targets...');
        
        const cssFiles = this.getCSSFiles();
        let hasTouchTargets = false;
        let touchTargetCount = 0;
        
        for (const cssFile of cssFiles) {
            const content = fs.readFileSync(cssFile, 'utf8');
            
            // Check various ways touch targets might be defined
            const patterns = [
                /min-height:\s*44px/g,
                /min-height:\s*var\(--btn-height\)/g,
                /height:\s*clamp\([^,]+,\s*[^,]+,\s*[4-9]\d+px\)/g
            ];
            
            for (const pattern of patterns) {
                const matches = content.match(pattern) || [];
                touchTargetCount += matches.length;
                if (matches.length > 0) hasTouchTargets = true;
            }
        }
        
        if (hasTouchTargets) {
            this.log('pass', `Touch targets configured (${touchTargetCount} definitions found)`);
        } else {
            this.log('fail', 'Touch targets may be too small - ensure 44px minimum');
        }
    }

    testMobileOptimization() {
        console.log('\n📱 Testing Mobile Optimization...');
        
        const indexPath = path.join(process.cwd(), 'client/index.html');
        if (fs.existsSync(indexPath)) {
            const content = fs.readFileSync(indexPath, 'utf8');
            
            // Check viewport meta
            if (content.includes('viewport') && content.includes('width=device-width')) {
                this.log('pass', 'Viewport meta tag configured');
            } else {
                this.log('fail', 'Missing proper viewport meta tag');
            }
            
            // Check mobile game handling
            if (content.includes('isMobile') && content.includes('gameFrame')) {
                this.log('pass', 'Mobile game detection implemented');
            }
            
            // Check for mobile CSS includes
            const mobileCSSCount = (content.match(/mobile.*\.css/g) || []).length;
            if (mobileCSSCount > 0) {
                this.log('pass', `${mobileCSSCount} mobile CSS files included`);
            }
        }
        
        // Check CSS optimizations
        const cssFiles = this.getCSSFiles();
        for (const cssFile of cssFiles) {
            const content = fs.readFileSync(cssFile, 'utf8');
            
            if (content.includes('-webkit-text-size-adjust')) {
                this.log('pass', 'iOS text size adjustment handled');
                break;
            }
        }
    }

    testGameFiles() {
        console.log('\n🎮 Testing Game Integration...');
        
        const gameFiles = [
            'client/game.html',
            'client/js/game/ProGame.js',
            'client/js/game/main.js'
        ];
        
        let allFilesExist = true;
        for (const file of gameFiles) {
            const filePath = path.join(process.cwd(), file);
            if (!fs.existsSync(filePath)) {
                this.log('fail', `Game file missing: ${file}`);
                allFilesExist = false;
            }
        }
        
        if (allFilesExist) {
            this.log('pass', 'All game files present');
            
            // Check tier configuration
            const mainJs = path.join(process.cwd(), 'client/js/game/main.js');
            const content = fs.readFileSync(mainJs, 'utf8');
            if (content.includes('score >= 28') && content.includes('gold')) {
                this.log('pass', 'Game tier thresholds correctly configured');
            }
        }
    }

    checkColorUsage() {
        console.log('\n🎨 Testing Color Usage...');
        
        const cssFiles = this.getCSSFiles();
        let hasWhiteTitle = false;
        let hasYellowHover = false;
        
        for (const cssFile of cssFiles) {
            const content = fs.readFileSync(cssFile, 'utf8');
            
            // Check for white section titles
            if (content.includes('.section-title') && 
                (content.includes('color: white') || content.includes('color: #fff'))) {
                hasWhiteTitle = true;
            }
            
            // Check for yellow on hover/active
            if (content.includes(':hover') && content.includes('#FFD700')) {
                hasYellowHover = true;
            }
        }
        
        if (hasWhiteTitle) {
            this.log('pass', 'Section titles use white color');
        } else {
            this.log('warn', 'Section titles may not be white by default');
        }
        
        if (hasYellowHover) {
            this.log('pass', 'Interactive elements have yellow hover states');
        }
    }

    getCSSFiles() {
        const cssDir = path.join(process.cwd(), 'client/css');
        if (!fs.existsSync(cssDir)) return [];
        
        return fs.readdirSync(cssDir)
            .filter(file => file.endsWith('.css'))
            .map(file => path.join(cssDir, file));
    }

    calculateScore() {
        const total = this.results.passed.length + this.results.failed.length;
        if (total === 0) {
            this.results.score = 0;
            return;
        }
        
        this.results.score = Math.round((this.results.passed.length / total) * 10);
    }

    log(type, message) {
        const prefix = {
            pass: '✅',
            fail: '❌',
            warn: '⚠️ '
        };
        
        console.log(`${prefix[type] || ''} ${message}`);
        
        if (type === 'pass') {
            this.results.passed.push(message);
        } else if (type === 'fail') {
            this.results.failed.push(message);
        } else if (type === 'warn') {
            this.results.warnings.push(message);
        }
    }

    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 VISUAL TEST RESULTS');
        console.log('='.repeat(60));
        
        console.log(`\n✅ Passed: ${this.results.passed.length}`);
        console.log(`❌ Failed: ${this.results.failed.length}`);
        console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
        console.log(`\n🏆 UI/UX Score: ${this.results.score}/10`);
        
        if (this.results.failed.length > 0) {
            console.log('\n❌ Issues to fix:');
            this.results.failed.forEach(test => console.log(`   - ${test}`));
        }
        
        if (this.results.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.results.warnings.forEach(warning => console.log(`   - ${warning}`));
        }
        
        // Quick fixes
        if (this.results.score < 10) {
            console.log('\n💡 Quick fixes:');
            if (this.results.failed.some(f => f.includes('touch'))) {
                console.log('   - Add min-height: 44px to all interactive elements');
            }
            if (this.results.failed.some(f => f.includes('breakpoint'))) {
                console.log('   - Add @media queries for 320px, 375px, 414px, 768px, 1024px');
            }
            if (this.results.failed.some(f => f.includes('viewport'))) {
                console.log('   - Add <meta name="viewport" content="width=device-width, initial-scale=1">');
            }
        } else {
            console.log('\n🎉 Excellent! Mobile UI is fully optimized!');
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Exit with appropriate code
        process.exit(this.results.failed.length > 0 ? 1 : 0);
    }
}

// Run the test
const tester = new SimpleVisualTest();
tester.run();