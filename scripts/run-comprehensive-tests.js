#!/usr/bin/env node

/**
 * Comprehensive Test Runner for LIGHTCAT
 * Runs all test suites with coverage reporting
 */

const { spawn } = require('child_process');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveTestRunner {
    constructor() {
        this.results = {
            unit: { passed: 0, failed: 0, duration: 0 },
            integration: { passed: 0, failed: 0, duration: 0 },
            e2e: { passed: 0, failed: 0, duration: 0 },
            security: { passed: 0, failed: 0, duration: 0 },
            performance: { passed: 0, failed: 0, duration: 0 },
            coverage: { lines: 0, branches: 0, functions: 0, statements: 0 }
        };
    }
    
    async run() {
        console.log(chalk.blue.bold('\n🧪 LIGHTCAT Comprehensive Test Suite\n'));
        
        try {
            // Ensure test environment
            await this.setupTestEnvironment();
            
            // Run tests in sequence
            await this.runTestSuite('Unit Tests', 'npm test -- tests/unit');
            await this.runTestSuite('Integration Tests', 'npm test -- tests/integration');
            await this.runTestSuite('Security Tests', 'npm test -- tests/security');
            await this.runTestSuite('Performance Tests', 'npm test -- tests/performance');
            
            // Run E2E tests separately (requires server)
            await this.runE2ETests();
            
            // Generate coverage report
            await this.generateCoverageReport();
            
            // Display results
            this.displayResults();
            
        } catch (error) {
            console.error(chalk.red(`\n❌ Test suite failed: ${error.message}`));
            process.exit(1);
        }
    }
    
    async setupTestEnvironment() {
        console.log(chalk.yellow('📋 Setting up test environment...'));
        
        // Create test environment file
        const testEnv = `
NODE_ENV=test
PORT=3001
BTCPAY_URL=https://btcpay.test.com
BTCPAY_API_KEY=test-api-key
BTCPAY_STORE_ID=test-store-id
BTCPAY_WEBHOOK_SECRET=test-webhook-secret
RGB_ASSET_ID=rgb:uQsgEYWo-T6mnwCS-N6mH90J-w6fAeQJ-p53B8gi-UKIY7Po
SUPABASE_URL=https://test.supabase.co
SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_KEY=test-service-key
JWT_SECRET=test-jwt-secret
`.trim();
        
        await fs.writeFile('.env.test', testEnv);
        
        // Ensure coverage directory exists
        await fs.mkdir('coverage', { recursive: true });
        
        console.log(chalk.green('✅ Test environment ready\n'));
    }
    
    async runTestSuite(name, command) {
        console.log(chalk.blue(`\n📦 Running ${name}...`));
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const [cmd, ...args] = command.split(' ');
            const child = spawn(cmd, args, {
                env: { ...process.env, NODE_ENV: 'test' },
                stdio: 'pipe'
            });
            
            let output = '';
            let errorOutput = '';
            
            child.stdout.on('data', (data) => {
                output += data.toString();
                process.stdout.write(data);
            });
            
            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
                process.stderr.write(data);
            });
            
            child.on('close', (code) => {
                const duration = Date.now() - startTime;
                const suiteName = name.toLowerCase().replace(' tests', '');
                
                // Parse test results
                const passMatch = output.match(/(\d+) passing/);
                const failMatch = output.match(/(\d+) failing/);
                
                if (passMatch) {
                    this.results[suiteName].passed = parseInt(passMatch[1]);
                }
                if (failMatch) {
                    this.results[suiteName].failed = parseInt(failMatch[1]);
                }
                
                this.results[suiteName].duration = duration;
                
                if (code === 0) {
                    console.log(chalk.green(`✅ ${name} completed in ${(duration / 1000).toFixed(2)}s`));
                    resolve();
                } else {
                    console.log(chalk.red(`❌ ${name} failed`));
                    resolve(); // Continue with other tests
                }
            });
        });
    }
    
    async runE2ETests() {
        console.log(chalk.blue('\n🌐 Running E2E Tests...'));
        console.log(chalk.yellow('Starting test server...'));
        
        // Start server
        const server = spawn('npm', ['start'], {
            env: { ...process.env, NODE_ENV: 'test', PORT: '3002' },
            stdio: 'pipe'
        });
        
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        try {
            // Run E2E tests
            await this.runTestSuite('E2E Tests', 'npm test -- tests/e2e');
        } finally {
            // Stop server
            server.kill();
        }
    }
    
    async generateCoverageReport() {
        console.log(chalk.blue('\n📊 Generating coverage report...'));
        
        return new Promise((resolve) => {
            const child = spawn('npm', ['run', 'test:coverage'], {
                stdio: 'pipe'
            });
            
            let output = '';
            
            child.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            child.on('close', () => {
                // Parse coverage results
                const coverageMatch = output.match(/Lines\s+:\s+([\d.]+)%.*Branches\s+:\s+([\d.]+)%.*Functions\s+:\s+([\d.]+)%.*Statements\s+:\s+([\d.]+)%/s);
                
                if (coverageMatch) {
                    this.results.coverage = {
                        lines: parseFloat(coverageMatch[1]),
                        branches: parseFloat(coverageMatch[2]),
                        functions: parseFloat(coverageMatch[3]),
                        statements: parseFloat(coverageMatch[4])
                    };
                }
                
                console.log(chalk.green('✅ Coverage report generated'));
                resolve();
            });
        });
    }
    
    displayResults() {
        console.log(chalk.blue.bold('\n📈 Test Results Summary\n'));
        
        // Test results table
        console.log(chalk.white('Test Suite Results:'));
        console.log('┌─────────────────┬─────────┬─────────┬──────────┐');
        console.log('│ Suite           │ Passed  │ Failed  │ Duration │');
        console.log('├─────────────────┼─────────┼─────────┼──────────┤');
        
        let totalPassed = 0;
        let totalFailed = 0;
        let totalDuration = 0;
        
        ['unit', 'integration', 'security', 'performance', 'e2e'].forEach(suite => {
            const result = this.results[suite];
            totalPassed += result.passed;
            totalFailed += result.failed;
            totalDuration += result.duration;
            
            const status = result.failed > 0 ? chalk.red('●') : chalk.green('●');
            console.log(
                `│ ${status} ${suite.padEnd(13)} │ ${String(result.passed).padStart(7)} │ ${String(result.failed).padStart(7)} │ ${(result.duration / 1000).toFixed(2).padStart(7)}s │`
            );
        });
        
        console.log('├─────────────────┼─────────┼─────────┼──────────┤');
        console.log(
            `│ ${chalk.bold('Total')}           │ ${chalk.green(String(totalPassed).padStart(7))} │ ${totalFailed > 0 ? chalk.red(String(totalFailed).padStart(7)) : String(totalFailed).padStart(7)} │ ${(totalDuration / 1000).toFixed(2).padStart(7)}s │`
        );
        console.log('└─────────────────┴─────────┴─────────┴──────────┘');
        
        // Coverage results
        console.log(chalk.white('\nCode Coverage:'));
        console.log('┌──────────────┬────────────┐');
        console.log('│ Metric       │ Percentage │');
        console.log('├──────────────┼────────────┤');
        
        const coverage = this.results.coverage;
        const avgCoverage = (coverage.lines + coverage.branches + coverage.functions + coverage.statements) / 4;
        
        Object.entries(coverage).forEach(([metric, value]) => {
            const color = value >= 80 ? chalk.green : value >= 60 ? chalk.yellow : chalk.red;
            console.log(`│ ${metric.padEnd(12)} │ ${color(value.toFixed(2) + '%').padStart(10)} │`);
        });
        
        console.log('├──────────────┼────────────┤');
        console.log(`│ ${chalk.bold('Average')}      │ ${avgCoverage >= 80 ? chalk.green(avgCoverage.toFixed(2) + '%') : chalk.yellow(avgCoverage.toFixed(2) + '%')}`.padEnd(10) + ' │');
        console.log('└──────────────┴────────────┘');
        
        // Final status
        console.log('\n' + '═'.repeat(50));
        
        if (totalFailed === 0 && avgCoverage >= 80) {
            console.log(chalk.green.bold('\n✨ All tests passed with excellent coverage! ✨'));
            console.log(chalk.green(`\n✅ ${totalPassed} tests passed`));
            console.log(chalk.green(`📊 ${avgCoverage.toFixed(2)}% code coverage`));
            console.log(chalk.green(`⏱️  Total time: ${(totalDuration / 1000).toFixed(2)}s`));
        } else if (totalFailed > 0) {
            console.log(chalk.red.bold('\n❌ Some tests failed!'));
            console.log(chalk.red(`\n${totalFailed} tests failed out of ${totalPassed + totalFailed}`));
        } else if (avgCoverage < 80) {
            console.log(chalk.yellow.bold('\n⚠️  Tests passed but coverage is below 80%'));
            console.log(chalk.yellow(`\nCurrent coverage: ${avgCoverage.toFixed(2)}%`));
            console.log(chalk.yellow('Target coverage: 80%'));
        }
        
        console.log('\n' + '═'.repeat(50));
        
        // Exit code
        process.exit(totalFailed > 0 ? 1 : 0);
    }
}

// Run the test suite
const runner = new ComprehensiveTestRunner();
runner.run().catch(error => {
    console.error(chalk.red(`\nFatal error: ${error.message}`));
    process.exit(1);
});