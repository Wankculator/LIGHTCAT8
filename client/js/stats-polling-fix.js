// Stats Polling Fix - Exponential backoff and graceful degradation
(function() {
    'use strict';
    
    console.log('📊 Stats Polling Fix: Loading...');
    
    let statsTimer = null;
    let attempts = 0;
    let isPaused = false;
    const MAX_ATTEMPTS = 6;
    const BASE_INTERVAL = 15000; // 15 seconds
    const MAX_BACKOFF = 60000; // 1 minute max
    
    // Cache for stats
    let lastStats = null;
    let lastStatsTime = 0;
    
    async function fetchStats(signal) {
        try {
            const response = await fetch('/api/rgb/stats', {
                method: 'GET',
                signal: signal,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            // Even on 404, try to parse response
            if (!response.ok && response.status !== 404) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            // Try to get JSON even from 404 responses
            try {
                const data = await response.json();
                return data;
            } catch (jsonError) {
                // Return default stats if JSON parse fails
                return {
                    remainingBatches: 0,
                    tier: 'unknown',
                    mintedToday: 0,
                    health: 'degraded'
                };
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('[Stats] Request aborted');
                throw error;
            }
            console.warn('[Stats] Fetch error:', error.message);
            throw error;
        }
    }
    
    function updateStatsUI(stats) {
        // Update various UI elements
        const elements = {
            'stats': (el, data) => {
                el.textContent = `Remaining: ${data.remainingBatches || 0} | Tier: ${data.tier || 'unknown'}`;
            },
            'remainingBatches': (el, data) => {
                el.textContent = data.remainingBatches || '0';
            },
            'currentTier': (el, data) => {
                el.textContent = data.tier || 'unknown';
            },
            'mintedToday': (el, data) => {
                el.textContent = data.mintedToday || '0';
            }
        };
        
        for (const [id, updater] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                try {
                    updater(element, stats);
                } catch (e) {
                    console.warn(`[Stats] Failed to update ${id}:`, e);
                }
            }
        }
        
        // Fire custom event for other components
        document.dispatchEvent(new CustomEvent('stats:updated', { detail: stats }));
    }
    
    function showStatsError() {
        const statsEl = document.getElementById('stats');
        if (statsEl) {
            statsEl.textContent = 'Stats temporarily unavailable';
            statsEl.style.opacity = '0.5';
        }
        
        // Fire error event
        document.dispatchEvent(new CustomEvent('stats:error'));
    }
    
    let controller = null;
    
    async function pollStats() {
        if (isPaused) {
            console.log('[Stats] Polling is paused');
            return;
        }
        
        // Abort previous request if still pending
        if (controller) {
            controller.abort();
        }
        
        controller = new AbortController();
        
        try {
            const stats = await fetchStats(controller.signal);
            
            // Success - reset attempts
            attempts = 0;
            lastStats = stats;
            lastStatsTime = Date.now();
            
            updateStatsUI(stats);
            console.log('[Stats] Updated:', stats);
            
            // Schedule next poll at normal interval
            scheduleNextPoll(BASE_INTERVAL);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                return; // Don't retry aborted requests
            }
            
            attempts++;
            
            // Use cached stats if available and recent
            if (lastStats && (Date.now() - lastStatsTime < 300000)) { // 5 minutes
                console.log('[Stats] Using cached stats');
                updateStatsUI(lastStats);
            } else {
                showStatsError();
            }
            
            if (attempts >= MAX_ATTEMPTS) {
                console.warn('[Stats] Max attempts reached, pausing polling');
                isPaused = true;
                showStatsError();
                
                // Try to resume after 5 minutes
                setTimeout(() => {
                    console.log('[Stats] Attempting to resume polling');
                    isPaused = false;
                    attempts = 0;
                    pollStats();
                }, 300000);
                
                return;
            }
            
            // Calculate backoff
            const backoff = Math.min(
                BASE_INTERVAL * Math.pow(2, attempts - 1),
                MAX_BACKOFF
            );
            
            console.warn(`[Stats] Retry in ${backoff/1000}s (attempt ${attempts}/${MAX_ATTEMPTS})`);
            scheduleNextPoll(backoff);
        }
    }
    
    function scheduleNextPoll(delay) {
        if (statsTimer) {
            clearTimeout(statsTimer);
        }
        statsTimer = setTimeout(pollStats, delay);
    }
    
    function startStatsPolling() {
        console.log('[Stats] Starting polling');
        stopStatsPolling();
        attempts = 0;
        isPaused = false;
        pollStats();
    }
    
    function stopStatsPolling() {
        console.log('[Stats] Stopping polling');
        if (statsTimer) {
            clearTimeout(statsTimer);
            statsTimer = null;
        }
        if (controller) {
            controller.abort();
            controller = null;
        }
    }
    
    function pauseStatsPolling() {
        console.log('[Stats] Pausing polling');
        isPaused = true;
    }
    
    function resumeStatsPolling() {
        console.log('[Stats] Resuming polling');
        isPaused = false;
        attempts = 0;
        pollStats();
    }
    
    // Visibility change handling
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pauseStatsPolling();
        } else {
            resumeStatsPolling();
        }
    });
    
    // Start polling when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startStatsPolling);
    } else {
        startStatsPolling();
    }
    
    // Cleanup on unload
    window.addEventListener('beforeunload', stopStatsPolling);
    
    // Expose API
    window.statsPolling = {
        start: startStatsPolling,
        stop: stopStatsPolling,
        pause: pauseStatsPolling,
        resume: resumeStatsPolling,
        getLastStats: () => lastStats,
        forceRefresh: () => {
            attempts = 0;
            pollStats();
        }
    };
    
    console.log('✅ Stats polling fix initialized');
})();