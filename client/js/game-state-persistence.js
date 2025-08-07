/**
 * Game State Persistence for LIGHTCAT
 * Saves and restores game progress
 * Following CLAUDE.md state management requirements
 */

(function() {
    'use strict';
    
    window.GameStatePersistence = {
        STORAGE_KEY: 'lightcat_game_state',
        AUTO_SAVE_INTERVAL: 5000, // 5 seconds
        autoSaveTimer: null,
        
        init() {
            this.setupAutoSave();
            this.restoreState();
            this.setupEventHandlers();
        },
        
        getState() {
            if (!window.gameInstance) return null;
            
            return {
                score: window.gameInstance.score || 0,
                timeRemaining: window.gameInstance.timeRemaining || 30,
                isPlaying: window.gameInstance.isPlaying || false,
                playerPosition: this.getPlayerPosition(),
                collectedItems: this.getCollectedItems(),
                timestamp: Date.now(),
                version: '1.0'
            };
        },
        
        getPlayerPosition() {
            if (window.gameInstance && window.gameInstance.player && window.gameInstance.player.mesh) {
                const pos = window.gameInstance.player.mesh.position;
                return { x: pos.x, y: pos.y, z: pos.z };
            }
            return { x: 0, y: 5, z: 0 };
        },
        
        getCollectedItems() {
            if (window.gameInstance && window.gameInstance.collectibles) {
                return window.gameInstance.collectibles
                    .filter(item => item.collected)
                    .map(item => item.id || item.uuid);
            }
            return [];
        },
        
        saveState() {
            try {
                const state = this.getState();
                if (!state || !state.isPlaying) return;
                
                // Don't save if game is over
                if (state.timeRemaining <= 0) return;
                
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
                console.log('[GameState] State saved');
            } catch (error) {
                console.error('[GameState] Failed to save state:', error);
            }
        },
        
        restoreState() {
            try {
                const saved = localStorage.getItem(this.STORAGE_KEY);
                if (!saved) return;
                
                const state = JSON.parse(saved);
                
                // Check if state is recent (within 30 minutes)
                if (Date.now() - state.timestamp > 1800000) {
                    this.clearState();
                    return;
                }
                
                // Wait for game to initialize
                const checkInterval = setInterval(() => {
                    if (window.gameInstance && window.gameInstance.initialized) {
                        clearInterval(checkInterval);
                        this.applyState(state);
                    }
                }, 100);
                
                // Timeout after 5 seconds
                setTimeout(() => clearInterval(checkInterval), 5000);
                
            } catch (error) {
                console.error('[GameState] Failed to restore state:', error);
                this.clearState();
            }
        },
        
        applyState(state) {
            if (!window.gameInstance || !state) return;
            
            // Show restoration notification
            this.showRestorationPrompt(state, (restore) => {
                if (restore) {
                    // Restore game state
                    window.gameInstance.score = state.score;
                    window.gameInstance.timeRemaining = state.timeRemaining;
                    
                    // Restore player position
                    if (window.gameInstance.player && window.gameInstance.player.mesh && state.playerPosition) {
                        window.gameInstance.player.mesh.position.set(
                            state.playerPosition.x,
                            state.playerPosition.y,
                            state.playerPosition.z
                        );
                    }
                    
                    // Restore collected items
                    if (state.collectedItems && window.gameInstance.collectibles) {
                        state.collectedItems.forEach(itemId => {
                            const item = window.gameInstance.collectibles.find(
                                c => c.id === itemId || c.uuid === itemId
                            );
                            if (item) {
                                item.collected = true;
                                if (item.mesh) {
                                    item.mesh.visible = false;
                                }
                            }
                        });
                    }
                    
                    // Resume game
                    if (window.gameInstance.start) {
                        window.gameInstance.start();
                    }
                    
                    console.log('[GameState] State restored successfully');
                } else {
                    this.clearState();
                }
            });
        },
        
        showRestorationPrompt(state, callback) {
            const prompt = document.createElement('div');
            prompt.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #000;
                border: 3px solid #fff600;
                padding: 30px;
                border-radius: 15px;
                z-index: 100002;
                text-align: center;
                max-width: 400px;
            `;
            
            prompt.innerHTML = `
                <h3 style="color: #fff600; margin-bottom: 20px;">Continue Previous Game?</h3>
                <p style="color: #fff; margin-bottom: 20px;">
                    You have a saved game with score ${state.score} and ${Math.round(state.timeRemaining)} seconds remaining.
                </p>
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <button id="restore-yes" style="
                        background: #fff600;
                        color: #000;
                        border: none;
                        padding: 10px 20px;
                        font-weight: bold;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Continue</button>
                    <button id="restore-no" style="
                        background: transparent;
                        color: #fff600;
                        border: 2px solid #fff600;
                        padding: 10px 20px;
                        font-weight: bold;
                        border-radius: 5px;
                        cursor: pointer;
                    ">New Game</button>
                </div>
            `;
            
            document.body.appendChild(prompt);
            
            document.getElementById('restore-yes').addEventListener('click', () => {
                prompt.remove();
                callback(true);
            });
            
            document.getElementById('restore-no').addEventListener('click', () => {
                prompt.remove();
                callback(false);
            });
        },
        
        setupAutoSave() {
            // Clear any existing timer
            if (this.autoSaveTimer) {
                clearInterval(this.autoSaveTimer);
            }
            
            // Set up auto-save
            this.autoSaveTimer = setInterval(() => {
                if (window.gameInstance && window.gameInstance.isPlaying) {
                    this.saveState();
                }
            }, this.AUTO_SAVE_INTERVAL);
        },
        
        setupEventHandlers() {
            // Save on important events
            window.addEventListener('blur', () => {
                if (window.gameInstance && window.gameInstance.isPlaying) {
                    this.saveState();
                }
            });
            
            // Save before page unload
            window.addEventListener('beforeunload', () => {
                if (window.gameInstance && window.gameInstance.isPlaying) {
                    this.saveState();
                }
            });
            
            // Clear state on game over
            if (window.gameInstance) {
                const originalEndGame = window.gameInstance.endGame;
                window.gameInstance.endGame = function(...args) {
                    GameStatePersistence.clearState();
                    if (originalEndGame) {
                        return originalEndGame.apply(this, args);
                    }
                };
            }
        },
        
        clearState() {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('[GameState] State cleared');
        },
        
        // Manual save/load for debugging
        manualSave() {
            this.saveState();
            return 'Game state saved';
        },
        
        manualLoad() {
            this.restoreState();
            return 'Attempting to restore game state';
        }
    };
    
    // Initialize when game loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.GameStatePersistence.init();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            window.GameStatePersistence.init();
        }, 1000);
    }
    
    // Expose for debugging
    window.saveGameState = () => window.GameStatePersistence.manualSave();
    window.loadGameState = () => window.GameStatePersistence.manualLoad();
    window.clearGameState = () => window.GameStatePersistence.clearState();
    
})();