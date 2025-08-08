# LIGHTCAT Platform - Comprehensive Test Scenarios

## Overview
This document outlines comprehensive test scenarios for the LIGHTCAT platform, focusing on edge cases, security vulnerabilities, performance requirements, and stress testing that haven't been fully covered in existing tests.

## 1. Payment Flow Edge Cases

### 1.1 Invoice Expiration Boundary Tests
```
Scenario: Invoice expires during payment processing
Given: User has created a Lightning invoice (15-minute expiry)
When: Payment is received at exactly 14:59 or 15:01
Then: System should handle edge case gracefully
Test: Verify no tokens are issued for expired payments
```

### 1.2 Double Payment Scenarios
```
Scenario: Multiple payments to same invoice
Given: Invoice is already marked as paid
When: Additional payment is received
Then: System should reject/refund duplicate payment
Test: Ensure no double-spending of tokens
```

### 1.3 Partial Payment Handling
```
Scenario: User pays less than invoice amount
Given: Invoice for 6,000 sats (3 batches)
When: User pays only 4,000 sats
Then: Payment should be rejected, no tokens issued
Test: Verify exact amount validation
```

### 1.4 Race Condition - Simultaneous Purchases
```
Scenario: Multiple users buy last available batches
Given: Only 5 batches remaining
When: 3 users simultaneously try to buy 3 batches each
Then: Only first user succeeds, others get "sold out" error
Test: Database transaction isolation
```

### 1.5 RGB Invoice Malformation Tests
```
Scenario: Malformed RGB invoice formats
Test Cases:
- Missing UTXO reference: "rgb::..."
- Invalid base64 encoding in invoice
- Extremely long invoice strings (>10KB)
- SQL injection attempts in invoice field
- Unicode/emoji characters in invoice
```

### 1.6 Network Interruption During Consignment
```
Scenario: Connection loss during RGB consignment generation
Given: Payment confirmed, generating consignment
When: Network interruption occurs
Then: System should retry or allow re-download
Test: Idempotency of consignment generation
```

## 2. Game Exploit Scenarios

### 2.1 Client-Side Score Manipulation
```
Scenario: Direct localStorage manipulation
Attack Vector:
localStorage.setItem('highScore', '999999');
localStorage.setItem('litecatGameTier', '3');

Defense Test:
- Server-side score validation
- Cryptographic score signing
- Session-based score tracking
```

### 2.2 Game State Injection
```
Scenario: Console manipulation during gameplay
Attack Vectors:
window.litecatGame.score = 1000;
window.litecatGame.endGame();
window.currentTier = 3;
window.maxBatchesAllowed = 10;

Test: Verify server validates game session integrity
```

### 2.3 Timing Attack on Game Duration
```
Scenario: Manipulate game timer
Attack: Slow down browser/system clock
Result: Extended gameplay time
Test: Server-side game duration validation
```

### 2.4 Memory Manipulation
```
Scenario: Use browser dev tools to modify game variables
Test Cases:
- Change physics constants for easier gameplay
- Modify collision detection
- Disable enemy spawning
- Infinite lives/power-ups
```

### 2.5 Replay Attack
```
Scenario: Replay high-score achievement
Attack: Capture and replay network requests
Test: Ensure one-time tokens for score submission
```

## 3. Load/Stress Testing Requirements

### 3.1 Concurrent User Load
```
Test Levels:
- 100 concurrent users (baseline)
- 1,000 concurrent users (normal peak)
- 10,000 concurrent users (launch event)
- 50,000 concurrent users (viral scenario)

Metrics to Monitor:
- API response time (<200ms target)
- WebSocket connection stability
- Database query performance
- Memory usage patterns
```

### 3.2 Game Performance Under Load
```
Scenarios:
- 1,000 simultaneous game sessions
- Memory leak detection over 1-hour gameplay
- FPS degradation with particle effects
- Mobile device thermal throttling
```

### 3.3 Payment Processing Surge
```
Scenario: Flash sale event
Test: 1,000 invoices created per minute
Monitor:
- BTCPay Server response times
- Database transaction deadlocks
- Queue processing delays
- WebSocket broadcast performance
```

### 3.4 RGB Consignment Generation Bottleneck
```
Scenario: Mass redemption after payment
Test: 500 simultaneous consignment generations
Monitor:
- CPU usage spikes
- Memory allocation
- File I/O bottlenecks
- Response time degradation
```

## 4. Security Penetration Scenarios

### 4.1 Authentication Bypass Attempts
```
Test Cases:
- JWT token manipulation
- Session hijacking
- CORS bypass attempts
- Admin endpoint access without auth
```

### 4.2 Payment Webhook Spoofing
```
Scenario: Fake BTCPay webhook
Attack Vectors:
- Missing HMAC signature
- Invalid HMAC signature
- Replay old valid webhooks
- Modified payment amounts
```

### 4.3 Database Injection Points
```
Test All User Inputs:
- RGB invoice field: '; DROP TABLE purchases;--
- Wallet address: <script>alert('XSS')</script>
- Email field: admin@test.com' OR '1'='1
- Batch count: -1, 0, 9999999
```

### 4.4 File Upload/Download Exploits
```
Scenarios:
- Path traversal in consignment download
- Large file DoS (request 1GB consignment)
- MIME type confusion
- Executable file injection
```

### 4.5 Rate Limiting Bypass
```
Test Cases:
- Distributed attack from multiple IPs
- Header manipulation (X-Forwarded-For)
- Slowloris attack
- Connection pool exhaustion
```

