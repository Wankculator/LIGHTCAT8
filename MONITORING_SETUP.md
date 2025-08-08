# LIGHTCAT Production Monitoring Setup

## Overview
This guide outlines the monitoring strategy for LIGHTCAT token platform to ensure reliability, performance, and security in production.

## Key Metrics to Monitor

### 1. Application Health
- **Uptime**: Target 99.9% availability
- **Response Time**: < 200ms for API, < 2s for page load
- **Error Rate**: < 0.1% of requests
- **Active Users**: Real-time count
- **Game Sessions**: Active and completed

### 2. Payment System
```javascript
// Critical payment metrics
const paymentMetrics = {
  invoiceCreationRate: 'invoices/minute',
  paymentSuccessRate: 'successful_payments/total_payments',
  averagePaymentTime: 'seconds from invoice to confirmation',
  failedPayments: 'count and reasons',
  consignmentGenerationTime: 'average seconds',
  webhookResponseTime: 'ms'
};
```

### 3. Infrastructure
- **CPU Usage**: Alert if > 80%
- **Memory Usage**: Alert if > 85%
- **Disk Space**: Alert if < 20% free
- **Network I/O**: Monitor for anomalies
- **Database Connections**: Pool usage and limits

### 4. Security
- **Failed Login Attempts**: Track and alert on spikes
- **Rate Limit Violations**: Monitor abuse patterns
- **404 Errors**: Detect scanning attempts
- **SQL Query Times**: Detect potential injection attacks
- **Invalid RGB Invoices**: Track malformed requests

## Monitoring Stack Recommendations

### 1. Application Performance Monitoring (APM)
```javascript
// Example: New Relic / DataDog / AppDynamics integration
const apm = require('newrelic');

// Custom transaction tracking
apm.startSegment('rgb-payment-flow', true, () => {
  // Payment logic
  apm.addCustomAttribute('tier', tier);
  apm.addCustomAttribute('batchCount', batchCount);
  apm.addCustomAttribute('amount_sats', amount);
});
```

### 2. Error Tracking
```javascript
// Sentry configuration
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Remove sensitive data
    delete event.request?.headers?.authorization;
    delete event.extra?.rgbInvoice;
    return event;
  }
});
```

### 3. Custom Metrics Dashboard
```javascript
// Prometheus metrics example
const promClient = require('prom-client');

// Payment metrics
const paymentCounter = new promClient.Counter({
  name: 'lightcat_payments_total',
  help: 'Total number of payments',
  labelNames: ['status', 'tier']
});

const paymentDuration = new promClient.Histogram({
  name: 'lightcat_payment_duration_seconds',
  help: 'Payment processing duration',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

// Game metrics
const gameSessionGauge = new promClient.Gauge({
  name: 'lightcat_game_sessions_active',
  help: 'Currently active game sessions'
});

const gameScoreHistogram = new promClient.Histogram({
  name: 'lightcat_game_scores',
  help: 'Distribution of game scores',
  buckets: [0, 10, 20, 30, 40, 50]
});
```

### 4. Log Aggregation
```javascript
// Winston + ELK Stack configuration
const winston = require('winston');
const ElasticsearchTransport = require('winston-elasticsearch');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: process.env.ELASTICSEARCH_URL },
      index: 'lightcat-logs'
    })
  ]
});

// Structured logging
logger.info('payment_initiated', {
  invoiceId: invoice.id,
  tier: tier,
  batchCount: batchCount,
  userId: req.user?.id,
  timestamp: new Date().toISOString()
});
```

## Alert Configuration

### Critical Alerts (Immediate Response)
1. **Server Down**: Any health check failure
2. **Payment System Failure**: BTCPay unreachable
3. **Database Connection Lost**: Connection pool exhausted
4. **High Error Rate**: > 5% requests failing
5. **Security Breach Attempt**: Multiple rate limit violations

### Warning Alerts (Within 1 Hour)
1. **High Response Time**: API > 500ms average
2. **Low Token Supply**: < 1000 batches remaining
3. **Memory Usage High**: > 80% for 10 minutes
4. **Failed Payments**: > 10% failure rate
5. **Disk Space Low**: < 30% free

### Info Alerts (Daily Review)
1. **Daily Payment Summary**
2. **Game Performance Metrics**
3. **User Acquisition Stats**
4. **Infrastructure Costs**
5. **Error Trends**

## Monitoring Dashboards

### 1. Main Operations Dashboard
```
┌─────────────────────────────────────────────────────┐
│                  LIGHTCAT Operations                 │
├─────────────────┬───────────────┬──────────────────┤
│ Uptime          │ Active Users  │ Revenue Today    │
│ 99.95%          │ 342           │ 420,000 sats     │
├─────────────────┼───────────────┼──────────────────┤
│ Response Time   │ Error Rate    │ Game Sessions    │
│ 145ms avg       │ 0.03%         │ 1,247            │
├─────────────────┴───────────────┴──────────────────┤
│ Recent Alerts:                                      │
│ • None in last 24 hours                            │
└─────────────────────────────────────────────────────┘
```

