/**
 * UI Improvements for LIGHTCAT
 * 1. Better positioning for Number of Batches controls
 * 2. LIVE MINT STATUS - white by default, yellow on hover/click
 */

(function() {
    'use strict';
    
    // Add styles for UI improvements
    function addUIStyles() {
        const style = document.createElement('style');
        style.id = 'ui-improvements-styles';
        style.textContent = `
            /* Improved Batch Controls Positioning */
            .batch-selector {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                margin: 20px auto;
                padding: 15px;
                background: rgba(255, 255, 255, 0.05);
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                max-width: 280px;
                transition: all 0.3s ease;
            }
            
            .batch-selector:hover {
                border-color: rgba(255, 215, 0, 0.3);
                background: rgba(255, 215, 0, 0.05);
            }
            
            .batch-btn {
                width: 48px;
                height: 48px;
                font-size: 24px;
                font-weight: 700;
                background: var(--yellow);
                color: #000;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                user-select: none;
            }
            
            .batch-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
            }
            
            .batch-btn:active {
                transform: scale(0.95);
            }
            
            .batch-count {
                font-size: 32px;
                font-weight: 700;
                color: var(--yellow);
                min-width: 60px;
                text-align: center;
                user-select: none;
            }
            
            /* Maximum allowed text styling */
            .batch-info {
                text-align: center;
                color: rgba(255, 255, 255, 0.7);
                margin-top: 15px;
                font-size: 0.9rem;
                letter-spacing: 0.5px;
            }
            
            .batch-info .max-value {
                color: var(--yellow);
                font-weight: 600;
                font-size: 1rem;
            }
            
            /* LIVE MINT STATUS - White by default, yellow on hover/click */
            #stats .section-title {
                color: #ffffff !important;
                transition: color 0.3s ease, transform 0.3s ease;
                cursor: pointer;
                position: relative;
            }
            
            #stats .section-title:hover {
                color: var(--yellow) !important;
                transform: translateY(-3px);
            }
            
            #stats .section-title:active {
                color: var(--yellow) !important;
                transform: translateY(-1px);
            }
            
            /* Remove the yellow underline by default */
            #stats .section-title::after {
                background: #ffffff;
                opacity: 0.3;
                transition: all 0.3s ease;
            }
            
            #stats .section-title:hover::after {
                background: var(--yellow);
                opacity: 1;
                width: 250px;
            }
            
            /* UNLOCK PURCHASE TIERS - White by default, yellow on hover/click */
            #game .section-title {
                color: #ffffff !important;
                transition: color 0.3s ease, transform 0.3s ease;
                cursor: pointer;
                position: relative;
            }
            
            #game .section-title:hover {
                color: var(--yellow) !important;
                transform: translateY(-3px);
            }
            
            #game .section-title:active {
                color: var(--yellow) !important;
                transform: translateY(-1px);
            }
            
            /* Remove the yellow underline by default */
            #game .section-title::after {
                background: #ffffff;
                opacity: 0.3;
                transition: all 0.3s ease;
            }
            
            #game .section-title:hover::after {
                background: var(--yellow);
                opacity: 1;
                width: 300px;
            }
            
            /* PURCHASE TOKENS - White by default, yellow on hover/click */
            #purchase .section-title {
                color: #ffffff !important;
                transition: color 0.3s ease, transform 0.3s ease;
                cursor: pointer;
                position: relative;
            }
            
            #purchase .section-title:hover {
                color: var(--yellow) !important;
                transform: translateY(-3px);
            }
            
            #purchase .section-title:active {
                color: var(--yellow) !important;
                transform: translateY(-1px);
            }
            
            /* Remove the yellow underline by default */
            #purchase .section-title::after {
                background: #ffffff;
                opacity: 0.3;
                transition: all 0.3s ease;
            }
            
            #purchase .section-title:hover::after {
                background: var(--yellow);
                opacity: 1;
                width: 250px;
            }
            
            /* Mobile responsive improvements */
            @media (max-width: 768px) {
                .batch-selector {
                    gap: 15px;
                    padding: 12px;
                    max-width: 260px;
                }
                
                .batch-btn {
                    width: 44px;
                    height: 44px;
                    font-size: 20px;
                }
                
                .batch-count {
                    font-size: 28px;
                    min-width: 50px;
                }
                
                .batch-info {
                    font-size: 0.85rem;
                }
                
                #stats .section-title,
                #game .section-title,
                #purchase .section-title {
                    font-size: 1.8rem !important;
                }
            }
            
            /* Ensure proper touch targets on mobile */
            @media (hover: none) {
                #stats .section-title:active,
                #game .section-title:active,
                #purchase .section-title:active {
                    color: var(--yellow) !important;
                }
                
                .batch-btn:active {
                    transform: scale(0.95);
                    background: rgba(255, 215, 0, 0.9);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Improve the batch controls structure
    function improveBatchControls() {
        const batchSelector = document.querySelector('.batch-selector');
        const maxBatchesElement = document.getElementById('maxBatches');
        
        if (batchSelector && maxBatchesElement) {
            // Get the parent paragraph
            const parentP = maxBatchesElement.closest('p');
            
            if (parentP) {
                // Update the structure for better styling
                parentP.className = 'batch-info';
                parentP.innerHTML = `Maximum allowed: <span id="maxBatches" class="max-value">${maxBatchesElement.textContent}</span> batches`;
            }
        }
    }
    
    // Add interactive feedback to section titles
    function enhanceSectionTitles() {
        // Handle LIVE MINT STATUS, UNLOCK PURCHASE TIERS, and PURCHASE TOKENS
        const sectionTitles = document.querySelectorAll('#stats .section-title, #game .section-title, #purchase .section-title');
        
        sectionTitles.forEach(title => {
            // Add click effect
            title.addEventListener('click', function() {
                this.style.color = 'var(--yellow)';
                setTimeout(() => {
                    if (!this.matches(':hover')) {
                        this.style.color = '';
                    }
                }, 300);
            });
            
            // Ensure proper hover states
            title.addEventListener('mouseenter', function() {
                this.style.color = 'var(--yellow)';
            });
            
            title.addEventListener('mouseleave', function() {
                this.style.color = '';
            });
        });
    }
    
    // Initialize UI improvements
    function init() {
        addUIStyles();
        improveBatchControls();
        enhanceSectionTitles();
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();