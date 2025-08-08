#!/usr/bin/env node

/**
 * Real-time Security Monitoring Dashboard
 * Monitors for suspicious activities and security threats
 */

const chalk = require('chalk');
const Table = require('cli-table3');
const blessed = require('blessed');

// Security event types
const SecurityEvents = {
    FAILED_AUTH: 'failed_auth',
    RATE_LIMIT: 'rate_limit_exceeded',
    INVALID_SIGNATURE: 'invalid_signature',
    PAYMENT_MISMATCH: 'payment_amount_mismatch',
    SUSPICIOUS_PATTERN: 'suspicious_pattern',
    SQL_INJECTION: 'sql_injection_attempt',
    XSS_ATTEMPT: 'xss_attempt',
    BRUTE_FORCE: 'brute_force_attempt',
    INVALID_INPUT: 'invalid_input',
    EXPIRED_TOKEN: 'expired_token'
};

// Create blessed screen
const screen = blessed.screen({
    smartCSR: true,
    title: 'LITECAT Security Monitor'
});

// Create layout boxes
const header = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: ' 🔒 LITECAT Security Monitoring Dashboard',
    style: {
        fg: 'white',
        bg: 'blue',
        bold: true
    }
});

const threatLevel = blessed.box({
    parent: screen,
    top: 3,
    left: 0,
    width: '30%',
    height: 10,
    label: ' Threat Level ',
    border: {
        type: 'line'
    },
    style: {
        border: {
            fg: 'cyan'
        }
    }
});

const activeThreats = blessed.list({
    parent: screen,
    top: 3,
    left: '30%',
    width: '70%',
    height: 10,
    label: ' Active Threats ',
    border: {
        type: 'line'
    },
    style: {
        border: {
            fg: 'red'
        },
        selected: {
            bg: 'red'
        }
    },
    mouse: true,
    keys: true,
    vi: true
});

const eventLog = blessed.log({
    parent: screen,
    top: 13,
    left: 0,
    width: '60%',
    height: '50%',
    label: ' Security Events ',
    border: {
        type: 'line'
    },
    style: {
        border: {
            fg: 'yellow'
        }
    },
    scrollable: true,
    alwaysScroll: true,
    mouse: true
});

const statistics = blessed.box({
    parent: screen,
    top: 13,
    left: '60%',
    width: '40%',
    height: '50%',
    label: ' Statistics ',
    border: {
        type: 'line'
    },
    style: {
        border: {
            fg: 'green'
        }
    }
});

// Security Monitor Class
class SecurityMonitor {
    constructor() {
        this.threats = new Map();
        this.stats = {
            totalEvents: 0,
            blockedRequests: 0,
            suspiciousIPs: new Set(),
            failedAuths: 0,
            paymentIssues: 0
        };
        this.threatScore = 0;
    }

    start() {
        // Simulate monitoring (in production, connect to real logs)
        this.simulateEvents();
        
        // Update display
        setInterval(() => this.updateDisplay(), 1000);
        
        // Handle exit
        screen.key(['escape', 'q', 'C-c'], () => {
            return process.exit(0);
        });
        
        screen.render();
    }

    logEvent(type, details) {
        const timestamp = new Date().toISOString();
        const event = {
            timestamp,
            type,
            details,
            severity: this.getEventSeverity(type)
        };

        // Update stats
        this.stats.totalEvents++;
        this.updateStats(event);

        // Log to event display
        const color = this.getSeverityColor(event.severity);
        eventLog.log(color(`[${timestamp.split('T')[1].split('.')[0]}] ${type}: ${JSON.stringify(details)}`));

        // Check for threats
        this.analyzeEvent(event);
    }

    analyzeEvent(event) {
        // Detect patterns that indicate threats
        const { type, details } = event;

        // Track IPs
        if (details.ip) {
            const ipEvents = this.threats.get(details.ip) || [];
            ipEvents.push(event);
            this.threats.set(details.ip, ipEvents);

            // Check for suspicious patterns
            if (ipEvents.length > 10 && ipEvents.filter(e => e.type === SecurityEvents.FAILED_AUTH).length > 5) {
                this.addThreat({
                    type: 'BRUTE_FORCE',
                    ip: details.ip,
                    severity: 'HIGH',
                    description: `Brute force attempt from ${details.ip}`
                });
            }
        }

        // Payment fraud detection
        if (type === SecurityEvents.PAYMENT_MISMATCH) {
            this.addThreat({
                type: 'PAYMENT_FRAUD',
                severity: 'CRITICAL',
                description: `Payment mismatch: Expected ${details.expected}, got ${details.actual}`
            });
        }
    }

    addThreat(threat) {
        const threats = activeThreats.getItems();
        const threatStr = chalk.red(`[${threat.severity}] ${threat.description}`);
        
        if (!threats.includes(threatStr)) {
            activeThreats.addItem(threatStr);
            this.threatScore += threat.severity === 'CRITICAL' ? 50 : 
                               threat.severity === 'HIGH' ? 30 : 10;
        }
    }

