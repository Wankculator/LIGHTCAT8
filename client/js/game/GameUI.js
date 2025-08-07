export class GameUI {
    constructor(game) {
        this.game = game;
        this.tiers = {
            bronze: { min: 11, tokens: 5000 },
            silver: { min: 18, tokens: 15000 },
            gold: { min: 28, tokens: 50000 }
        };
        this.unlockedTiers = new Set();
    }

    showGameOver(score) {
        const gameOverEl = document.getElementById('game-over');
        const finalScoreEl = document.getElementById('final-score');
        const tierUnlockedEl = document.getElementById('tier-unlocked');
        const twitterVerifyEl = document.getElementById('twitter-verify');
        const unlockTierBtn = document.getElementById('unlock-tier');
        const verifyBtn = document.getElementById('verify-follow');
        const verifySuccessEl = document.getElementById('verify-success');
        const allocationMessageEl = document.getElementById('allocation-message');
        
        // Reset verify button state
        verifyBtn.textContent = 'Verify Follow';
        verifyBtn.disabled = false;
        verifyBtn.style.opacity = '1';
        verifyBtn.style.borderColor = 'var(--primary-yellow)';
        verifyBtn.style.color = 'var(--primary-yellow)';
        // Show unlock button immediately if tier is unlocked
        unlockTierBtn.style.display = 'none';
        verifySuccessEl.style.display = 'none';
        allocationMessageEl.style.display = 'none';
        
        // Show final score
        finalScoreEl.textContent = score;
        
        // Determine unlocked tier
        const tier = this.getTierForScore(score);
        
        if (tier) {
            tierUnlockedEl.textContent = `${tier.toUpperCase()} TIER UNLOCKED!`;
            tierUnlockedEl.style.color = this.getTierColor(tier);
            
            // Show Twitter verification
            twitterVerifyEl.style.display = 'block';
            
            // Show CLAIM button immediately when tier is unlocked
            unlockTierBtn.style.display = 'block';
            
            // Store tier data
            this.unlockedTier = tier;
            
            // Remove no-tier state class if it exists
            document.getElementById('game-over').classList.remove('no-tier-state');
            
            // Set allocation message based on tier - UPDATED LIMITS
            const tierBatches = {
                bronze: 10,   // Updated from 3
                silver: 20,   // Updated from 5
                gold: 30      // Updated from 10
            };
            const tierTokens = {
                bronze: '7,000',    // 10 batches * 700 tokens
                silver: '14,000',   // 20 batches * 700 tokens
                gold: '21,000'      // 30 batches * 700 tokens
            };
            
            allocationMessageEl.className = 'benefits-box tier-unlocked-message';
            allocationMessageEl.innerHTML = `
                <div class="congratulations-content">
                    <h3 class="congrats-header">🎉 CONGRATULATIONS! 🎉</h3>
                    <p class="tier-announcement" style="color: ${this.getTierColor(tier)};">
                        You've unlocked <strong>${tier.toUpperCase()} TIER</strong>!
                    </p>
                    <div class="reward-details">
                        <p class="reward-item">
                            <span class="reward-label">Max Batches:</span>
                            <span class="reward-value">${tierBatches[tier]}</span>
                        </p>
                        <p class="reward-item">
                            <span class="reward-label">Token Allocation:</span>
                            <span class="reward-value">${tierTokens[tier]} LIGHTCAT</span>
                        </p>
                        <p class="reward-item">
                            <span class="reward-label">Price per Batch:</span>
                            <span class="reward-value">2,000 sats</span>
                        </p>
                    </div>
                    <p class="next-step">Complete Twitter verification to claim your allocation!</p>
                </div>
            `;
        } else {
            tierUnlockedEl.textContent = 'NO TIER';
            tierUnlockedEl.style.color = '#888';
            twitterVerifyEl.style.display = 'none';
            
            // Show professional retry message
            allocationMessageEl.className = 'benefits-box no-tier-message';
            allocationMessageEl.innerHTML = `
                <div class="try-again-content">
                    <h3 class="try-again-header">TRY AGAIN!</h3>
                    
                    <div class="score-requirements">
                        <p>
                            <span class="tier-label bronze">🏆 BRONZE TIER</span>
                            <span>11+ Points</span>
                        </p>
                        <p>
                            <span class="tier-label silver">🥈 SILVER TIER</span>
                            <span>18+ Points</span>
                        </p>
                        <p>
                            <span class="tier-label gold">🥇 GOLD TIER</span>
                            <span>28+ Points</span>
                        </p>
                    </div>
                    
                    <div class="game-tips">
                        <h4>Pro Tips:</h4>
                        <ul>
                            <li>Collect lightning quickly for combo multipliers</li>
                            <li>Use double jump to reach high platforms</li>
                            <li>Chain collections without touching ground</li>
                        </ul>
                    </div>
                </div>
            `;
            allocationMessageEl.style.display = 'block';
            
            // Add no-tier state class for enhanced styling
            document.getElementById('game-over').classList.add('no-tier-state');
        }
        
        // Show allocation message
        allocationMessageEl.style.display = 'block';
        allocationMessageEl.style.visibility = 'visible';
        
        // Show game over screen IMMEDIATELY - no fade
        gameOverEl.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 99999 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
        `;
        
        // Hide game UI
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            gameUI.style.display = 'none';
        }
        
        // Update game over title based on tier
        this.updateGameOverTitle();
        
        console.log('[GameUI] Game over screen FORCED visible for score:', score);
            
        // Reset gallery to first page
        if (window.resetGameOverGallery) {
            window.resetGameOverGallery();
        }
        
        // Clear previous follow tracking
        localStorage.removeItem('twitterFollowClicked');
        localStorage.removeItem('followClickTime');
    }

    getTierForScore(score) {
        if (score >= this.tiers.gold.min) return 'gold';
        if (score >= this.tiers.silver.min) return 'silver';
        if (score >= this.tiers.bronze.min) return 'bronze';
        return null;
    }
    
    updateGameOverTitle() {
        const titleElement = document.querySelector('.go-title');
        const tierElement = document.getElementById('tier-unlocked');
        
        if (titleElement && tierElement) {
            const tierText = tierElement.textContent.toUpperCase();
            if (tierText.includes('BRONZE') || tierText.includes('SILVER') || tierText.includes('GOLD')) {
                titleElement.textContent = 'CONGRATULATIONS!';
            } else {
                titleElement.textContent = 'THANK YOU FOR PLAYING!';
            }
        }
    }
    
    getTierColor(tier) {
        const colors = {
            bronze: '#CD7F32',
            silver: '#C0C0C0',
            gold: '#FFD700'
        };
        return colors[tier] || '#FFFF00';
    }

    updateScore(score) {
        document.getElementById('score').textContent = score;
        
        // Add pulse effect
        const scoreEl = document.getElementById('score');
        scoreEl.style.transform = 'scale(1.2)';
        this.timeout2 = setTimeout(() => {
            scoreEl.style.transform = 'scale(1)';
        }, 200);
        
        // Check for tier unlocks
        this.checkTierUnlock(score);
    }

    updateTimer(time) {
        document.getElementById('timer').textContent = time;
        
        // Add warning color when time is low
        const timerEl = document.getElementById('timer');
        if (time <= 10) {
            timerEl.style.color = '#ff5252';
            if (time <= 5) {
                timerEl.style.animation = 'pulse 0.5s infinite';
            }
        }
    }

    showMessage(message, duration = 3000) {
        const messageEl = document.createElement('div');
        messageEl.className = 'game-message';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: var(--primary);
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            animation: fadeInOut ${duration}ms ease-out;
        `;
        
        document.body.appendChild(messageEl);
        
        this.timeout3 = setTimeout(() => {
            messageEl.remove();
        }, duration);
    }

    showCombo(combo) {
        if (combo > 1) {
            this.showMessage(`${combo}x COMBO!`, 1000);
        }
    }
    
    checkTierUnlock(score) {
        // Check each tier
        for (const [tierName, tierData] of Object.entries(this.tiers)) {
            if (score >= tierData.min && !this.unlockedTiers.has(tierName)) {
                this.unlockedTiers.add(tierName);
                this.showTierNotification(tierName);
            }
        }
    }
    
    showTierNotification(tier) {
        const notification = document.getElementById('tier-notification');
        const notificationText = document.getElementById('tier-notification-text');
        
        if (!notification || !notificationText) return;
        
        // Set tier text and color
        notificationText.textContent = `${tier.toUpperCase()} TIER UNLOCKED!`;
        notification.style.borderColor = this.getTierColor(tier);
        notificationText.style.color = this.getTierColor(tier);
        
        // Show notification
        notification.style.display = 'block';
        this.timeout4 = setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide after 2 seconds
        this.timeout5 = setTimeout(() => {
            notification.classList.remove('show');
            this.timeout6 = setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 2000);
    }

    showTierProgress(score) {
        let nextTier = null;
        let progress = 0;
        
        for (const [tierName, tierData] of Object.entries(this.tiers)) {
            if (score < tierData.min) {
                nextTier = tierName;
                progress = (score / tierData.min) * 100;
                break;
            }
        }
        
        if (nextTier) {
            const progressEl = document.createElement('div');
            progressEl.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                padding: 10px 20px;
                border-radius: 20px;
                border: 1px solid var(--primary);
                z-index: 100;
            `;
            
            progressEl.innerHTML = `
                <div style="text-align: center; margin-bottom: 5px;">
                    Next: ${nextTier.toUpperCase()} TIER
                </div>
                <div style="width: 200px; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden;">
                    <div style="width: ${progress}%; height: 100%; background: var(--primary); transition: width 0.3s;"></div>
                </div>
            `;
            
            document.body.appendChild(progressEl);
            
            this.timeout7 = setTimeout(() => {
                progressEl.remove();
            }, 3000);
        }
    }
}