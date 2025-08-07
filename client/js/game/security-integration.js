// This file requires memory-safe-events.js to be loaded first
/**
 * Security Integration for LIGHTCAT Game
 * This file shows how to integrate the GameSecurity module with your game
 */

// Example integration for ProGame.js or main game file

// 1. Load GameSecurity at game start
async function initializeSecureGame() {
    // Start a new game session on the server
    const sessionStarted = await GameSecurity.startSession();
    
    if (!sessionStarted) {
        console.error('Failed to start secure game session');
        alert('Unable to start game. Please try again.');
        return false;
    }
    
    console.log('Secure game session started');
    return true;
}

// 2. Record checkpoints during gameplay
function recordGameProgress(game) {
    // Call this every 10-15 seconds during gameplay
    setInterval(async () => {
        if (game.isPlaying) {
            await GameSecurity.recordCheckpoint(game.score, {
                position: {
                    x: game.character.position.x,
                    y: game.character.position.y,
                    z: game.character.position.z
                },
                collectibles: game.score,
                timeRemaining: game.timeRemaining
            });
        }
    }, 10000);
}

// 3. Complete session when game ends
async function endSecureGame(finalScore) {
    const result = await GameSecurity.completeSession(finalScore);
    
    if (result.success) {
        console.log('Game completed successfully!');
        console.log(`Score: ${result.score}, Tier: ${result.tier || 'None'}`);
        
        // Update UI with tier information
        updatePurchaseUI(result);
        
        return result;
    } else {
        console.error('Failed to validate game:', result.error);
        alert('Game validation failed. Please try again.');
        return null;
    }
}

// 4. Update purchase form with validated tier
function updatePurchaseUI(gameResult) {
    if (!gameResult || !gameResult.tier) {
        // No tier unlocked
        document.getElementById('purchase-section').style.display = 'none';
        document.getElementById('game-locked-message').style.display = 'block';
        return;
    }
    
    // Show purchase form with unlocked tier
    document.getElementById('purchase-section').style.display = 'block';
    document.getElementById('game-locked-message').style.display = 'none';
    
    // Update tier display
    document.getElementById('unlocked-tier').textContent = gameResult.tier.toUpperCase();
    document.getElementById('max-batches').textContent = getMaxBatchesForTier(gameResult.tier);
    
    // Store session ID for purchase
    window.currentGameSession = {
        sessionId: gameResult.sessionId,
        tier: gameResult.tier,
        score: gameResult.score
    };
}

// 5. Include session info when creating invoice
async function createSecureInvoice(rgbInvoice, batchCount, email) {
    // Get current game session info
    const tierInfo = GameSecurity.getTierInfo();
    
    if (!tierInfo || !tierInfo.tier) {
        alert('Please play the game first to unlock purchasing!');
        return null;
    }
    
    // Make sure batch count is within tier limits
    const maxBatches = getMaxBatchesForTier(tierInfo.tier);
    if (batchCount > maxBatches) {
        alert(`Maximum ${maxBatches} batches allowed for ${tierInfo.tier} tier`);
        return null;
    }
    
    // Create invoice with game validation
    const response = await fetch('/api/rgb/invoice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            rgbInvoice,
            batchCount,
            email,
            tier: tierInfo.tier,
            gameSessionId: tierInfo.sessionId
        })
    });
    
    const result = await response.json();
    
    if (!result.success) {
        alert(result.error || 'Failed to create invoice');
        return null;
    }
    
    return result;
}

// 6. Helper function for tier limits
function getMaxBatchesForTier(tier) {
    const limits = {
        bronze: 5,
        silver: 8,
        gold: 10
    };
    return limits[tier] || 0;
}

// 7. Integration with existing game
function integrateWithGame(game) {
    // Override start method
    const originalStart = game.start.bind(game);
    game.start = async function() {
        const sessionStarted = await initializeSecureGame();
        if (sessionStarted) {
            originalStart();
            recordGameProgress(game);
        }
    };
    
    // Override end method
    const originalEnd = game.endGame.bind(game);
    game.endGame = async function() {
        originalEnd();
        await endSecureGame(game.score);
    };
}

// 8. Example usage in main game file:
/*
// In ProGame.js or your main game file:

import './GameSecurity.js';

class ProGame {
    constructor() {
        // ... existing code ...
        
        // Integrate security
        integrateWithGame(this);
    
    
    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Clean up all event listeners for this component
        window.SafeEvents.cleanup();
    }
}
}

// Or in your game initialization:
window.SafeEvents.on(window, 'DOMContentLoaded', () => {
    const game = new ProGame();
    integrateWithGame(game);
});
*/

// Export for use
window.GameSecurityIntegration = {
    initializeSecureGame,
    recordGameProgress,
    endSecureGame,
    updatePurchaseUI,
    createSecureInvoice,
    integrateWithGame
};