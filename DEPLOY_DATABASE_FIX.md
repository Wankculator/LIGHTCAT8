# 🚀 LIGHTCAT Database Stats Fix - Production Deployment Guide

## ✅ Issue Fixed
The website was showing hardcoded mock data (15.76% SOLD, 6,497 Batches) instead of real database stats.

## 📝 Summary of Changes

### 1. Created Database Service Wrapper
- **File**: `/server/services/databaseService.js`
- **Purpose**: Provides the interface that controllers expect (`getSalesStats()`)
- **Maps**: SupabaseService methods to expected controller methods

### 2. Created Database Middleware
- **File**: `/server/middleware/databaseMiddleware.js`
- **Purpose**: Injects database service into all requests as `req.databaseService`

### 3. Updated app.js
- **File**: `/server/app.js` (Line 102)
- **Change**: Added `app.use(injectDatabaseService);`
- **Effect**: All routes now have access to database service

### 4. RGB Controller Uses Database
- **File**: `/server/controllers/rgbPaymentController.js` (Line 293)
- **Endpoint**: `/api/rgb/stats`
- **Now Returns**: Real database values instead of mock data

## 🔧 Deployment Steps

### Step 1: Update Production Environment Variables
Add to production `.env` file:
```bash
SUPABASE_URL=https://zffyyjmdzmhpuorggmiq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZnl5am1kem1ocHVvcmdnbWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyNTYxNDksImV4cCI6MjA1MjgzMjE0OX0.bN5CrX5p0yLJpJaJRLLPfMZ7DGQyVJBxAIQoT5ojqpQ
SUPABASE_SERVICE_KEY=[YOUR_SERVICE_KEY_HERE]
```

### Step 2: Deploy Files
Deploy these files to production:
```bash
# Core files
server/services/databaseService.js
server/services/supabaseService.js  
server/middleware/databaseMiddleware.js

# Already updated files
server/app.js
server/controllers/rgbPaymentController.js
```

### Step 3: Install Dependencies (if needed)
```bash
npm install @supabase/supabase-js
```

### Step 4: Restart Server
```bash
pm2 restart lightcat-api
# or
systemctl restart lightcat
```

### Step 5: Verify Deployment
```bash
# Test the endpoint
curl https://rgblightcat.com/api/rgb/stats

# Should return real data like:
{
  "success": true,
  "stats": {
    "batchesSold": 0,          # Real value from database
    "batchesRemaining": 27900,  
    "tokensSold": 0,
    "uniqueBuyers": 0,         # Real value from database
    "currentBatchPrice": 2000,
    "percentSold": "0.00"      # Real calculation
  }
}

# NOT mock data like:
{
  "batchesSold": 1250,       # ❌ Mock value
  "uniqueBuyers": 342        # ❌ Mock value
}
```

## 🎯 Expected Results

### Before (Mock Data):
- Always shows 7.00% SOLD
- Always shows 1,950 batches sold
- Always shows 1,365,000 tokens sold
- Always shows 526 unique buyers

### After (Real Data):
- Shows actual % based on database
- Shows real batches sold count
- Shows real tokens sold (batches × 700)
- Shows actual unique wallet count
- Updates in real-time as purchases happen

## 🚨 Important Notes

1. **Database Connection**: The Supabase service will auto-initialize when the server starts
2. **Error Handling**: If database fails, it returns safe defaults (0 values)
3. **Performance**: Stats are fetched fresh each time (consider caching if needed)
4. **Frontend**: No frontend changes needed - it already polls `/api/rgb/stats` every 5 seconds

## 🔍 Troubleshooting

### If stats still show mock data:
1. Check server logs: `pm2 logs lightcat-api`
2. Verify env vars loaded: `pm2 env 0 | grep SUPABASE`
3. Test database directly: `node test-database-stats.js`

### If getting errors:
1. Check Supabase credentials are correct
2. Ensure service role key has proper permissions
3. Verify network allows connection to Supabase

## ✅ Success Criteria
- Website shows 0% SOLD (or actual % if sales exist)
- Batch counts update when purchases are made
- No more hardcoded 1,950 batches sold
- Stats refresh every 5 seconds automatically

---

**Deployment Command**: `./deploy.sh server`

**Contact**: If issues arise, check `/server/logs/error.log` for database connection errors.