## 5. Mobile Device Compatibility

### 5.1 Low-End Device Performance
```
Devices to Test:
- Android 6.0, 1GB RAM
- iPhone 6s, iOS 12
- Budget tablets ($50-100 range)

Metrics:
- Page load time (<5 seconds)
- Game playability (>20 FPS)
- Memory usage (<100MB)
```

### 5.2 Network Condition Simulation
```
Scenarios:
- 2G connection (50 Kbps)
- Intermittent connectivity
- High latency (500ms+)
- Packet loss (10-20%)
```

### 5.3 Touch Input Edge Cases
```
Test Cases:
- Multi-touch during payment
- Rapid tap on purchase button
- Swipe gestures during form input
- Screen rotation during game
- Touch target accuracy (44x44px minimum)
```

### 5.4 Browser Compatibility Matrix
```
Required Testing:
- Safari iOS 12+ (WebKit)
- Chrome Android 70+
- Samsung Internet
- UC Browser
- Opera Mini (data saving mode)
```

## 6. Network Failure Scenarios

### 6.1 Payment State Recovery
```
Scenario: Network fails after payment but before confirmation
Test:
1. Complete Lightning payment
2. Simulate network failure
3. Reconnect after 5 minutes
4. Verify payment status recovered
```

### 6.2 WebSocket Reconnection
```
Scenarios:
- Connection drops every 30 seconds
- Firewall blocks WebSocket upgrade
- Proxy interference
- Load balancer timeout
```

### 6.3 CDN Failure Simulation
```
Test Cases:
- Three.js library fails to load
- Game assets 404
- CSS partially loaded
- Fallback to local assets
```

### 6.4 API Gateway Failures
```
Scenarios:
- 502 Bad Gateway responses
- 504 Gateway Timeout
- Partial response (connection closed early)
- Invalid JSON responses
```

## 7. Concurrent User Testing

### 7.1 Database Deadlock Scenarios
```
Test Case: Competing transactions
- User A and B buy same RGB invoice ID
- Simultaneous stats updates
- Batch inventory race conditions
```

### 7.2 WebSocket Broadcast Storms
```
Scenario: Rapid sales trigger mass notifications
Test: 100 purchases in 10 seconds
Monitor: Client connection stability
```

### 7.3 Session Management Conflicts
```
Test Cases:
- Same user, multiple devices
- Session timeout during purchase
- Cookie conflicts
- localStorage sync issues
```

## 8. RGB Protocol Specific Tests

### 8.1 UTXO Validation
```
Test Cases:
- Already spent UTXO
- Invalid UTXO format
- Testnet UTXO on mainnet
- Future UTXO (not yet confirmed)
```

### 8.2 Consignment File Integrity
```
Scenarios:
- Corrupted consignment download
- Incomplete file transfer
- Wrong consignment for invoice
- Consignment version compatibility
```

### 8.3 RGB State Transition Validation
```
Test:
- Invalid state transitions
- Double-spend attempts
- Schema validation failures
- Asset amount overflows
```

### 8.4 Multi-Asset Confusion
```
Scenario: Wrong RGB asset type
Test: Submit invoice for different RGB asset
Verify: Correct asset validation
```

## 9. Advanced Attack Scenarios

### 9.1 DDoS Mitigation Testing
```
Attack Vectors:
- Application layer (L7) floods
- Amplification attacks
- Slowloris
- RUDY (R-U-Dead-Yet)
```

### 9.2 Supply Chain Attacks
```
Test:
- Compromised npm packages
- CDN script injection
- Subdomain takeover
- DNS hijacking simulation
```

### 9.3 Social Engineering Vectors
```
Scenarios:
- Phishing site detection
- Typosquatting protection
- Fake support requests
- Invoice substitution attacks
```

## 10. Monitoring and Alerting Tests

### 10.1 Alert Threshold Testing
```
Trigger Conditions:
- Payment processing >5 seconds
- Error rate >1%
- Memory usage >80%
- Disk space <10%
```

### 10.2 Incident Response Drills
```
Scenarios:
- Database failure
- Payment gateway down
- Security breach detected
- Data corruption event
```

## Test Execution Priority

### Critical (P0) - Must test before production:
1. Payment race conditions
2. Game score manipulation
3. Security injection points
4. Network failure recovery

### High (P1) - Test within first week:
1. Load testing to 1,000 users
2. Mobile device compatibility
3. RGB protocol edge cases
4. WebSocket stability

### Medium (P2) - Test within first month:
1. Advanced DDoS scenarios
2. Extended stress testing
3. Comprehensive browser matrix
4. Social engineering defenses

## Test Automation Requirements

### Automated Test Coverage Goals:
- Unit tests: 80% coverage
- Integration tests: 70% coverage
- E2E tests: Critical paths only
- Performance tests: Nightly runs
- Security scans: Weekly

### Continuous Testing Pipeline:
```yaml
stages:
  - unit_tests
  - integration_tests
  - security_scan
  - performance_baseline
  - mobile_compatibility
  - chaos_engineering
```

## Reporting and Metrics

### Key Metrics to Track:
- Mean Time Between Failures (MTBF)
- Mean Time To Recovery (MTTR)
- Payment success rate
- Game completion rate
- API availability (target: 99.9%)

### Test Result Dashboard:
- Real-time test status
- Historical trend analysis
- Failure categorization
- Performance benchmarks
- Security vulnerability tracking

---

Last Updated: 2025-01-28
Version: 1.0.0