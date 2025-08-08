/**
 * Comprehensive UI Fix - Addresses all reported issues
 */
(function() {
    'use strict';
    
    console.log('[Comprehensive UI Fix] Initializing all fixes...');
    
    // 1. Fix mint percentage visibility and spacing
    function fixMintPercentage() {
        const progressText = document.getElementById('progressText');
        const progressBar = document.getElementById('progressBar');
        const progressContainer = document.querySelector('.progress-container');
        
        if (progressText) {
            progressText.style.cssText = `
                position: relative !important;
                z-index: 10 !important;
                color: var(--yellow, #FFD700) !important;
                text-shadow: 0 0 10px rgba(0,0,0,0.8) !important;
                font-size: 1.5rem !important;
                font-weight: 700 !important;
                margin-bottom: 30px !important;
                padding-bottom: 5px !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;
            
            // Ensure text content has %
            const text = progressText.textContent.trim();
            if (text && !text.includes('%') && !text.includes('SOLD OUT')) {
                const match = text.match(/(\d+\.?\d*)/);
                if (match) {
                    progressText.textContent = `${match[1]}% SOLD`;
                }
            }
        }
        
        // Add spacing to progress container
        if (progressContainer) {
            progressContainer.style.cssText += `
                margin-top: 15px !important;
                position: relative !important;
            `;
        }
        
        // Ensure progress bar is properly positioned
        if (progressBar) {
            progressBar.style.cssText += `
                position: relative !important;
                display: block !important;
            `;
        }
    }
    
    // 2. Fix mobile game display
    function fixMobileGameDisplay() {
        const gameWrapper = document.getElementById('gameWrapper');
        const gameFrame = document.getElementById('gameFrame');
        
        if (gameWrapper) {
            gameWrapper.style.cssText = `
                position: relative !important;
                width: 100% !important;
                max-width: 100% !important;
                height: 60vh !important;
                min-height: 400px !important;
                background: #000 !important;
                border-radius: 20px !important;
                overflow: hidden !important;
                border: 2px solid rgba(255, 255, 0, 0.3) !important;
            `;
        }
        
        if (gameFrame) {
            gameFrame.style.cssText = `
                width: 100% !important;
                height: 100% !important;
                border: none !important;
                border-radius: 20px !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
            `;
        }
        
        // Fix viewport for mobile
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
    }
    
    // 3. Fix mobile movement button (joystick) colors
    function fixMobileJoystick() {
        // Add styles for yellow joystick
        const style = document.createElement('style');
        style.id = 'joystick-yellow-fix';
        style.innerHTML = `
            /* Yellow joystick styling */
            #joystick-container,
            .joystick-container {
                background: rgba(255, 215, 0, 0.2) !important;
                border: 3px solid #FFD700 !important;
            }
            
            #joystick-handle,
            .joystick-handle,
            #joystick-container::after,
            .joystick-container::after {
                background: #B8860B !important; /* Dark goldenrod */
                border: 2px solid #FFD700 !important;
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.5) !important;
            }
            
            /* Touch controls container */
            #touch-controls,
            .touch-controls {
                z-index: 1000 !important;
            }
            
            /* Jump button matching style */
            #jump-button,
            .jump-button {
                background: rgba(255, 215, 0, 0.3) !important;
                border: 3px solid #FFD700 !important;
                color: #FFD700 !important;
                font-weight: 700 !important;
            }
            
            #jump-button:active,
            .jump-button:active {
                background: #FFD700 !important;
                color: #000 !important;
            }
        `;
        
        // Remove old style if exists
        const oldStyle = document.getElementById('joystick-yellow-fix');
        if (oldStyle) oldStyle.remove();
        
        document.head.appendChild(style);
    }
    
    // 4. Fix exit game button styling
    function fixExitGameButton() {
        const style = document.createElement('style');
        style.id = 'exit-button-fix';
        style.innerHTML = `
            /* Exit button yellow styling */
            .go-btn[onclick*="location.href"],
            .go-btn[onclick*="exitGame"],
            .go-btn:contains("EXIT"),
            button[onclick*="location.href='/'"] {
                background: var(--yellow, #FFD700) !important;
                color: #000000 !important;
                border: 3px solid var(--yellow, #FFD700) !important;
                font-weight: 700 !important;
            }
            
            .go-btn[onclick*="location.href"]:hover,
            .go-btn[onclick*="exitGame"]:hover,
            button[onclick*="location.href='/'"]:hover {
                background: #FFFFFF !important;
                color: #000000 !important;
                border-color: #FFFFFF !important;
                transform: translateY(-3px) !important;
                box-shadow: 0 10px 30px rgba(255, 255, 255, 0.5) !important;
            }
        `;
        
        // Remove old style if exists
        const oldStyle = document.getElementById('exit-button-fix');
        if (oldStyle) oldStyle.remove();
        
        document.head.appendChild(style);
        
        // Also directly fix exit buttons
        setTimeout(() => {
            const exitButtons = document.querySelectorAll('.go-btn[onclick*="location.href"], button[onclick*="location.href"]');
            exitButtons.forEach(btn => {
                if (btn.textContent.toLowerCase().includes('exit')) {
                    btn.style.background = 'var(--yellow, #FFD700)';
                    btn.style.color = '#000000';
                    btn.style.border = '3px solid var(--yellow, #FFD700)';
                    btn.style.fontWeight = '700';
                }
            });
        }, 100);
    }
    
    // 5. Optimize QR scanner loading
    function optimizeQRScanner() {
        // Preload QR scanner library
        const preload = document.createElement('link');
        preload.rel = 'preload';
        preload.as = 'script';
        preload.href = 'js/html5-qrcode.min.js';
        document.head.appendChild(preload);
        
        // Pre-initialize scanner on page load
        if (window.Html5Qrcode || window.Html5QrcodeScanner) {
            console.log('[Comprehensive UI Fix] Pre-initializing QR scanner');
            
            // Create a hidden scanner instance to speed up loading
            try {
                if (!window.preloadedScanner) {
                    window.preloadedScanner = new Html5Qrcode("qrReaderDiv");
                }
            } catch (e) {
                console.log('[Comprehensive UI Fix] Scanner pre-init failed, will retry on demand');
            }
        }
        
        // Also fix scan button to show loading state
        const scanBtn = document.getElementById('scanQRBtn');
        if (scanBtn) {
            const originalClick = scanBtn.onclick;
            // Store original button HTML
            const originalButtonHTML = scanBtn.innerHTML;
            
            scanBtn.onclick = function(e) {
                scanBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⟳</span> Loading Scanner...';
                scanBtn.disabled = true;
                
                setTimeout(() => {
                    // Restore original button content (with SVG icon)
                    scanBtn.innerHTML = originalButtonHTML;
                    scanBtn.disabled = false;
                }, 500);
                
                if (originalClick) originalClick.call(this, e);
            };
        }
    }
    
    // 6. Add spinning animation
    function addSpinAnimation() {
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 7. Apply all fixes
    function applyAllFixes() {
        fixMintPercentage();
        fixMobileGameDisplay();
        fixMobileJoystick();
        fixExitGameButton();
        optimizeQRScanner();
        addSpinAnimation();
        
        console.log('[Comprehensive UI Fix] All fixes applied');
    }
    
    // Run immediately
    applyAllFixes();
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAllFixes);
    }
    
    // Run again after delays
    setTimeout(applyAllFixes, 100);
    setTimeout(applyAllFixes, 500);
    setTimeout(applyAllFixes, 1000);
    
    // Monitor for game over screen
    const gameOverObserver = new MutationObserver(() => {
        const gameOver = document.getElementById('game-over');
        if (gameOver && gameOver.style.display !== 'none') {
            fixExitGameButton();
        }
    });
    
    if (document.body) {
        gameOverObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
    }
    
})();