# 📋 LIGHTCAT Product Requirements Document (PRD)

## 🎯 Product Overview

**Product Name**: LIGHTCAT RGB Token  
**Tagline**: First Cat Meme Token on RGB Protocol  
**Launch Date**: TBD  
**Version**: 1.0

### Executive Summary
LIGHTCAT is a gamified token sale platform that distributes RGB Protocol tokens via Lightning Network payments. Users play a cat-themed arcade game to unlock purchase tiers, pay with Lightning, and automatically receive RGB tokens.

## 🏗️ System Architecture

### Core Components
1. **Frontend**: Web-based game and purchase interface
2. **Backend**: Node.js API handling payments and distribution
3. **Payment Processor**: BTCPay Server (via app.voltage.cloud)
4. **Token Distribution**: RGB Node (automatic consignment generation)
5. **Database**: Supabase for transaction tracking

## 💰 Token Economics

| Parameter | Value |
|-----------|-------|
| Total Supply | 21,000,000 LIGHTCAT |
| Token Protocol | RGB on Bitcoin |
| Batch Size | 700 tokens |
| Price per Batch | 2,000 satoshis |
| Total Batches | 30,000 |
| Available for Sale | 28,500 batches (95%) |
| Dev Reserve | 1,500 batches (5%) |

## 🎮 User Journey

### 1. Game Phase
```mermaid
User visits site → Plays cat game → Achieves score → Unlocks tier
```

**Tier System**:
- **Bronze** (11-17 points): Max 5 batches
- **Silver** (18-27 points): Max 8 batches
- **Gold** (28+ points): Max 10 batches

### 2. Purchase Phase
```mermaid
Enter RGB invoice → Select batches → Generate Lightning invoice → Show QR code
```

### 3. Payment Phase
```mermaid
User pays Lightning → BTCPay webhook → Payment confirmed → Generate consignment
```

### 4. Distribution Phase
```mermaid
RGB node creates consignment → Base64 encode → User downloads → Import to wallet
```

## 🔧 Technical Requirements

### Frontend Requirements
- [x] Mobile responsive (10/10 score)
- [x] Touch controls for game
- [x] Real-time progress bar
- [x] QR code display
- [x] Download consignment button

### Backend Requirements

#### Payment Processing
- [ ] **BTCPay Integration** (Voltage.cloud)
  - [ ] API authentication
  - [ ] Invoice generation
  - [ ] Webhook handling
  - [ ] Payment verification

#### RGB Distribution
- [ ] **RGB Node Setup**
  - [ ] Install RGB node
  - [ ] Import wallet with 21M tokens
  - [ ] Configure automatic signing
  - [ ] Consignment generation API

#### Automation Flow
```javascript
// Pseudocode for automatic distribution
async function handlePaymentConfirmed(invoiceId) {
  // 1. Verify payment amount
  const payment = await btcpay.getInvoice(invoiceId);
  
  // 2. Calculate token amount
  const batches = payment.amount / 2000;
  const tokens = batches * 700;
  
  // 3. Generate RGB consignment
  const consignment = await rgbNode.transfer({
    asset: 'LIGHTCAT_ASSET_ID',
    amount: tokens,
    recipient: payment.metadata.rgbInvoice
  });
  
  // 4. Store consignment
  await db.saveConsignment(invoiceId, consignment);
  
  // 5. Update UI via WebSocket
  ws.send({ status: 'completed', consignment });
}
```

### Database Schema
```sql
-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  rgb_invoice TEXT NOT NULL,
  lightning_invoice TEXT NOT NULL,
  amount_sats INTEGER NOT NULL,
  batches INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  consignment_file TEXT,
  created_at TIMESTAMP,
  paid_at TIMESTAMP,
  delivered_at TIMESTAMP
);

-- Stats tracking
CREATE TABLE stats (
  total_sold INTEGER DEFAULT 0,
  unique_buyers INTEGER DEFAULT 0,
  last_sale_time TIMESTAMP
);
```

## 🔐 Security Requirements

### Payment Security
- [x] Invoice amount validation
- [x] Rate limiting (10 invoices/5min per IP)
- [x] RGB invoice format validation
- [ ] BTCPay webhook signature verification

### Distribution Security
- [ ] Secure wallet storage (hardware wallet recommended)
- [ ] Transaction signing isolation
- [ ] Audit trail for all transfers
- [ ] Automatic backup after each transfer

## 📊 Monitoring & Analytics

### Real-time Metrics
- Total tokens sold (progress bar)
- Current batch price
- Unique buyers count
- Recent transactions

### Alerts Needed
- Payment received
- Distribution failed
- Low token balance (<1000 batches)
- RGB node offline

## 🚀 Deployment Requirements

### Infrastructure
- **Frontend**: Static hosting (Vercel/Netlify)
- **Backend**: VPS with RGB node
- **Database**: Supabase cloud
- **BTCPay**: Voltage.cloud instance

### Environment Variables
```env
# Production Required
NODE_ENV=production
BTCPAY_URL=https://your-instance.voltage.cloud
BTCPAY_STORE_ID=your-store-id
BTCPAY_API_KEY=your-api-key
BTCPAY_WEBHOOK_SECRET=your-webhook-secret

RGB_NODE_URL=http://localhost:8080
RGB_WALLET_NAME=lightcat-distribution
RGB_ASSET_ID=your-lightcat-asset-id

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

JWT_SECRET=generate-strong-secret
```

## 🏁 Launch Checklist

### Phase 1: RGB Setup (Day 1)
- [ ] Install RGB node on server
- [ ] Import wallet with 21M LIGHTCAT
- [ ] Test manual transfer
- [ ] Create API endpoint for transfers

### Phase 2: BTCPay Integration (Day 2)
- [ ] Configure Voltage.cloud BTCPay
- [ ] Set up API access
- [ ] Configure webhooks
- [ ] Test payment flow

### Phase 3: Automation (Day 3)
- [ ] Connect payment webhook to RGB transfer
- [ ] Test automatic distribution
- [ ] Verify consignment download
- [ ] Load test with multiple payments

### Phase 4: Production (Day 4)
- [ ] Deploy to production server
- [ ] Configure monitoring
- [ ] Test with small batch
- [ ] Go live!

## 📈 Success Metrics

### Launch Week
- 100 unique buyers
- 1,000 batches sold
- Zero distribution failures
- <30 second distribution time

### Month 1
- 1,000 unique buyers
- 10,000 batches sold
- 99.9% uptime
- Community growth

## ❓ Open Questions

1. **RGB Node Hosting**: Should RGB node run on same server as API or separate?
2. **Wallet Backup**: Hardware wallet integration for signing?
3. **Batch Limits**: Hard limit per wallet address?
4. **Price Changes**: Will batch price change over time?
5. **Refunds**: Policy for failed distributions?

---

**Status**: DRAFT  
**Last Updated**: 2025-01-28  
**Author**: LIGHTCAT Team