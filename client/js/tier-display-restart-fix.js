// This file requires memory-safe-events.js to be loaded first
/**
 * Tier Display and Restart Fix
 * Fixes tier showing as "0 NO TIER" and restart issues
 */
(function() {
    'use strict';
    
    console.log('[TierFix] Initializing tier display and restart fixes');
    
    // Store the actual score globally for game over screen
    window.gameScore = 0;
    window.gameTier = null;
    
    // Tier calculation function
    function calculateTier(score) {
        if (score >= 25) return 'GOLD TIER';
        if (score >= 15) return 'SILVER TIER';
        if (score >= 11) return 'BRONZE TIER';
        return 'NO TIER';
    }
    
    // Fix 1: Tier Display
    function fixTierDisplay() {
        // Override the global showGameOver if it exists
        const originalShowGameOver = window.showGameOver;
        
        window.showGameOver = function() {
            console.log('[TierFix] Game over triggered, score:', window.gameScore);
            
            // Get the current score from the score element
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                window.gameScore = parseInt(scoreElement.textContent) || 0;
            }
            
            // Calculate tier
            window.gameTier = calculateTier(window.gameScore);
            console.log('[TierFix] Calculated tier:', window.gameTier);
            
            // Update all score displays
            updateScoreDisplays();
            
            // Call original function if it exists
            if (originalShowGameOver && typeof originalShowGameOver === 'function') {
                originalShowGameOver.apply(this, arguments);
            }
            
            // Force update after a short delay to ensure DOM is ready
            setTimeout(updateScoreDisplays, 100);
        };
        
        // Also monitor score changes during gameplay
        setInterval(function() {
            const scoreElement = document.getElementById('score');
            if (scoreElement) {
                const currentScore = parseInt(scoreElement.textContent) || 0;
                if (currentScore !== window.gameScore) {
                    window.gameScore = currentScore;
                    window.gameTier = calculateTier(currentScore);
                }
            }
        }, 100);
    }
    
    // Update all score display elements
    function updateScoreDisplays() {
        console.log('[TierFix] Updating displays - Score:', window.gameScore, 'Tier:', window.gameTier);
        
        // Update gallery view
        const finalScoreGallery = document.querySelector('.go-score#final-score');
        if (finalScoreGallery) {
            finalScoreGallery.textContent = window.gameScore;
        }
        
        const tierUnlockedGallery = document.querySelector('.go-tier#tier-unlocked');
        if (tierUnlockedGallery) {
            tierUnlockedGallery.textContent = window.gameTier;
            // Update tier colors
            tierUnlockedGallery.style.color = getTierColor(window.gameTier);
            tierUnlockedGallery.style.borderColor = getTierColor(window.gameTier);
        }
        
        // Update compact view
        const finalScoreCompact = document.querySelector('.game-over-content #final-score');
        if (finalScoreCompact) {
            finalScoreCompact.textContent = window.gameScore;
        }
        
        const tierUnlockedCompact = document.querySelector('.game-over-content #tier-unlocked');
        if (tierUnlockedCompact) {
            tierUnlockedCompact.textContent = window.gameTier;
            tierUnlockedCompact.style.color = getTierColor(window.gameTier);
        }
        
        // Show/hide twitter verification based on tier
        const twitterVerify = document.getElementById('twitter-verify');
        const unlockTierBtn = document.getElementById('unlock-tier');
        
        if (window.gameTier !== 'NO TIER') {
            if (twitterVerify) {
                twitterVerify.style.display = 'block';
            }
            // Check if already verified
            if (localStorage.getItem('twitterVerified') === 'true') {
                if (unlockTierBtn) {
                    unlockTierBtn.style.display = 'block';
                }
            }
        } else {
            if (twitterVerify) {
                twitterVerify.style.display = 'none';
            }
            if (unlockTierBtn) {
                unlockTierBtn.style.display = 'none';
            }
        }
        
        // Update allocation message
        updateAllocationMessage();
    }
    
    // Get tier color
    function getTierColor(tier) {
        switch(tier) {
            case 'GOLD TIER': return '#FFD700';
            case 'SILVER TIER': return '#C0C0C0';
            case 'BRONZE TIER': return '#CD7F32';
            default: return '#FFFF00';
        }
    }
    
    // Update allocation message
    function updateAllocationMessage() {
        const allocMsg = document.getElementById('allocation-message');
        if (!allocMsg) return;
        
        let message = '';
        switch(window.gameTier) {
            case 'GOLD TIER':
                message = '🥇 GOLD TIER - Maximum 10 batches unlocked!';
                break;
            case 'SILVER TIER':
                message = '🥈 SILVER TIER - Maximum 8 batches unlocked!';
                break;
            case 'BRONZE TIER':
                message = '🏆 BRONZE TIER - Maximum 5 batches unlocked!';
                break;
            default:
                message = 'Score 11+ points to unlock purchase tiers!';
        }
        
        allocMsg.textContent = message;
        allocMsg.style.display = 'block';
    }
    
    // Fix 2: Controls Toggle Button
    function hideControlsToggle() {
        const controlsToggle = document.getElementById('controls-toggle');
        if (controlsToggle) {
            controlsToggle.style.display = 'none !important';
            // Add inline style to override any other styles
            controlsToggle.setAttribute('style', 'display: none !important;');
        }
    }
    
    // Fix 3: Restart Issues
    function fixRestartIssues() {
        const playAgainBtn = document.getElementById('play-again');
        if (!playAgainBtn) return;
        
        // Store original handler
        const originalHandler = playAgainBtn.onclick;
        
        playAgainBtn.onclick = function(e) {
            console.log('[TierFix] Play Again clicked, resetting game state');
            
            // Reset scores
            window.gameScore = 0;
            window.gameTier = 'NO TIER';
            
            // Hide controls toggle
            hideControlsToggle();
            
            // Clear any game timers
            const highestId = setTimeout(';');
            for (let i = 0; i < highestId; i++) {
                clearTimeout(i);
                clearInterval(i);
            }
            
            // Reset game flags
            if (window.gameInstance) {
                window.gameInstance.isRunning = false;
                window.gameInstance.gameEnded = false;
            }
            
            // Clear stored twitter verification for fresh game
            // localStorage.removeItem('twitterVerified');
            
            // Call original handler or reload
            if (originalHandler) {
                originalHandler.call(this, e);
            } else {
                location.reload();
            }
        };
    }
    
    // Initialize fixes
    function init() {
        console.log('[TierFix] Initializing all fixes');
        
        fixTierDisplay();
        hideControlsToggle();
        fixRestartIssues();
        
        // Re-hide controls toggle periodically (in case something shows it)
        setInterval(hideControlsToggle, 1000);
        
        // Update displays when game over screen becomes visible
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.id === 'game-over' && 
                    mutation.target.style.display !== 'none') {
                    updateScoreDisplays();
                }
            });
        });
        
        const gameOver = document.getElementById('game-over');
        if (gameOver) {
            observer.observe(gameOver, {
                attributes: true,
                attributeFilter: ['style']
            });
        }
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        window.SafeEvents.on(document, 'DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also initialize when game scripts load
    window.addEventListener('load', init);
    
})();