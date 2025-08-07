// This file requires memory-safe-events.js to be loaded first
// Mobile Debug Helper
(function() {
    'use strict';
    
    const debugLog = [];
    
    function log(message) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const logEntry = `[${timestamp}] ${message}`;
        debugLog.push(logEntry);
        console.log(logEntry);
        
        // Also show in UI
        const debugDiv = document.getElementById('mobile-debug');
        if (debugDiv) {
            debugDiv.innerHTML = debugLog.slice(-5).join('<br>');
        }
    }
    
    // Create debug UI
    const debugUI = document.createElement('div');
    debugUI.id = 'mobile-debug';
    debugUI.style.cssText = `
        position: fixed;
        bottom: 150px;
        left: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: #0f0;
        font-family: monospace;
        font-size: 10px;
        padding: 10px;
        border: 1px solid #0f0;
        z-index: 9999;
        max-height: 100px;
        overflow-y: auto;
        display: none;
    `;
    document.body.appendChild(debugUI);
    
    // Keep debug UI hidden on production
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        // debugUI.style.display = 'block';  // Disabled for production
        debugUI.style.display = 'none';
        log('Mobile device detected');
    }
    
    // Monitor key events
    window.SafeEvents.on(window, 'DOMContentLoaded', () => {
        log('DOM loaded');
        
        // Check for game canvas
        const canvas = document.getElementById('game-canvas');
        log(canvas ? 'Canvas found' : 'Canvas NOT found');
        
        // Check for loading screen
        const loading = document.getElementById('loading-progress');
        log('Loading screen: ' + (loading ? loading.style.display : 'not found'));
    });
    
    // Monitor module loading
    window.addEventListener('error', (e) => {
        if (e.message) {
            log('Error: ' + e.message.substring(0, 50));
        }
    });
    
    // Check for game instance periodically
    let checkCount = 0;
    const checkInterval = setInterval(() => {
        checkCount++;
        
        if (window.game) {
            log('Game instance created');
            
            if (window.game.proGame) {
                log('ProGame initialized');
                clearInterval(checkInterval);
            }
        }
        
        if (checkCount > 50) { // 5 seconds
            log('Game init timeout');
            clearInterval(checkInterval);
        }
    }, 100);
    
    // Export for console access
    window.mobileDebugLog = debugLog;
})();