### 2. Payment Flow Dashboard
```
┌─────────────────────────────────────────────────────┐
│                  Payment Metrics                     │
├─────────────────┬───────────────┬──────────────────┤
│ Invoices/Hour   │ Success Rate  │ Avg Process Time │
│ 47              │ 98.2%         │ 4.3 seconds      │
├─────────────────┼───────────────┼──────────────────┤
│ Failed Payments │ Pending       │ Total Today      │
│ 3               │ 2             │ 164              │
└─────────────────┴───────────────┴──────────────────┘
```

### 3. Game Performance Dashboard
```
┌─────────────────────────────────────────────────────┐
│                  Game Performance                    │
├─────────────────┬───────────────┬──────────────────┤
│ Active Players  │ Avg FPS       │ Load Time        │
│ 89              │ 58.2          │ 1.8s             │
├─────────────────┼───────────────┼──────────────────┤
│ Score Dist      │ Tier Unlocks  │ Completion Rate  │
│ Bronze: 45%     │ B:34 S:12 G:3 │ 67%              │
└─────────────────┴───────────────┴──────────────────┘
```

## Implementation Checklist

### Phase 1: Basic Monitoring (Day 1)
- [ ] Health checks on all endpoints
- [ ] Basic error logging
- [ ] Uptime monitoring (UptimeRobot/Pingdom)
- [ ] Server resource monitoring

### Phase 2: Application Monitoring (Week 1)
- [ ] APM tool integration
- [ ] Custom metrics collection
- [ ] Error tracking setup
- [ ] Basic dashboards

### Phase 3: Advanced Monitoring (Month 1)
- [ ] Log aggregation
- [ ] Custom alerts
- [ ] Performance profiling
- [ ] Security monitoring

### Phase 4: Optimization (Ongoing)
- [ ] Alert tuning
- [ ] Dashboard refinement
- [ ] Automation scripts
- [ ] Predictive analytics

## Monitoring Scripts

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

API_URL="https://api.lightcat.io/health"
UI_URL="https://lightcat.io"
GAME_URL="https://lightcat.io/game.html"

check_endpoint() {
    local url=$1
    local name=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" $url)
    
    if [ $response -eq 200 ]; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is down (HTTP $response)"
        # Send alert
        curl -X POST $SLACK_WEBHOOK -d "{\"text\":\"🚨 $name is down!\"}"
    fi
}

check_endpoint $API_URL "API"
check_endpoint $UI_URL "Website"
check_endpoint $GAME_URL "Game"
```

### Payment Monitor Script
```javascript
// payment-monitor.js
const axios = require('axios');

async function checkPaymentSystem() {
    const metrics = {
        timestamp: new Date().toISOString(),
        invoicesLastHour: 0,
        successRate: 0,
        avgProcessingTime: 0,
        alerts: []
    };
    
    try {
        // Get payment metrics from API
        const response = await axios.get('/api/metrics/payments');
        const data = response.data;
        
        metrics.invoicesLastHour = data.invoicesLastHour;
        metrics.successRate = data.successRate;
        metrics.avgProcessingTime = data.avgProcessingTime;
        
        // Check thresholds
        if (metrics.successRate < 0.95) {
            metrics.alerts.push({
                level: 'warning',
                message: `Payment success rate low: ${metrics.successRate * 100}%`
            });
        }
        
        if (metrics.avgProcessingTime > 10) {
            metrics.alerts.push({
                level: 'warning',
                message: `Slow payment processing: ${metrics.avgProcessingTime}s`
            });
        }
        
    } catch (error) {
        metrics.alerts.push({
            level: 'critical',
            message: 'Cannot reach payment metrics endpoint'
        });
    }
    
    return metrics;
}

// Run every 5 minutes
setInterval(async () => {
    const metrics = await checkPaymentSystem();
    console.log(JSON.stringify(metrics, null, 2));
    
    // Send to monitoring system
    if (metrics.alerts.length > 0) {
        // Send alerts
    }
}, 5 * 60 * 1000);
```

## Incident Response

### Severity Levels
1. **P1 - Critical**: Complete outage, payment system down
   - Response time: < 15 minutes
   - Escalation: Immediate
   
2. **P2 - High**: Degraded performance, partial outage
   - Response time: < 1 hour
   - Escalation: Within 2 hours
   
3. **P3 - Medium**: Non-critical issues, minor bugs
   - Response time: < 4 hours
   - Escalation: Next business day
   
4. **P4 - Low**: Cosmetic issues, feature requests
   - Response time: Best effort
   - Escalation: As needed

### Response Playbooks
1. [Server Down Playbook](./playbooks/server-down.md)
2. [Payment Failure Playbook](./playbooks/payment-failure.md)
3. [High Load Playbook](./playbooks/high-load.md)
4. [Security Incident Playbook](./playbooks/security-incident.md)

---

**Last Updated**: 2025-07-28
**Version**: 1.0.0
**Next Review**: Monthly