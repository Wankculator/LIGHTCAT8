# Production Deployment Checklist

## Pre-Deployment Verification

### 1. Code Quality ✅
- [x] All security fixes applied (gameRandom() bug fixed)
- [x] No Math.random() in security-critical code
- [x] Memory leak prevention implemented
- [x] Event listeners properly cleaned up
- [ ] All tests passing (blocked by env config)
- [ ] Code review completed by second developer

### 2. Configuration ⚠️
- [ ] Production environment variables set:
  - [ ] JWT_SECRET (strong, unique secret)
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] BTCPAY_SERVER_URL
  - [ ] BTCPAY_API_KEY
  - [ ] BTCPAY_STORE_ID
  - [ ] NODE_ENV=production
- [ ] CORS configured for production domain only
- [ ] Rate limiting configured appropriately
- [ ] SSL certificates valid and installed

### 3. Database 🗄️
- [ ] Production database migrated
- [ ] Database backups configured
- [ ] Connection pooling optimized
- [ ] RLS policies reviewed and tested
- [ ] Indexes created for performance

### 4. Payment System 💰
- [x] Payment constants verified:
  - Invoice expiry: 15 minutes
  - Polling interval: 3 seconds
  - Batch price: 2000 sats
  - Tier limits: Bronze=10, Silver=20, Gold=30
- [x] Mint locked without game tier
- [ ] BTCPay Server webhook configured
- [ ] Payment flow tested end-to-end
- [ ] Consignment generation verified

### 5. Performance 🚀
- [x] Client bundle optimized
- [x] Mobile performance verified
- [ ] Load testing completed (target: 1000 concurrent users)
- [ ] CDN configured for static assets
- [ ] Gzip/Brotli compression enabled

### 6. Security 🔒
- [x] No hardcoded secrets
- [x] Input validation on all endpoints
- [x] SQL injection prevention verified
- [x] XSS protection enabled
- [ ] Security headers configured:
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Strict-Transport-Security
- [ ] DDoS protection enabled

### 7. Monitoring & Logging 📊
- [ ] Error tracking configured (Sentry/similar)
- [ ] Application metrics setup
- [ ] Server monitoring configured
- [ ] Log aggregation setup
- [ ] Alerts configured for:
  - [ ] Server down
  - [ ] High error rate
  - [ ] Payment failures
  - [ ] Low token supply

### 8. Backup & Recovery 🔄
- [ ] Database backup strategy documented
- [ ] Application backup configured
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested
- [ ] Data retention policy defined

## Deployment Steps

### Step 1: Pre-deployment
```bash
# 1. Create deployment branch
git checkout -b deploy/production-$(date +%Y%m%d)

# 2. Run final tests
npm test
npm run test:integration
npm run test:e2e

# 3. Build production bundle
npm run build

# 4. Verify build
npm run build:verify
```

### Step 2: Database Migration
```bash
# 1. Backup current database
npm run db:backup

# 2. Run migrations
npm run db:migrate:production

# 3. Verify migration
npm run db:verify
```

### Step 3: Deploy Application
```bash
# 1. Deploy to staging first
./scripts/deploy-staging.sh

# 2. Run smoke tests on staging
npm run test:staging

# 3. Deploy to production
./scripts/deploy-production.sh

# 4. Verify deployment
curl https://production-url/health
```

### Step 4: Post-deployment
```bash
# 1. Run production smoke tests
npm run test:production:smoke

# 2. Monitor error rates for 30 minutes
npm run monitor:errors

# 3. Check all critical paths:
- [ ] Homepage loads
- [ ] Game loads and plays
- [ ] Payment flow works
- [ ] Consignment downloads

# 4. Update status page
```

## Rollback Procedure

If issues are detected:

```bash
# 1. Immediate rollback
./scripts/rollback-production.sh

# 2. Restore database if needed
npm run db:restore:latest

# 3. Clear CDN cache
npm run cdn:purge

# 4. Notify team
```

## Critical Contacts

- **DevOps Lead**: [Contact Info]
- **Payment System**: [BTCPay Support]
- **Database Admin**: [Contact Info]
- **On-call Developer**: [Rotation Schedule]

## Final Checks

Before marking deployment complete:

- [ ] All services responding normally
- [ ] No increase in error rates
- [ ] Payment flow tested with real transaction
- [ ] Mobile experience verified
- [ ] Performance metrics within targets
- [ ] Team notified of successful deployment

---

**Last Updated**: 2025-07-28
**Version**: 1.0.0
**Next Review**: Before next major deployment