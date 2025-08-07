/**
 * Batch Controls Mobile Centering Fix
 * Ensures Number of Batches controls are perfectly centered on mobile
 */

(function() {
    'use strict';
    
    // Add optimized styles for batch controls
    function addBatchStyles() {
        const style = document.createElement('style');
        style.id = 'batch-mobile-center-fix';
        style.textContent = `
            /* Override existing batch selector for better mobile centering */
            @media (max-width: 768px) {
                /* Center the entire form group */
                .form-group:has(.batch-selector) {
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    width: 100% !important;
                }

                /* Label above controls */
                .form-label {
                    text-align: center !important;
                    width: 100% !important;
                    margin-bottom: 20px !important;
                }

                /* Batch selector container */
                .batch-selector {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 25px !important;
                    margin: 15px auto !important;
                    padding: 20px 30px !important;
                    background: rgba(255, 255, 255, 0.05) !important;
                    border: 2px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 12px !important;
                    width: auto !important;
                    max-width: 90% !important;
                    box-sizing: border-box !important;
                }

                /* Batch buttons - ensure equal size and alignment */
                .batch-btn {
                    width: 50px !important;
                    height: 50px !important;
                    min-width: 50px !important;
                    min-height: 50px !important;
                    border-radius: 8px !important;
                    border: 2px solid var(--yellow) !important;
                    background: rgba(255, 255, 0, 0.1) !important;
                    color: var(--yellow) !important;
                    font-size: 28px !important;
                    font-weight: 700 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    flex-shrink: 0 !important;
                    padding: 0 !important;
                    line-height: 1 !important;
                    text-align: center !important;
                }

                .batch-btn:active {
                    transform: scale(0.9) !important;
                    background: var(--yellow) !important;
                    color: #000 !important;
                }

                /* Batch count display */
                .batch-count {
                    font-size: 36px !important;
                    font-weight: 700 !important;
                    color: var(--yellow) !important;
                    min-width: 80px !important;
                    text-align: center !important;
                    user-select: none !important;
                    line-height: 1 !important;
                    padding: 0 10px !important;
                }

                /* Maximum allowed text */
                .batch-selector + p {
                    text-align: center !important;
                    width: 100% !important;
                    margin-top: 15px !important;
                    font-size: 0.9rem !important;
                }
            }

            /* Small phones (iPhone SE, etc.) */
            @media (max-width: 375px) {
                .batch-selector {
                    gap: 20px !important;
                    padding: 15px 20px !important;
                    max-width: 95% !important;
                }

                .batch-btn {
                    width: 44px !important;
                    height: 44px !important;
                    min-width: 44px !important;
                    min-height: 44px !important;
                    font-size: 24px !important;
                }

                .batch-count {
                    font-size: 32px !important;
                    min-width: 70px !important;
                }
            }

            /* Very small phones */
            @media (max-width: 320px) {
                .batch-selector {
                    gap: 15px !important;
                    padding: 12px 15px !important;
                }

                .batch-btn {
                    width: 40px !important;
                    height: 40px !important;
                    min-width: 40px !important;
                    min-height: 40px !important;
                    font-size: 22px !important;
                }

                .batch-count {
                    font-size: 28px !important;
                    min-width: 60px !important;
                    padding: 0 5px !important;
                }
            }

            /* Ensure proper alignment in landscape mode */
            @media (orientation: landscape) and (max-height: 500px) {
                .batch-selector {
                    margin: 10px auto !important;
                    padding: 10px 20px !important;
                }

                .batch-btn {
                    width: 40px !important;
                    height: 40px !important;
                    min-width: 40px !important;
                    min-height: 40px !important;
                }

                .batch-count {
                    font-size: 28px !important;
                }
            }

            /* Fix button text alignment */
            .batch-btn::before {
                content: '' !important;
                display: inline-block !important;
                height: 100% !important;
                vertical-align: middle !important;
            }

            /* Ensure minus sign is centered */
            #decreaseBatch {
                text-indent: 0 !important;
                letter-spacing: 0 !important;
            }

            /* Ensure plus sign is centered */
            #increaseBatch {
                text-indent: 0 !important;
                letter-spacing: 0 !important;
            }
        `;
        
        document.head.appendChild(style);
    }

    // Fix button content positioning
    function fixButtonContent() {
        const decreaseBtn = document.getElementById('decreaseBatch');
        const increaseBtn = document.getElementById('increaseBatch');
        
        if (decreaseBtn) {
            // Ensure minus sign is properly centered
            decreaseBtn.style.textAlign = 'center';
            decreaseBtn.style.lineHeight = '1';
            if (decreaseBtn.textContent.trim() !== '−') {
                decreaseBtn.textContent = '−'; // Use proper minus sign
            }
        }
        
        if (increaseBtn) {
            // Ensure plus sign is properly centered
            increaseBtn.style.textAlign = 'center';
            increaseBtn.style.lineHeight = '1';
            if (increaseBtn.textContent.trim() !== '+') {
                increaseBtn.textContent = '+';
            }
        }
    }

    // Initialize
    function init() {
        addBatchStyles();
        
        // Fix content when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fixButtonContent);
        } else {
            fixButtonContent();
        }
        
        // Also fix on any dynamic updates
        const observer = new MutationObserver(() => {
            fixButtonContent();
        });
        
        const batchSelector = document.querySelector('.batch-selector');
        if (batchSelector) {
            observer.observe(batchSelector, {
                childList: true,
                subtree: true
            });
        }
    }

    init();

})();