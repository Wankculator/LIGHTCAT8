// Safe minimal game loader
import * as THREE from 'three';
import { ProGame } from './ProGame-fixed.js';
import { GameUI } from './GameUI.js';
import { SoundManager } from './SoundManager.js';

class LightcatGame {
    constructor() {
        this.proGame = null;
        this.ui = null;
        this.sound = null;
        
        this.gameState = 'loading';
        this.score = 0;
        this.timeRemaining = 30;
        
        this.init();
    }
    
    cleanup() {
        // Clean up event listeners
        if (this.ui) this.ui.cleanup();
        if (this.proGame) this.proGame.cleanup();
        if (this.sound) this.sound.cleanup();
    }

    async init() {
        try {
            // Update loading progress
            this.updateProgress(10, 'Checking device compatibility...');
            
            // Get canvas
            const canvas = document.getElementById('game-canvas');
            if (!canvas) {
                throw new Error('Game canvas not found');
            }
            
            this.updateProgress(20, 'Creating game world...');
            
            // Initialize professional game
            this.proGame = new ProGame(canvas);
            
            this.updateProgress(50, 'Loading sounds...');
            
            // Setup sound
            this.sound = new SoundManager();
            await this.sound.loadSounds();
            
            this.updateProgress(70, 'Setting up UI...');
            
            // Setup UI
            this.ui = new GameUI();
            
            this.updateProgress(90, 'Finalizing...');
            
            // Setup game callbacks
            this.setupCallbacks();
            
            // Hide loading screen
            this.updateProgress(100, 'Ready!');
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('start-screen').style.display = 'flex';
                
                // Setup start button
                const startBtn = document.getElementById('start-game');
                if (startBtn) {
                    startBtn.addEventListener('click', () => this.startGame());
                }
            }, 500);
            
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    updateProgress(percent, status) {
        const progressFill = document.getElementById('progress-fill');
        const loadingStatus = document.getElementById('loading-status');
        
        if (progressFill) {
            progressFill.style.width = percent + '%';
        }
        
        if (loadingStatus) {
            loadingStatus.textContent = status;
        }
    }

    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <h1 class="loading-title">Error</h1>
                    <p style="color: #ff6666;">${message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #fff600; color: #000; border: none; border-radius: 5px; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }

    setupCallbacks() {
        // Score update callback
        this.proGame.onScoreUpdate = (score) => {
            this.score = score;
            this.ui.updateScore(score);
        };
        
        // Time update callback
        this.proGame.onTimeUpdate = (time) => {
            this.timeRemaining = time;
            this.ui.updateTimer(time);
        };
        
        // Game over callback
        this.proGame.onGameOver = (score) => {
            this.endGame(score);
        };
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.timeRemaining = 30;
        
        // Hide start screen
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-ui').style.display = 'flex';
        
        // Start the game
        this.proGame.startGame();
        
        // Play background music
        if (this.sound) {
            this.sound.playBackgroundMusic();
        }
    }

    endGame(finalScore) {
        this.gameState = 'gameover';
        
        // Stop game
        this.proGame.stopGame();
        
        // Stop music
        if (this.sound) {
            this.sound.stopBackgroundMusic();
        }
        
        // Determine tier
        let tier = null;
        if (finalScore >= 25) tier = 'gold';
        else if (finalScore >= 15) tier = 'silver';
        else if (finalScore >= 11) tier = 'bronze';
        
        // Show game over screen
        this.showGameOver(finalScore, tier);
    }

    showGameOver(score, tier) {
        const gameOver = document.getElementById('game-over');
        if (!gameOver) return;
        
        // Basic game over content
        gameOver.innerHTML = `
            <div style="padding: 40px; text-align: center; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #fff600; font-size: 3rem; margin-bottom: 20px;">GAME OVER</h1>
                <p style="color: #fff; font-size: 2rem; margin-bottom: 30px;">Final Score: ${score}</p>
                
                ${tier ? `
                    <div style="background: rgba(255, 246, 0, 0.1); border: 2px solid #fff600; border-radius: 10px; padding: 20px; margin-bottom: 30px;">
                        <h2 style="color: #fff600; font-size: 1.5rem; margin-bottom: 10px;">🎉 Tier Unlocked: ${tier.toUpperCase()}</h2>
                        <p style="color: #fff;">You can now purchase up to ${tier === 'gold' ? '30' : tier === 'silver' ? '20' : '10'} batches!</p>
                    </div>
                ` : `
                    <p style="color: #ff6666; margin-bottom: 20px;">Score 11+ to unlock purchasing tiers!</p>
                `}
                
                <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
                    <button id="play-again" style="background: #fff600; color: #000; padding: 15px 30px; border: none; border-radius: 5px; font-size: 1.2rem; font-weight: bold; cursor: pointer;">
                        PLAY AGAIN
                    </button>
                    ${tier ? `
                        <button id="unlock-tier" style="background: transparent; color: #fff600; padding: 15px 30px; border: 2px solid #fff600; border-radius: 5px; font-size: 1.2rem; font-weight: bold; cursor: pointer;">
                            CLAIM TIER
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        gameOver.style.display = 'block';
        document.getElementById('game-ui').style.display = 'none';
        
        // Setup buttons
        const playAgain = document.getElementById('play-again');
        if (playAgain) {
            playAgain.addEventListener('click', () => {
                gameOver.style.display = 'none';
                this.startGame();
            });
        }
        
        const unlockTier = document.getElementById('unlock-tier');
        if (unlockTier && tier) {
            unlockTier.addEventListener('click', () => {
                // Store tier info
                localStorage.setItem('unlockedTier', tier);
                localStorage.setItem('tierJustUnlocked', 'true');
                
                // Redirect to purchase page
                try {
                    if (window.top && window.top !== window) {
                        window.top.location.href = '/#purchase?tier=' + tier;
                    } else {
                        window.location.href = '/#purchase?tier=' + tier;
                    }
                } catch (e) {
                    window.open('/#purchase?tier=' + tier, '_blank');
                }
            });
        }
    }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.gameInstance = new LightcatGame();
    });
} else {
    window.gameInstance = new LightcatGame();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.gameInstance) {
        window.gameInstance.cleanup();
    }
});