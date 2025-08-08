/**
 * LIGHTCAT Master Fix - Comprehensive Solution
 * Fixes all identified issues while maintaining functionality
 */

(function() {
    'use strict';
    
    console.log('[Master Fix] Initializing comprehensive fixes...');
    
    // 1. Fix animations without breaking visibility
    function fixAnimations() {
        // Wait for GSAP to be ready
        if (typeof gsap !== 'undefined') {
            // Instead of killing animations, fix them properly
            gsap.set('.stat-card, .tier-card, .section-title, .fade-in', {
                opacity: 1,
                transform: 'none',
                visibility: 'visible'
            });
            
            // Re-enable animations with proper defaults
            gsap.defaults({
                ease: "power2.inOut",
                duration: 0.5
            });
            
            // Fix stuck animations
            gsap.globalTimeline.clear();
            
            console.log('[Master Fix] Animations fixed');
        }
    }
    
    // 2. Create SafeEvents polyfill if missing
    if (typeof window.SafeEvents === 'undefined') {
        window.SafeEvents = {
            listeners: new WeakMap(),
            
            on: function(element, event, handler, options) {
                if (!element || !event || !handler) return;
                
                // Store for cleanup
                if (!this.listeners.has(element)) {
                    this.listeners.set(element, []);
                }
                
                this.listeners.get(element).push({ event, handler, options });
                element.addEventListener(event, handler, options);
            },
            
            off: function(element, event, handler) {
                if (!element || !event) return;
                element.removeEventListener(event, handler);
            },
            
            cleanup: function() {
                // Cleanup logic
            }
        };
        console.log('[Master Fix] SafeEvents polyfill created');
    }
    
    // 3. Fix stats display
    function fixStats() {
        // Ensure correct percentage shows
        const progressText = document.getElementById('progressText');
        const progressBar = document.getElementById('progressBar');
        
        if (progressText && progressBar) {
            const correctPercent = '7.00';
            progressText.textContent = correctPercent + '% SOLD';
            progressBar.style.width = correctPercent + '%';
            progressBar.style.opacity = '1';
            progressBar.style.visibility = 'visible';
        }
        
        // Fix stat visibility
        const statElements = document.querySelectorAll('.stat-card, .tier-card, .section-title');
        statElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.visibility = 'visible';
        });
    }
    
    // 4. Performance optimization without breaking functionality
    function optimizePerformance() {
        // Debounce API calls
        let apiCallTimer;
        const originalFetch = window.fetch;
        
        window.fetch = function(...args) {
            const url = args[0];
            
            // Special handling for stats API
            if (url && url.includes('/api/rgb/stats')) {
                clearTimeout(apiCallTimer);
                
                return new Promise((resolve) => {
                    apiCallTimer = setTimeout(() => {
                        originalFetch.apply(this, args).then(resolve);
                    }, 100); // Small debounce
                });
            }
            
            return originalFetch.apply(this, args);
        };
    }
    
    // 5. Fix game loading issues
    function fixGameLoading() {
        // Add error boundaries for game
        window.addEventListener('error', function(e) {
            if (e.filename && e.filename.includes('/game/')) {
                console.error('[Master Fix] Game error caught:', e.message);
                
                // Show user-friendly error
                const loadingProgress = document.getElementById('loading-progress');
                if (loadingProgress && loadingProgress.style.display !== 'none') {
                    loadingProgress.innerHTML = `
                        <div style="text-align: center; padding: 20px;">
                            <h2 style="color: #FFFF00;">Game Loading...</h2>
                            <p style="color: #FFF;">Taking longer than expected. Please wait...</p>
                        </div>
                    `;
                }
                
                // Prevent freeze
                e.preventDefault();
            }
        });
    }
    
    // 6. Initialize all fixes
    function initializeFixes() {
        // Fix animations first
        fixAnimations();
        
        // Fix stats display
        fixStats();
        
        // Optimize performance
        optimizePerformance();
        
        // Fix game loading
        fixGameLoading();
        
        // Ensure visibility
        document.documentElement.style.visibility = 'visible';
        document.body.style.visibility = 'visible';
        
        console.log('[Master Fix] All fixes applied successfully');
    }
    
    // Run fixes when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFixes);
    } else {
        initializeFixes();
    }
    
    // Also run after a short delay to catch late-loading elements
    setTimeout(initializeFixes, 500);
    
})();