    updateStats(event) {
        switch (event.type) {
            case SecurityEvents.FAILED_AUTH:
                this.stats.failedAuths++;
                break;
            case SecurityEvents.PAYMENT_MISMATCH:
                this.stats.paymentIssues++;
                break;
            case SecurityEvents.RATE_LIMIT:
                this.stats.blockedRequests++;
                if (event.details.ip) {
                    this.stats.suspiciousIPs.add(event.details.ip);
                }
                break;
        }
    }

    updateDisplay() {
        // Update threat level
        const level = this.getThreatLevel();
        const levelColor = this.getThreatLevelColor(level);
        threatLevel.setContent(`
  Current Level: ${levelColor(level)}
  
  Score: ${this.threatScore}
  
  ${this.getThreatLevelBar()}
        `);

        // Update statistics
        statistics.setContent(`
  Total Events: ${this.stats.totalEvents}
  Failed Auths: ${this.stats.failedAuths}
  Blocked Requests: ${this.stats.blockedRequests}
  Payment Issues: ${this.stats.paymentIssues}
  Suspicious IPs: ${this.stats.suspiciousIPs.size}
  
  Top Threats:
  ${this.getTopThreats()}
        `);

        screen.render();
    }

    getThreatLevel() {
        if (this.threatScore > 200) return 'CRITICAL';
        if (this.threatScore > 100) return 'HIGH';
        if (this.threatScore > 50) return 'MEDIUM';
        if (this.threatScore > 20) return 'LOW';
        return 'MINIMAL';
    }

    getThreatLevelColor(level) {
        const colors = {
            CRITICAL: chalk.bgRed.white.bold,
            HIGH: chalk.red.bold,
            MEDIUM: chalk.yellow.bold,
            LOW: chalk.blue,
            MINIMAL: chalk.green
        };
        return colors[level] || chalk.white;
    }

    getThreatLevelBar() {
        const maxBar = 20;
        const filled = Math.min(Math.floor(this.threatScore / 10), maxBar);
        const empty = maxBar - filled;
        
        const bar = chalk.red('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
        return `  [${bar}]`;
    }

    getTopThreats() {
        const threatCounts = new Map();
        
        for (const [ip, events] of this.threats) {
            events.forEach(event => {
                const key = event.type;
                threatCounts.set(key, (threatCounts.get(key) || 0) + 1);
            });
        }

        return Array.from(threatCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => `  - ${type}: ${count}`)
            .join('\\n');
    }

    getEventSeverity(type) {
        const severities = {
            [SecurityEvents.SQL_INJECTION]: 'CRITICAL',
            [SecurityEvents.XSS_ATTEMPT]: 'CRITICAL',
            [SecurityEvents.PAYMENT_MISMATCH]: 'CRITICAL',
            [SecurityEvents.BRUTE_FORCE]: 'HIGH',
            [SecurityEvents.INVALID_SIGNATURE]: 'HIGH',
            [SecurityEvents.RATE_LIMIT]: 'MEDIUM',
            [SecurityEvents.FAILED_AUTH]: 'LOW',
            [SecurityEvents.INVALID_INPUT]: 'LOW'
        };
        return severities[type] || 'INFO';
    }

    getSeverityColor(severity) {
        const colors = {
            CRITICAL: chalk.bgRed.white,
            HIGH: chalk.red,
            MEDIUM: chalk.yellow,
            LOW: chalk.blue,
            INFO: chalk.gray
        };
        return colors[severity] || chalk.white;
    }

    // Simulate events for demo
    simulateEvents() {
        const simulateEvent = () => {
            const events = [
                {
                    type: SecurityEvents.FAILED_AUTH,
                    details: { ip: '192.168.1.' + Math.floor(Math.random() * 255), user: 'admin' }
                },
                {
                    type: SecurityEvents.RATE_LIMIT,
                    details: { ip: '10.0.0.' + Math.floor(Math.random() * 255), endpoint: '/api/rgb/invoice' }
                },
                {
                    type: SecurityEvents.INVALID_INPUT,
                    details: { field: 'rgbInvoice', value: '<script>alert("xss")</script>' }
                },
                {
                    type: SecurityEvents.PAYMENT_MISMATCH,
                    details: { expected: 2000, actual: 1500, invoiceId: 'inv_' + Math.random().toString(36).substr(2, 9) }
                },
                {
                    type: SecurityEvents.SUSPICIOUS_PATTERN,
                    details: { pattern: 'rapid_requests', count: 50, timeframe: '60s' }
                }
            ];

            const randomEvent = events[Math.floor(Math.random() * events.length)];
            this.logEvent(randomEvent.type, randomEvent.details);

            // Random interval for next event
            setTimeout(simulateEvent, Math.random() * 5000 + 1000);
        };

        // Start simulation
        setTimeout(simulateEvent, 1000);
    }
}

// ASCII Banner
console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🔒 LITECAT Security Monitoring System 🔒             ║
║                                                           ║
║     Real-time threat detection and analysis              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`));

// Start monitor
const monitor = new SecurityMonitor();
monitor.start();

// Export for use in other modules
module.exports = SecurityMonitor;