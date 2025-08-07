/**
 * Game Force Loading - Forces loading screen to stay visible and blocks yellow flash
 */
(function() {
    'use strict';
    
    console.log('[Game Force Loading] Forcing proper loading screen...');
    
    // 1. Force black background EVERYWHERE immediately
    document.documentElement.style.cssText = 'background: #000 !important;';
    document.body.style.cssText = 'background: #000 !important;';
    
    // 2. Inject blocking styles IMMEDIATELY
    const blockingStyle = document.createElement('style');
    blockingStyle.innerHTML = `
        /* Force black background on EVERYTHING */
        html, body, div, canvas, section {
            background-color: #000 !important;
            background: #000 !important;
        }
        
        /* Force loading screen to stay visible */
        #loading-progress {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: #000 !important;
            z-index: 999999 !important;
            pointer-events: all !important;
        }
        
        /* Block EVERYTHING else */
        #game-container,
        #game-canvas,
        #game-ui,
        #start-screen,
        .mobile-controls,
        .game-stats {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }
        
        /* Ensure no yellow anywhere */
        .progress-fill {
            background: #444 !important;
        }
        
        * {
            --primary-yellow: #666 !important;
            --yellow: #666 !important;
        }
    `;
    document.documentElement.appendChild(blockingStyle);
    
    // 3. Track the real loading state
    let minimumLoadTime = 2000; // Force at least 2 seconds of loading screen
    let startTime = Date.now();
    let allowHide = false;
    
    // 4. Block ALL attempts to hide loading screen until ready
    const interceptHiding = () => {
        const loadingScreen = document.getElementById('loading-progress');
        if (!loadingScreen) return;
        
        // Store original methods
        const originalRemove = loadingScreen.remove;
        const originalRemoveChild = loadingScreen.parentNode ? loadingScreen.parentNode.removeChild : null;
        
        // Override remove methods
        loadingScreen.remove = function() {
            if (allowHide) {
                originalRemove.call(this);
            }
        };
        
        if (loadingScreen.parentNode) {
            loadingScreen.parentNode.removeChild = function(child) {
                if (child === loadingScreen && !allowHide) {
                    return child;
                }
                return originalRemoveChild ? originalRemoveChild.call(this, child) : child;
            };
        }
        
        // Override style property
        Object.defineProperty(loadingScreen, 'style', {
            get: function() {
                return this._styleProxy || (this._styleProxy = new Proxy(this.getAttribute('style') || {}, {
                    set: function(target, property, value) {
                        if (!allowHide && (property === 'display' || property === 'visibility' || property === 'opacity')) {
                            // Block hiding attempts
                            if (property === 'display' && value === 'none') return true;
                            if (property === 'visibility' && value === 'hidden') return true;
                            if (property === 'opacity' && value === '0') return true;
                        }
                        target[property] = value;
                        return true;
                    }
                }));
            },
            set: function(value) {
                // Block direct style assignment
                if (!allowHide) return;
                this.setAttribute('style', value);
            }
        });
    };
    
    // 5. Apply interception as soon as DOM is ready
    if (document.getElementById('loading-progress')) {
        interceptHiding();
    } else {
        const observer = new MutationObserver((mutations, obs) => {
            if (document.getElementById('loading-progress')) {
                interceptHiding();
                obs.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // 6. Controlled reveal when actually ready
    const revealGame = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < minimumLoadTime) {
            setTimeout(revealGame, minimumLoadTime - elapsed);
            return;
        }
        
        console.log('[Game Force Loading] Revealing game...');
        
        allowHide = true;
        
        // Remove blocking styles
        blockingStyle.remove();
        
        // Create smooth transition
        const transitionStyle = document.createElement('style');
        transitionStyle.innerHTML = `
            #loading-progress {
                transition: opacity 0.5s ease-out !important;
            }
            #game-container {
                display: block !important;
                opacity: 0 !important;
                visibility: visible !important;
                transition: opacity 0.5s ease-in !important;
            }
            #game-canvas, #game-ui {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
        `;
        document.head.appendChild(transitionStyle);
        
        // Start transition
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-progress');
            const gameContainer = document.getElementById('game-container');
            
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
            }
            
            if (gameContainer) {
                gameContainer.style.opacity = '1';
            }
            
            // Remove loading screen after fade
            setTimeout(() => {
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
                transitionStyle.remove();
            }, 600);
        }, 100);
    };
    
    // 7. Monitor for game ready (but enforce minimum time)
    let checkCount = 0;
    const checkReady = setInterval(() => {
        checkCount++;
        
        const hasGame = window.gameInstance || window.game;
        const isReady = document.getElementById('loading-text')?.textContent.includes('Ready');
        
        if ((hasGame || isReady || checkCount > 100) && Date.now() - startTime >= minimumLoadTime) {
            clearInterval(checkReady);
            revealGame();
        }
    }, 50);
    
    console.log('[Game Force Loading] Loading screen enforced');
})();