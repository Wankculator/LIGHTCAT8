// This file requires memory-safe-events.js to be loaded first
/**
 * Mobile Audio Fix
 * Fixes audio not playing on mobile devices (iOS/Android)
 */
(function() {
    'use strict';
    
    console.log('[AudioFix] Initializing mobile audio fixes');
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let audioUnlocked = false;
    let audioContext = null;
    let pendingAudioElements = [];
    
    // Create or get audio context
    function getAudioContext() {
        if (!audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioContext = new AudioContext();
                console.log('[AudioFix] Audio context created, state:', audioContext.state);
            }
        }
        return audioContext;
    }
    
    // Unlock audio on user interaction
    function unlockAudio() {
        if (audioUnlocked) return;
        
        console.log('[AudioFix] Attempting to unlock audio');
        
        // Resume audio context
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().then(() => {
                console.log('[AudioFix] Audio context resumed');
                audioUnlocked = true;
            }).catch(err => {
                console.error('[AudioFix] Failed to resume audio context:', err);
            });
        }
        
        // Create silent buffer to unlock audio
        if (ctx) {
            const buffer = ctx.createBuffer(1, 1, 22050);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
            source.stop(0);
        }
        
        // Play all pending audio elements
        pendingAudioElements.forEach(audio => {
            playAudioElement(audio);
        });
        pendingAudioElements = [];
        
        // Play any existing audio elements
        const allAudio = document.querySelectorAll('audio');
        allAudio.forEach(audio => {
            if (audio.paused && audio.dataset.shouldPlay === 'true') {
                playAudioElement(audio);
            }
        });
        
        audioUnlocked = true;
        
        // Remove unlock listeners after successful unlock
        window.SafeEvents.off(document, 'touchstart', unlockAudio);
        window.SafeEvents.off(document, 'touchend', unlockAudio);
        window.SafeEvents.off(document, 'click', unlockAudio);
    }
    
    // Safe audio play with mobile handling
    function playAudioElement(audio) {
        if (!audio) return;
        
        // Set volume to ensure it's audible
        audio.volume = audio.dataset.volume || 1.0;
        audio.muted = false;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('[AudioFix] Audio playing:', audio.src);
            }).catch(error => {
                console.warn('[AudioFix] Audio play failed:', error);
                // Store for later attempt
                if (!audioUnlocked && !pendingAudioElements.includes(audio)) {
                    pendingAudioElements.push(audio);
                    audio.dataset.shouldPlay = 'true';
                }
            });
        }
    }
    
    // Override HTMLAudioElement.play() for mobile
    if (isMobile) {
        const originalPlay = HTMLAudioElement.prototype.play;
        HTMLAudioElement.prototype.play = function() {
            console.log('[AudioFix] Audio play intercepted:', this.src);
            
            if (!audioUnlocked) {
                // Store audio element for later
                if (!pendingAudioElements.includes(this)) {
                    pendingAudioElements.push(this);
                    this.dataset.shouldPlay = 'true';
                }
                
                // Try to unlock immediately if possible
                unlockAudio();
                
                // Return rejected promise to match original behavior
                return Promise.reject(new DOMException('Audio not unlocked yet'));
            }
            
            // Call original play method
            return originalPlay.apply(this, arguments);
        };
    }
    
    // Initialize audio fix
    function init() {
        if (!isMobile) {
            console.log('[AudioFix] Not mobile device, skipping fixes');
            return;
        }
        
        console.log('[AudioFix] Setting up mobile audio fixes');
        
        // Add unlock listeners
        window.SafeEvents.on(document, 'touchstart', unlockAudio, { once: true, passive: true });
        window.SafeEvents.on(document, 'touchend', unlockAudio, { once: true, passive: true });
        window.SafeEvents.on(document, 'click', unlockAudio, { once: true });
        
        // Try to unlock on any game interaction
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            window.SafeEvents.on(gameContainer, 'touchstart', unlockAudio, { once: true, passive: true });
        }
        
        // Monitor for new audio elements
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeName === 'AUDIO') {
                        console.log('[AudioFix] New audio element detected');
                        // Preload audio
                        node.load();
                        // If should autoplay, add to pending
                        if (node.autoplay || node.dataset.autoplay === 'true') {
                            if (!audioUnlocked) {
                                pendingAudioElements.push(node);
                                node.dataset.shouldPlay = 'true';
                            } else {
                                playAudioElement(node);
                            }
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Handle existing audio elements
        document.querySelectorAll('audio').forEach(audio => {
            // Preload
            audio.load();
            
            // Enable controls for debugging on mobile
            if (isMobile && window.location.hostname === 'localhost') {
                audio.controls = true;
            }
            
            // If autoplay, add to pending
            if (audio.autoplay || audio.dataset.autoplay === 'true') {
                if (!audioUnlocked) {
                    pendingAudioElements.push(audio);
                    audio.dataset.shouldPlay = 'true';
                }
            }
        });
        
        // Special handling for game sounds
        if (window.gameInstance || window.game) {
            const game = window.gameInstance || window.game;
            
            // Override sound play methods if they exist
            if (game.playSound) {
                const originalPlaySound = game.playSound;
                game.playSound = function(soundName) {
                    if (!audioUnlocked) {
                        console.log('[AudioFix] Sound blocked, waiting for unlock:', soundName);
                        return;
                    }
                    return originalPlaySound.apply(this, arguments);
                };
            }
            
            if (game.audio) {
                // Store original methods
                const audioMethods = ['play', 'playEffect', 'playMusic', 'playSound'];
                audioMethods.forEach(method => {
                    if (game.audio[method]) {
                        const original = game.audio[method];
                        game.audio[method] = function() {
                            if (!audioUnlocked) {
                                console.log('[AudioFix] Audio method blocked:', method);
                                return;
                            }
                            return original.apply(this, arguments);
                        };
                    }
                });
            }
        }
        
        // iOS specific: Handle visibility changes
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            window.SafeEvents.on(document, 'visibilitychange', function() {
                if (!document.hidden && audioUnlocked && audioContext) {
                    // Resume audio context when app returns to foreground
                    if (audioContext.state === 'suspended') {
                        audioContext.resume();
                    }
                }
            });
        }
        
        // Add visual indicator for audio state (debug)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const indicator = document.createElement('div');
            indicator.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;padding:5px 10px;background:red;color:white;font-size:12px;border-radius:3px;';
            indicator.textContent = 'Audio: Locked';
            document.body.appendChild(indicator);
            
            const updateIndicator = () => {
                indicator.textContent = audioUnlocked ? 'Audio: Unlocked' : 'Audio: Locked';
                indicator.style.background = audioUnlocked ? 'green' : 'red';
            };
            
            setInterval(updateIndicator, 100);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        window.SafeEvents.on(document, 'DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also init on window load
    window.addEventListener('load', init);
    
    // Expose unlock function globally for debugging
    window.unlockMobileAudio = unlockAudio;
    window.isMobileAudioUnlocked = () => audioUnlocked;
    
})();