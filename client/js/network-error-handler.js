/**
 * Network Error Handler for LIGHTCAT
 * Handles all API failures gracefully
 * Following CLAUDE.md network requirements
 */

(function() {
    'use strict';
    
    window.NetworkErrorHandler = {
        retryQueue: [],
        offlineQueue: [],
        isOnline: navigator.onLine,
        
        init() {
            this.setupInterceptors();
            this.setupOfflineHandling();
            this.setupRetryMechanism();
            this.enhanceFetch();
        },
        
        setupInterceptors() {
            // Store original fetch
            const originalFetch = window.fetch;
            
            // Enhanced fetch with retry and error handling
            window.fetch = async (url, options = {}) => {
                const config = {
                    retries: 3,
                    retryDelay: 1000,
                    timeout: 30000,
                    ...options
                };
                
                // Add timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout);
                
                try {
                    let lastError;
                    
                    for (let i = 0; i <= config.retries; i++) {
                        try {
                            const response = await originalFetch(url, {
                                ...config,
                                signal: controller.signal
                            });
                            
                            clearTimeout(timeoutId);
                            
                            // Handle non-OK responses
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            
                            return response;
                            
                        } catch (error) {
                            lastError = error;
                            
                            // Don't retry on client errors
                            if (error.message.includes('HTTP 4')) {
                                throw error;
                            }
                            
                            // Exponential backoff
                            if (i < config.retries) {
                                await this.delay(config.retryDelay * Math.pow(2, i));
                                console.log(`[Network] Retry ${i + 1}/${config.retries} for ${url}`);
                            }
                        }
                    }
                    
                    throw lastError;
                    
                } catch (error) {
                    clearTimeout(timeoutId);
                    return this.handleNetworkError(error, url, options);
                }
            };
        },
        
        handleNetworkError(error, url, options) {
            console.error('[Network] Request failed:', url, error.message);
            
            // Check if it's a critical endpoint
            const criticalEndpoints = [
                '/api/rgb/invoice',
                '/api/lightning/invoice',
                '/api/game/complete',
                '/api/webhooks'
            ];
            
            const isCritical = criticalEndpoints.some(endpoint => url.includes(endpoint));
            
            if (isCritical) {
                this.showErrorNotification('Connection error. Please check your internet and try again.');
                
                // Queue for retry if offline
                if (!navigator.onLine) {
                    this.offlineQueue.push({ url, options, timestamp: Date.now() });
                }
            }
            
            // Return mock response for non-critical endpoints
            return {
                ok: false,
                status: 0,
                statusText: error.message,
                json: async () => ({ error: error.message }),
                text: async () => error.message
            };
        },
        
        setupOfflineHandling() {
            // Monitor online/offline status
            window.addEventListener('online', () => {
                this.isOnline = true;
                console.log('[Network] Connection restored');
                this.showSuccessNotification('Connection restored!');
                this.processOfflineQueue();
            });
            
            window.addEventListener('offline', () => {
                this.isOnline = false;
                console.log('[Network] Connection lost');
                this.showErrorNotification('No internet connection. Some features may not work.');
            });
        },
        
        processOfflineQueue() {
            while (this.offlineQueue.length > 0) {
                const request = this.offlineQueue.shift();
                
                // Skip if too old (>5 minutes)
                if (Date.now() - request.timestamp > 300000) {
                    continue;
                }
                
                // Retry the request
                fetch(request.url, request.options)
                    .then(response => {
                        console.log('[Network] Offline request completed:', request.url);
                    })
                    .catch(error => {
                        console.error('[Network] Offline request failed:', error);
                    });
            }
        },
        
        setupRetryMechanism() {
            // Periodic retry for failed critical requests
            setInterval(() => {
                if (this.retryQueue.length > 0 && navigator.onLine) {
                    const request = this.retryQueue.shift();
                    if (request && request.retry) {
                        request.retry();
                    }
                }
            }, 5000);
        },
        
        enhanceFetch() {
            // Add convenience methods
            window.fetchJSON = async (url, options = {}) => {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });
                
                if (response.ok) {
                    return response.json();
                }
                
                throw new Error(`Request failed: ${response.statusText}`);
            };
            
            // RGB invoice specific handler
            window.fetchRGBInvoice = async (data) => {
                try {
                    const response = await fetchJSON('/api/rgb/invoice', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    
                    return response;
                    
                } catch (error) {
                    // Show user-friendly error
                    this.showErrorNotification('Failed to create invoice. Please try again.');
                    throw error;
                }
            };
        },
        
        showErrorNotification(message) {
            this.showNotification(message, 'error');
        },
        
        showSuccessNotification(message) {
            this.showNotification(message, 'success');
        },
        
        showNotification(message, type = 'info') {
            // Remove existing notifications
            const existing = document.getElementById('network-notification');
            if (existing) {
                existing.remove();
            }
            
            const notification = document.createElement('div');
            notification.id = 'network-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
                color: white;
                padding: 15px 30px;
                border-radius: 5px;
                font-weight: 500;
                z-index: 100001;
                animation: slideDown 0.3s ease-out;
                max-width: 90%;
                text-align: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                notification.style.animation = 'slideUp 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        },
        
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };
    
    // Initialize
    window.NetworkErrorHandler.init();
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateX(-50%) translateY(0); opacity: 1; }
            to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
})();