#!/bin/bash
# Deploy Database Integration Fix for LIGHTCAT
# This script deploys the database service wrapper and ensures real stats are displayed

echo "🚀 LIGHTCAT Database Integration Deployment Script"
echo "================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set project root
PROJECT_ROOT="/mnt/c/Users/sk84l/Downloads/RGB LIGHT CAT/litecat-website"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}📋 Step 1: Validating environment...${NC}"

# Check if .env exists and has Supabase credentials
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ ERROR: .env file not found${NC}"
    exit 1
fi

# Check for required environment variables
if ! grep -q "SUPABASE_URL=" .env || ! grep -q "SUPABASE_ANON_KEY=" .env || ! grep -q "SUPABASE_SERVICE_KEY=" .env; then
    echo -e "${RED}❌ ERROR: Missing Supabase credentials in .env${NC}"
    echo "Please ensure the following are set:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_KEY"
    exit 1
fi

echo -e "${GREEN}✅ Environment validated${NC}"

echo -e "${YELLOW}📋 Step 2: Checking required files...${NC}"

# Check if database service files exist
REQUIRED_FILES=(
    "server/services/databaseService.js"
    "server/middleware/databaseMiddleware.js"
    "server/services/supabaseService.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ ERROR: Missing required file: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required files present${NC}"

echo -e "${YELLOW}📋 Step 3: Testing database connection locally...${NC}"

# Create a test script to verify database connection
cat > test-db-connection.js << 'EOF'
require('dotenv').config();
const databaseService = require('./server/services/databaseService');

async function testConnection() {
    console.log('Testing database connection...');
    
    try {
        const stats = await databaseService.getSalesStats();
        console.log('✅ Database connection successful!');
        console.log('Current stats:', {
            batches_sold: stats.batches_sold,
            tokens_sold: stats.tokens_sold,
            unique_wallets: stats.unique_wallets
        });
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
EOF

# Run the test
node test-db-connection.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database connection test failed${NC}"
    rm test-db-connection.js
    exit 1
fi

rm test-db-connection.js
echo -e "${GREEN}✅ Database connection test passed${NC}"

echo -e "${YELLOW}📋 Step 4: Starting local servers for validation...${NC}"

# Check if servers are already running
if lsof -i:3000 > /dev/null 2>&1; then
    echo "API server already running on port 3000"
else
    echo "Starting API server..."
    npm run dev:server > /dev/null 2>&1 &
    SERVER_PID=$!
    sleep 5
fi

echo -e "${YELLOW}📋 Step 5: Testing API endpoint...${NC}"

# Test the stats endpoint
STATS_RESPONSE=$(curl -s http://localhost:3000/api/rgb/stats)
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to reach API endpoint${NC}"
    [ ! -z "$SERVER_PID" ] && kill $SERVER_PID
    exit 1
fi

# Check if response contains real data (not mock)
if echo "$STATS_RESPONSE" | grep -q '"batchesSold":1250'; then
    echo -e "${RED}❌ WARNING: API is still returning mock data!${NC}"
    echo "Response: $STATS_RESPONSE"
else
    echo -e "${GREEN}✅ API is returning database data${NC}"
    echo "Response: $STATS_RESPONSE"
fi

# Kill test server if we started it
[ ! -z "$SERVER_PID" ] && kill $SERVER_PID

echo -e "${YELLOW}📋 Step 6: Creating deployment package...${NC}"

# Create deployment directory
DEPLOY_DIR="deployment_db_fix_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy required files
cp -r server/services/databaseService.js "$DEPLOY_DIR/"
cp -r server/services/supabaseService.js "$DEPLOY_DIR/"
cp -r server/middleware/databaseMiddleware.js "$DEPLOY_DIR/"
cp -r server/app.js "$DEPLOY_DIR/"
cp -r server/controllers/rgbPaymentController.js "$DEPLOY_DIR/"

echo -e "${GREEN}✅ Deployment package created: $DEPLOY_DIR${NC}"

echo -e "${YELLOW}📋 Step 7: Deployment instructions...${NC}"

cat << EOF

${GREEN}========== DEPLOYMENT INSTRUCTIONS ==========${NC}

1. ${YELLOW}Update production .env file:${NC}
   Add the following Supabase credentials:
   - SUPABASE_URL=https://zffyyjmdzmhpuorggmiq.supabase.co
   - SUPABASE_ANON_KEY=[your anon key]
   - SUPABASE_SERVICE_KEY=[your service key]

2. ${YELLOW}Deploy the following files:${NC}
   - server/services/databaseService.js
   - server/services/supabaseService.js
   - server/middleware/databaseMiddleware.js
   - server/app.js (already has middleware integrated)
   - server/controllers/rgbPaymentController.js

3. ${YELLOW}Restart the server:${NC}
   pm2 restart lightcat-api
   
4. ${YELLOW}Verify deployment:${NC}
   curl https://rgblightcat.com/api/rgb/stats
   
   Should return real database stats, not:
   - batchesSold: 1250 (mock value)
   - uniqueBuyers: 342 (mock value)

5. ${YELLOW}Monitor logs:${NC}
   pm2 logs lightcat-api --lines 100

${GREEN}============================================${NC}

${YELLOW}🎯 Quick Deploy Command:${NC}
./deploy.sh server

${YELLOW}📊 Expected Result:${NC}
The stats endpoint should return actual database values showing:
- Real batches sold (not 1250)
- Real unique buyers (not 342)
- Real token count
- Live updates as purchases happen

EOF

echo -e "${GREEN}✅ Database integration fix ready for deployment!${NC}"