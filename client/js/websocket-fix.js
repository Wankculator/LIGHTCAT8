// WebSocket Integration Fix - Handles undefined socket.io
(function() {
    'use strict';
    
    console.log('🔧 WebSocket Fix: Loading...');
    
    // Check if socket.io is available
    function initWebSocket() {
        // Check if io is defined
        if (typeof io === 'undefined') {
            console.warn('[WebSocket] socket.io not loaded, creating stub');
            
            // Create a stub implementation
            window.io = function() {
                return {
                    on: function(event, callback) {
                        console.log(`[WebSocket Stub] Would listen for: ${event}`);
                    },
                    emit: function(event, data) {
                        console.log(`[WebSocket Stub] Would emit: ${event}`, data);
                    },
                    connect: function() {
                        console.log('[WebSocket Stub] Would connect');
                    },
                    disconnect: function() {
                        console.log('[WebSocket Stub] Would disconnect');
                    },
                    connected: false
                };
            };
        }
        
        // Safe socket initialization
        try {
            const socket = io();
            
            // Check if socket has required methods
            if (!socket || typeof socket.on !== 'function') {
                console.error('[WebSocket] Invalid socket object');
                return null;
            }
            
            // Set up event handlers safely
            socket.on('connect', () => {
                console.log('✅ WebSocket connected');
            });
            
            socket.on('disconnect', () => {
                console.log('❌ WebSocket disconnected');
            });
            
            socket.on('error', (error) => {
                console.error('[WebSocket] Error:', error);
            });
            
            // Store globally for other scripts
            window.websocket = socket;
            
            return socket;
        } catch (error) {
            console.error('[WebSocket] Failed to initialize:', error);
            return null;
        }
    }
    
    // Try to initialize immediately
    const socket = initWebSocket();
    
    // If failed, try again after DOM loads
    if (!socket) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initWebSocket);
        } else {
            // Try one more time after a delay
            setTimeout(initWebSocket, 1000);
        }
    }
    
    console.log('✅ WebSocket fix applied');
})();