/**
 * Hide Mint Lock Message Only
 * Ultra-minimal fix that ONLY hides the text
 * Does NOT touch ANY buttons, forms, or functionality
 */
(function() {
    // Only run if tier is unlocked
    const tier = localStorage.getItem('unlockedTier') || 
                 new URLSearchParams(window.location.search).get('tier');
    
    if (!tier || tier === 'null' || tier === 'undefined') {
        return; // Don't do anything if no tier
    }
    
    // Add CSS to hide mint lock messages
    const style = document.createElement('style');
    style.textContent = `
        /* Hide mint lock text when tier is unlocked */
        body[data-tier-unlocked="true"] .mint-locked-message,
        body[data-tier-unlocked="true"] .mint-locked-container,
        body[data-tier-unlocked="true"] h3:has-text("MINT IS LOCKED") {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
    
    // Mark body as tier unlocked
    document.body.setAttribute('data-tier-unlocked', 'true');
    
    // Also hide any h3 with the specific text (fallback for browsers without :has-text)
    document.querySelectorAll('h3').forEach(h3 => {
        if (h3.textContent.includes('🔒 MINT IS LOCKED')) {
            h3.style.display = 'none';
        }
    });
    
    console.log('✅ Mint lock message hidden (tier:', tier, ')');
})();