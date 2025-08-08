// This file requires memory-safe-events.js to be loaded first
// Perfect 10/10 Integration Script - Combines all improvements

document.this.DOMContentLoadedHandler = () => {
    
    // ===== 1. ACCESSIBILITY ENHANCEMENTS =====
    
    // Add skip navigation link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
        position: absolute;
        top: -100px;
        left: -100px;
        background: var(--yellow);
        color: var(--black);
        padding: 8px 16px;
        text-decoration: none;
        font-weight: 600;
        z-index: 10000;
        border-radius: 0 0 12px 0;
        transition: all 0.3s ease;
        opacity: 0;
        pointer-events: none;
    `;
    window.SafeEvents.on(skipLink, 'focus', () => {
        skipLink.style.top = '0';
        skipLink.style.left = '0';
        skipLink.style.opacity = '1';
        skipLink.style.pointerEvents = 'auto';
    });
    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-100px';
        skipLink.style.left = '-100px';
        skipLink.style.opacity = '0';
        skipLink.style.pointerEvents = 'none';
    });
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Set main content ID
    const mainContent = document.querySelector('.stats-section');
    if (mainContent && !mainContent.id) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('tabindex', '-1');
    }
    
    // ===== 2. SCROLL INDICATORS REMOVED =====
    // Tier cards fit perfectly on mobile - no scroll needed
    
    // ===== 3. SECURITY TRUST SIGNALS =====
    
    const purchaseForm = document.querySelector('.purchase-form');
    if (purchaseForm && !document.querySelector('.security-badge')) {
        const trustBadge = document.createElement('div');
        trustBadge.className = 'security-badge';
        trustBadge.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            background: rgba(255, 255, 0, 0.1);
            border: 1px solid rgba(255, 255, 0, 0.3);
            border-radius: 24px;
            font-size: 0.875rem;
            color: rgba(255, 255, 255, 0.95);
            margin: 0 auto 25px auto;
            width: fit-content;
            max-width: 90%;
        `;
        trustBadge.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: var(--yellow);">
                <path d="M12 2L4 7v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V7l-8-5z"/>
            </svg>
            <span>Secured by Bitcoin Lightning Network</span>
        `;
        purchaseForm.insertBefore(trustBadge, purchaseForm.firstChild);
    }
    
    // ===== 4. LOADING STATES =====
    
    // Add loading class styles
    const loadingStyles = document.createElement('style');
    loadingStyles.textContent = `
        .loading {
            position: relative;
            pointer-events: none;
            opacity: 0.7;
        }
        .loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 2px solid var(--yellow);
            border-right-color: transparent;
            border-radius: 50%;
            animation: spinner 0.75s linear infinite;
        }
        @keyframes spinner {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(loadingStyles);
    
    // ===== 5. ENHANCED FORM VALIDATION =====
    
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Prevent iOS zoom
            if (input.type !== 'submit') {
                input.style.fontSize = '16px';
            }
            
            // Add validation
            input.this.blurHandler = () => {
                if (input.value && !input.checkValidity()) {
                    input.classList.add('error');
                    input.setAttribute('aria-invalid', 'true');
                    
                    // Create error message
                    let errorEl = input.parentElement.querySelector('.error-message');
                    if (!errorEl) {
                        errorEl = document.createElement('div');
                        errorEl.className = 'error-message';
                        errorEl.style.cssText = 'color: #ff6666; font-size: 0.875rem; margin-top: 4px;';
                        input.parentElement.appendChild(errorEl);
                    };
                    errorEl.textContent = input.validationMessage;
                } else {
                    input.classList.remove('error');
                    input.setAttribute('aria-invalid', 'false');
                    const errorEl = input.parentElement.querySelector('.error-message');
                    if (errorEl) errorEl.remove();
                }
            });
        });
    });
    
    // ===== 6. PERFORMANCE OPTIMIZATIONS =====
    
    // Consolidate resize handlers
    const resizeHandlers = [];
    let resizeTimer;
    
    window.this.resizeHandler = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resizeHandlers.forEach(handler => handler());
        };
        addEventListener('resize', this.resizeHandler), 250);
    });
    
    // Update numbers on resize
    resizeHandlers.push(() => {
        if (window.updateAllNumbers) {
            window.updateAllNumbers();
        }
    });
    
    // ===== 7. LAZY LOADING FOR GAME =====
    
    const gameSection = document.querySelector('.game-section');
    const gameFrame = document.querySelector('.game-frame');
    
    if (gameSection && gameFrame && !gameFrame.querySelector('iframe')) {
        // Add loading placeholder
        gameFrame.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: rgba(255, 255, 255, 0.8);
                font-size: 1.2rem;
            ">
                <div style="text-align: center;">
                    <div style="margin-bottom: 20px;">🎮</div>
                    <div>Game will load when you scroll here</div>
                </div>
            </div>
        `;
        
        // Intersection observer for lazy loading
        if ('IntersectionObserver' in window) {
            const gameObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        gameFrame.innerHTML = '<iframe src="/game.html" style="width: 100%; height: 100%; border: none;" title="LIGHTCAT Game" allowfullscreen></iframe>';
                        gameObserver.unobserve(entry.target);
                        
                        // Announce to screen readers
                        const announcement = document.createElement('div');
                        announcement.setAttribute('role', 'status');
                        announcement.setAttribute('aria-live', 'polite');
                        announcement.className = 'sr-only';
                        announcement.textContent = 'Game loaded and ready to play';
                        document.body.appendChild(announcement);
                        setTimeout(() => announcement.remove(), 1000);
                    }
                });
            }, {
                rootMargin: '100px 0px',
                threshold: 0.01
            });
            
            gameObserver.observe(gameSection);
        }
    }
    
    // ===== 8. ENHANCED MOBILE EXPERIENCE =====
    
    if (window.innerWidth <= 768) {
        // Better touch feedback
        document.querySelectorAll('button, a, .clickable').forEach(el => {
            el.style.transition = 'transform 0.1s ease';
            window.SafeEvents.on(el, 'touchstart', () => {
                el.style.transform = 'scale(0.95)';
            });
            el.addEventListener('touchend', () => {
                el.style.transform = 'scale(1)';
            });
        });
        
        // Improved stat cards
        document.querySelectorAll('.stat-card').forEach(card => {
            card.style.transition = 'all 0.3s ease';
        });
    }
    
    // ===== 9. ANNOUNCE PAGE READY =====
    
    setTimeout(() => {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = 'LIGHTCAT page fully loaded and interactive';
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }, 1500);
    
    console.log('✅ Perfect 10/10 improvements loaded successfully!');
});