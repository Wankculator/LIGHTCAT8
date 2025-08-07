/**
 * COMPREHENSIVE MINT SYSTEM TEST
 * Testing all scenarios and documenting results
 */

const tests = {
    // Test 1: Check tier requirements consistency
    checkTierRequirements: function() {
        console.log("\n=== TEST 1: Tier Requirements ===");
        const expectedRequirements = {
            bronze: { min: 11, max: 14 },
            silver: { min: 15, max: 24 },
            gold: { min: 25, max: Infinity }
        };
        
        // Check what's in localStorage
        const storedTier = localStorage.getItem('unlockedTier');
        const storedScore = parseInt(localStorage.getItem('gameScore')) || 0;
        
        console.log(`Stored Tier: ${storedTier}`);
        console.log(`Stored Score: ${storedScore}`);
        
        // Validate tier based on score
        let correctTier = null;
        if (storedScore >= 25) correctTier = 'gold';
        else if (storedScore >= 15) correctTier = 'silver';
        else if (storedScore >= 11) correctTier = 'bronze';
        
        console.log(`Correct Tier for score ${storedScore}: ${correctTier}`);
        console.log(`Match: ${storedTier === correctTier ? '✅' : '❌ MISMATCH!'}`);
        
        return storedTier === correctTier;
    },
    
    // Test 2: Check if purchase form is visible
    checkPurchaseFormVisibility: function() {
        console.log("\n=== TEST 2: Purchase Form Visibility ===");
        const purchaseForm = document.getElementById('purchaseForm');
        
        if (!purchaseForm) {
            console.log("❌ Purchase form not found!");
            return false;
        }
        
        const isVisible = window.getComputedStyle(purchaseForm).display !== 'none';
        const hasValidTier = localStorage.getItem('unlockedTier') && 
                           (parseInt(localStorage.getItem('gameScore')) || 0) >= 11;
        
        console.log(`Form visible: ${isVisible}`);
        console.log(`Has valid tier: ${hasValidTier}`);
        console.log(`Match: ${isVisible === hasValidTier ? '✅' : '❌ VISIBILITY MISMATCH!'}`);
        
        return isVisible === hasValidTier;
    },
    
    // Test 3: Check button functionality
    checkButtonFunctionality: function() {
        console.log("\n=== TEST 3: Button Functionality ===");
        const buttons = {
            submitInvoice: document.getElementById('submitRgbInvoice'),
            scanQR: document.querySelector('button[onclick*="openQRScanner"]'),
            batchDecrease: document.querySelector('.batch-selector button[onclick*="decrease"]'),
            batchIncrease: document.querySelector('.batch-selector button[onclick*="increase"]')
        };
        
        let allWorking = true;
        
        for (const [name, button] of Object.entries(buttons)) {
            if (!button) {
                console.log(`❌ ${name} button not found!`);
                allWorking = false;
                continue;
            }
            
            const isDisabled = button.disabled;
            const hasClickHandler = button.onclick || button.getAttribute('onclick');
            const eventListeners = getEventListeners ? getEventListeners(button) : null;
            
            console.log(`${name}:`);
            console.log(`  - Disabled: ${isDisabled}`);
            console.log(`  - Has click handler: ${!!hasClickHandler}`);
            console.log(`  - Status: ${!isDisabled && hasClickHandler ? '✅' : '❌ NOT WORKING!'}`);
            
            if (isDisabled || !hasClickHandler) {
                allWorking = false;
            }
        }
        
        return allWorking;
    },
    
    // Test 4: Check for duplicate/conflicting scripts
    checkScriptConflicts: function() {
        console.log("\n=== TEST 4: Script Conflicts ===");
        const scripts = Array.from(document.querySelectorAll('script[src*="mint"]'));
        
        console.log(`Found ${scripts.length} mint-related scripts:`);
        scripts.forEach(script => {
            console.log(`  - ${script.src.split('/').pop()}`);
        });
        
        // Check for multiple tier validation functions
        const tierCheckScripts = scripts.filter(s => 
            s.src.includes('mint-lock') || 
            s.src.includes('critical-fixes')
        );
        
        if (tierCheckScripts.length > 2) {
            console.log(`⚠️ WARNING: ${tierCheckScripts.length} scripts checking tiers - potential conflicts!`);
            return false;
        }
        
        return true;
    },
    
    // Test 5: Check batch selector limits
    checkBatchLimits: function() {
        console.log("\n=== TEST 5: Batch Selector Limits ===");
        const batchInput = document.getElementById('batchCount');
        const tier = localStorage.getItem('unlockedTier');
        
        if (!batchInput) {
            console.log("❌ Batch input not found!");
            return false;
        }
        
        const expectedMax = {
            bronze: 10,
            silver: 20,
            gold: 30
        };
        
        const currentMax = parseInt(batchInput.max);
        const expected = expectedMax[tier] || 0;
        
        console.log(`Tier: ${tier}`);
        console.log(`Current max: ${currentMax}`);
        console.log(`Expected max: ${expected}`);
        console.log(`Match: ${currentMax === expected ? '✅' : '❌ LIMIT MISMATCH!'}`);
        
        return currentMax === expected;
    },
    
    // Run all tests
    runAll: function() {
        console.log("====================================");
        console.log("   MINT SYSTEM COMPREHENSIVE TEST");
        console.log("====================================");
        
        const results = {
            tierRequirements: this.checkTierRequirements(),
            formVisibility: this.checkPurchaseFormVisibility(),
            buttonFunctionality: this.checkButtonFunctionality(),
            scriptConflicts: this.checkScriptConflicts(),
            batchLimits: this.checkBatchLimits()
        };
        
        console.log("\n=== FINAL RESULTS ===");
        let allPassed = true;
        for (const [test, passed] of Object.entries(results)) {
            console.log(`${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
            if (!passed) allPassed = false;
        }
        
        console.log(`\nOVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SYSTEM HAS ISSUES'}`);
        
        return results;
    }
};

// Run tests immediately
if (typeof window !== 'undefined') {
    window.mintTests = tests;
    console.log("Run mintTests.runAll() to test the system");
}