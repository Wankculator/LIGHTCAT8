#!/bin/bash
# Fix stats to show 7% pre-allocation

echo "🔧 Fixing Stats to Show 7% Pre-allocation..."
echo "==========================================="

# Configuration
SERVER_IP="147.93.105.138"
SERVER_USER="root"
SERVER_PASS="ObamaknowsJA8@"

# Create updated stats adapter that includes pre-allocation
cat > stats-adapter-fixed.js << 'EOF'
// Stats API Adapter - Handles both old and new API formats
// This ensures the frontend works with both database-backed and legacy stats

window.StatsAdapter = {
    /**
     * Normalize stats response to consistent format
     * @param {Object} apiResponse - Raw response from /api/rgb/stats
     * @returns {Object} Normalized stats object
     */
    normalizeStats: function(apiResponse) {
        // Constants for pre-allocation
        const TOTAL_SUPPLY_BATCHES = 30000; // Full supply
        const TEAM_BATCHES = 1500; // 5% of 30k
        const PARTNER_BATCHES = 600; // 2% of 30k
        const PRE_ALLOCATED = TEAM_BATCHES + PARTNER_BATCHES; // 2100 batches (7%)
        const PUBLIC_BATCHES = 27900;
        
        // Check if it's the new database format
        if (apiResponse.success && apiResponse.stats) {
            // New format with database
            const publicSold = apiResponse.stats.batchesSold || 0;
            const totalAllocated = PRE_ALLOCATED + publicSold;
            const percentOfTotal = ((totalAllocated / TOTAL_SUPPLY_BATCHES) * 100).toFixed(2);
            
            return {
                batchesSold: totalAllocated, // Include pre-allocation
                batchesRemaining: apiResponse.stats.batchesRemaining || (PUBLIC_BATCHES - publicSold),
                tokensSold: totalAllocated * 700,
                uniqueBuyers: apiResponse.stats.uniqueBuyers || 0,
                percentSold: parseFloat(percentOfTotal), // Of total 30k supply
                currentBatchPrice: apiResponse.stats.currentBatchPrice || 2000,
                lastSaleTime: apiResponse.stats.lastSaleTime,
                publicSold: publicSold // Track actual public sales separately
            };
        }
        
        // Check if it's the legacy format
        if (apiResponse.totalSupply !== undefined) {
            // Legacy format - calculate values
            const publicSold = apiResponse.batchesSold || 0;
            const totalAllocated = PRE_ALLOCATED + publicSold;
            const batchesRemaining = apiResponse.batchesAvailable || (PUBLIC_BATCHES - publicSold);
            const percentOfTotal = ((totalAllocated / TOTAL_SUPPLY_BATCHES) * 100).toFixed(2);
            
            return {
                batchesSold: totalAllocated, // Include pre-allocation
                batchesRemaining: batchesRemaining,
                tokensSold: totalAllocated * 700,
                uniqueBuyers: 0, // Not available in legacy format
                percentSold: parseFloat(percentOfTotal), // Of total 30k supply
                currentBatchPrice: apiResponse.pricePerBatch || 2000,
                lastSaleTime: null,
                publicSold: publicSold // Track actual public sales separately
            };
        }
        
        // Fallback for unknown format - still show 7% pre-allocation
        console.warn('Unknown stats API format:', apiResponse);
        return {
            batchesSold: PRE_ALLOCATED, // Show pre-allocation
            batchesRemaining: PUBLIC_BATCHES,
            tokensSold: PRE_ALLOCATED * 700,
            uniqueBuyers: 0,
            percentSold: 7.00, // 2100/30000 = 7%
            currentBatchPrice: 2000,
            lastSaleTime: null,
            publicSold: 0
        };
    },
    
    /**
     * Fetch and normalize stats
     * @returns {Promise<Object>} Normalized stats
     */
    fetchStats: async function() {
        try {
            const response = await fetch('/api/rgb/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            
            const rawStats = await response.json();
            return this.normalizeStats(rawStats);
            
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Return safe defaults with pre-allocation
            return {
                batchesSold: 2100, // Pre-allocation
                batchesRemaining: 27900,
                tokensSold: 1470000, // 2100 * 700
                uniqueBuyers: 0,
                percentSold: 7.00,
                currentBatchPrice: 2000,
                lastSaleTime: null,
                publicSold: 0
            };
        }
    }
};

// Auto-initialize if updateMintStats exists
if (typeof updateMintStats === 'function') {
    console.log('Patching updateMintStats to use StatsAdapter...');
    
    // Store original function
    const originalUpdateMintStats = window.updateMintStats;
    
    // Create new function that uses the adapter
    window.updateMintStats = async function() {
        try {
            // Fetch normalized stats
            const stats = await StatsAdapter.fetchStats();
            
            // Update UI
            const progressText = document.getElementById('progressText');
            if (progressText) {
                progressText.textContent = stats.percentSold + '% SOLD';
            }
            
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = stats.percentSold + '%';
            }
            
            // Update stats with NumberFormatter
            if (window.NumberFormatter) {
                NumberFormatter.applyToElement('soldBatches', stats.batchesSold, 'batches sold');
                NumberFormatter.applyToElement('remainingBatches', stats.batchesRemaining, 'batches remaining');
                NumberFormatter.applyToElement('totalTokens', stats.tokensSold, 'tokens sold');
                NumberFormatter.applyToElement('uniqueBuyers', stats.uniqueBuyers, 'unique wallets');
            } else {
                // Fallback without NumberFormatter
                const updateElement = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = value.toLocaleString();
                };
                
                updateElement('soldBatches', stats.batchesSold);
                updateElement('remainingBatches', stats.batchesRemaining);
                updateElement('totalTokens', stats.tokensSold);
                updateElement('uniqueBuyers', stats.uniqueBuyers);
            }
            
            // Show warning if almost sold out
            const publicRemaining = stats.batchesRemaining;
            if (publicRemaining > 0 && publicRemaining <= 1000) {
                let warningBanner = document.getElementById('soldOutWarning');
                if (!warningBanner) {
                    warningBanner = document.createElement('div');
                    warningBanner.id = 'soldOutWarning';
                    warningBanner.className = 'warning-banner';
                    warningBanner.innerHTML = `
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>⚡ ONLY ${publicRemaining} BATCHES LEFT! ⚡</span>
                    `;
                    warningBanner.style.cssText = `
                        background: #ff5252;
                        color: white;
                        padding: 15px;
                        text-align: center;
                        font-weight: bold;
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        z-index: 9999;
                        animation: pulse 1s infinite;
                    `;
                    document.body.prepend(warningBanner);
                }
            }
            
            // Check if sold out
            if (publicRemaining <= 0) {
                progressText.textContent = '100% SOLD OUT';
                progressBar.style.width = '100%';
                progressBar.style.background = '#FF5252';
                
                // Show sold out message
                const purchaseSection = document.getElementById('purchase');
                if (purchaseSection && !document.getElementById('soldOutMessage')) {
                    const soldOutDiv = document.createElement('div');
                    soldOutDiv.id = 'soldOutMessage';
                    soldOutDiv.className = 'sold-out-message';
                    soldOutDiv.innerHTML = `
                        <h2 style="color: #FF5252;">🚫 MINT CLOSED - SOLD OUT! 🚫</h2>
                        <p>All 27,900 public batches have been sold!</p>
                        <p>Join our community for updates on secondary markets.</p>
                    `;
                    soldOutDiv.style.cssText = `
                        text-align: center;
                        padding: 40px;
                        background: rgba(255, 82, 82, 0.1);
                        border-radius: 20px;
                        margin: 20px 0;
                    `;
                    purchaseSection.prepend(soldOutDiv);
                    
                    // Hide purchase form
                    const purchaseForm = document.getElementById('purchaseForm');
                    if (purchaseForm) {
                        purchaseForm.style.display = 'none';
                    }
                }
            }
            
        } catch (error) {
            console.error('Error in updateMintStats:', error);
        }
    };
    
    console.log('✅ Stats adapter initialized with pre-allocation support');
}
EOF

echo "📋 Deploying updated stats adapter..."

# Deploy the fixed stats adapter
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no \
  stats-adapter-fixed.js $SERVER_USER@$SERVER_IP:/var/www/rgblightcat/client/js/stats-adapter.js

echo "✅ Stats adapter updated"

# Clean up
rm stats-adapter-fixed.js

echo "📋 Clearing browser cache..."

# Force nginx to not cache
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no \
  $SERVER_USER@$SERVER_IP "rm -rf /var/cache/nginx/* && systemctl reload nginx"

echo "✅ Cache cleared"

echo ""
echo "==========================================="
echo "✅ Stats Display Fixed!"
echo "==========================================="
echo ""
echo "The website will now show:"
echo "- 7.00% SOLD (pre-allocation)"
echo "- 2,100 Batches Sold (team + partners)"
echo "- 27,900 Batches Remaining"
echo "- 1,470,000 Tokens Sold"
echo ""
echo "When public sales start, it will show:"
echo "- 7.XX% and increase from there"
echo "- 2,100 + public sales"
echo ""