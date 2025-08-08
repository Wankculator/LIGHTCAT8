// Stats API Adapter - Handles both old and new API formats
// This ensures the frontend works with both database-backed and legacy stats

window.StatsAdapter = {
    /**
     * Normalize stats response to consistent format
     * @param {Object} apiResponse - Raw response from /api/rgb/stats
     * @returns {Object} Normalized stats object
     */
    normalizeStats: function(apiResponse) {
        // Check if it's the new database format
        if (apiResponse.success && apiResponse.stats) {
            // New format with database
            return {
                batchesSold: apiResponse.stats.batchesSold || 0,
                batchesRemaining: apiResponse.stats.batchesRemaining || 27900,
                tokensSold: apiResponse.stats.tokensSold || 0,
                uniqueBuyers: apiResponse.stats.uniqueBuyers || 0,
                percentSold: parseFloat(apiResponse.stats.percentSold) || 0,
                currentBatchPrice: apiResponse.stats.currentBatchPrice || 2000,
                lastSaleTime: apiResponse.stats.lastSaleTime
            };
        }
        
        // Check if it's the legacy format
        if (apiResponse.totalSupply !== undefined) {
            // Legacy format - calculate values
            const totalBatches = 27900; // Public batches
            const batchesSold = apiResponse.batchesSold || 0;
            const batchesRemaining = apiResponse.batchesAvailable || (totalBatches - batchesSold);
            const percentSold = ((batchesSold / totalBatches) * 100).toFixed(2);
            
            return {
                batchesSold: batchesSold,
                batchesRemaining: batchesRemaining,
                tokensSold: batchesSold * 700,
                uniqueBuyers: 0, // Not available in legacy format
                percentSold: parseFloat(percentSold),
                currentBatchPrice: apiResponse.pricePerBatch || 2000,
                lastSaleTime: null
            };
        }
        
        // Fallback for unknown format
        console.warn('Unknown stats API format:', apiResponse);
        return {
            batchesSold: 0,
            batchesRemaining: 27900,
            tokensSold: 0,
            uniqueBuyers: 0,
            percentSold: 0,
            currentBatchPrice: 2000,
            lastSaleTime: null
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
            // Return safe defaults
            return {
                batchesSold: 0,
                batchesRemaining: 27900,
                tokensSold: 0,
                uniqueBuyers: 0,
                percentSold: 0,
                currentBatchPrice: 2000,
                lastSaleTime: null
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
            
            // Constants
            const TOTAL_SUPPLY_BATCHES = 30000;
            const TEAM_BATCHES = 1500;
            const PARTNER_BATCHES = 600;
            const PRE_ALLOCATED = TEAM_BATCHES + PARTNER_BATCHES;
            const PUBLIC_BATCHES = 27900;
            
            // Calculate display values
            const publicSoldBatches = stats.batchesSold;
            const totalAllocated = PRE_ALLOCATED + publicSoldBatches;
            const publicRemaining = stats.batchesRemaining;
            const totalTokensAllocated = totalAllocated * 700;
            const uniqueBuyers = stats.uniqueBuyers;
            
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
                NumberFormatter.applyToElement('soldBatches', publicSoldBatches, 'batches sold');
                NumberFormatter.applyToElement('remainingBatches', publicRemaining, 'batches remaining');
                NumberFormatter.applyToElement('totalTokens', totalTokensAllocated, 'tokens sold');
                NumberFormatter.applyToElement('uniqueBuyers', uniqueBuyers, 'unique wallets');
            } else {
                // Fallback without NumberFormatter
                const updateElement = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = value.toLocaleString();
                };
                
                updateElement('soldBatches', publicSoldBatches);
                updateElement('remainingBatches', publicRemaining);
                updateElement('totalTokens', totalTokensAllocated);
                updateElement('uniqueBuyers', uniqueBuyers);
            }
            
            // Show warning if almost sold out
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
                const isMintClosed = true;
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
    
    console.log('✅ Stats adapter initialized and updateMintStats patched');
}