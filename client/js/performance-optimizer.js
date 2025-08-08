// This file requires memory-safe-events.js to be loaded first
/**
 * Performance Optimization System
 * Ensures sub-2s load times and smooth operation
 * LIGHTCAT Performance Excellence
 */

class PerformanceOptimizer {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            interactionTime: 0,
            memoryUsage: 0
        
    
    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Clean up all event listeners for this component
        window.SafeEvents.cleanup();
    }
};
        
        this.observers = new Map();
        this.lazyLoadQueue = new Set();
        this.animationFrameCallbacks = new Map();
        this.deferredScripts = new Set();
        
        // Performance budgets
        this.budgets = {
            loadTime: 2000, // 2 seconds
            firstPaint: 1000, // 1 second
            interactive: 3000, // 3 seconds
            bundle: 500 * 1024, // 500KB
            images: 1024 * 1024 // 1MB
        };

        this.init();
    }

    init() {
        // Monitor performance from the start
        this.measureLoadTime();
        this.setupObservers();
        this.optimizeResources();
        this.enableLazyLoading();
        this.optimizeAnimations();
    }

    /**
     * Measure page load time
     */
    measureLoadTime() {
        // Use Navigation Timing API
        if (window.performance && window.performance.timing) {
            window.SafeEvents.on(window, 'load', () => {
                const timing = window.performance.timing;
                this.metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
                this.metrics.domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
                this.metrics.firstPaint = timing.responseEnd - timing.navigationStart;
                
                // Check against budgets
                this.checkBudgets();
            });
        }

        // Use Performance Observer for more detailed metrics
        if ('PerformanceObserver' in window) {
            // First Contentful Paint
            const paintObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.fcp = entry.startTime;
                    }
                }
            });
            paintObserver.observe({ entryTypes: ['paint'] });

            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        }
    }

    /**
     * Setup performance observers
     */
    setupObservers() {
        // Resource timing
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.trackResource(entry);
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.set('resource', resourceObserver);
        }

        // Long tasks
        if ('PerformanceLongTaskTiming' in window) {
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    console.warn('Long task detected:', entry.duration + 'ms');
                    this.optimizeLongTask(entry);
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.set('longtask', longTaskObserver);
        }
    }

    /**
     * Track resource loading
     * @param {PerformanceEntry} entry - Resource entry
     */
    trackResource(entry) {
        const duration = entry.responseEnd - entry.startTime;
        
        // Warn about slow resources
        if (duration > 1000) {
            console.warn(`Slow resource: ${entry.name} took ${duration}ms`);
        }

        // Track by type
        const type = entry.initiatorType;
        if (!this.metrics.resources) {
            this.metrics.resources = {};
        }
        if (!this.metrics.resources[type]) {
            this.metrics.resources[type] = [];
        }
        this.metrics.resources[type].push({
            name: entry.name,
            duration: duration,
            size: entry.transferSize
        });
    }

    /**
     * Optimize long-running tasks
     * @param {PerformanceEntry} task - Long task entry
     */
    optimizeLongTask(task) {
        // If task is too long, suggest breaking it up
        if (task.duration > 50) {
            console.warn('Consider breaking up this task into smaller chunks');
        }
    }

    /**
     * Optimize resource loading
     */
    optimizeResources() {
        // Preconnect to important domains
        this.preconnect('https://fonts.googleapis.com');
        this.preconnect('https://cdn.litecat.xyz');
        
        // Prefetch critical resources
        this.prefetch('/api/rgb/stats');
        
        // Preload critical assets
        this.preload('/js/game/ProGame.js', 'script');
        this.preload('/css/style.css', 'style');
    }

    /**
     * Preconnect to domain
     * @param {string} url - Domain URL
     */
    preconnect(url) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    }

    /**
     * Prefetch resource
     * @param {string} url - Resource URL
     */
    prefetch(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }

    /**
     * Preload resource
     * @param {string} url - Resource URL
     * @param {string} type - Resource type
     */
    preload(url, type) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = type;
        if (type === 'font') {
            link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
    }

    /**
     * Enable lazy loading for images and iframes
     */
    enableLazyLoading() {
        // Native lazy loading for modern browsers
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.loading = 'lazy';
            if ('IntersectionObserver' in window) {
                this.lazyLoadElement(img);
            } else {
                // Fallback for older browsers
                img.src = img.dataset.src;
            }
        });

        document.querySelectorAll('iframe[data-src]').forEach(iframe => {
            iframe.loading = 'lazy';
            if ('IntersectionObserver' in window) {
                this.lazyLoadElement(iframe);
            } else {
                iframe.src = iframe.dataset.src;
            }
        });
    }

    /**
     * Lazy load element using Intersection Observer
     * @param {HTMLElement} element - Element to lazy load
     */
    lazyLoadElement(element) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    el.src = el.dataset.src;
                    el.removeAttribute('data-src');
                    observer.unobserve(el);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        observer.observe(element);
    }

    /**
     * Optimize animations using RAF
     */
    optimizeAnimations() {
        // Override setTimeout for animations
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = (callback, delay, ...args) => {
            if (delay === 0 || delay === 1) {
                // Use RAF for immediate animations
                return this.scheduleAnimation(callback, ...args);
            }
            return originalSetTimeout(callback, delay, ...args);
        };
    }

    /**
     * Schedule animation using requestAnimationFrame
     * @param {Function} callback - Animation callback
     * @param {...any} args - Callback arguments
     * @returns {number} Animation ID
     */
    scheduleAnimation(callback, ...args) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const id = Date.now() + (array[0] / 0xFFFFFFFF);
        const wrappedCallback = () => {
            callback(...args);
            this.animationFrameCallbacks.delete(id);
        };
        
        this.animationFrameCallbacks.set(id, wrappedCallback);
        requestAnimationFrame(wrappedCallback);
        return id;
    }

    /**
     * Defer non-critical scripts
     * @param {string} src - Script source
     * @param {Function} callback - Load callback
     */
    deferScript(src, callback) {
        if (this.deferredScripts.has(src)) return;
        this.deferredScripts.add(src);

        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        
        if (callback) {
            script.onload = callback;
        }

        // Load after critical resources
        if (document.readyState === 'complete') {
            document.body.appendChild(script);
        } else {
            window.SafeEvents.on(window, 'load', () => {
                document.body.appendChild(script);
            });
        }
    }

    /**
     * Debounce function for performance
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function for performance
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Check performance budgets
     */
    checkBudgets() {
        const violations = [];

        if (this.metrics.loadTime > this.budgets.loadTime) {
            violations.push(`Load time ${this.metrics.loadTime}ms exceeds budget ${this.budgets.loadTime}ms`);
        }

        if (this.metrics.fcp > this.budgets.firstPaint) {
            violations.push(`First paint ${this.metrics.fcp}ms exceeds budget ${this.budgets.firstPaint}ms`);
        }

        if (violations.length > 0) {
            console.warn('Performance budget violations:', violations);
            this.optimizePerformance();
        }
    }

    /**
     * Optimize performance based on metrics
     */
    optimizePerformance() {
        // Remove unused CSS
        this.removeUnusedCSS();
        
        // Compress images
        this.optimizeImages();
        
        // Enable browser caching
        this.enableCaching();
        
        // Minify resources
        this.minifyResources();
    }

    /**
     * Remove unused CSS rules
     */
    removeUnusedCSS() {
        // This would require PurgeCSS in production
        console.log('Consider using PurgeCSS to remove unused styles');
    }

    /**
     * Optimize images
     */
    optimizeImages() {
        document.querySelectorAll('img').forEach(img => {
            // Add loading="lazy" if not present
            if (!img.loading) {
                img.loading = 'lazy';
            }
            
            // Suggest WebP format
            if (img.src && !img.src.includes('.webp')) {
                console.log(`Consider converting ${img.src} to WebP format`);
            }
        });
    }

    /**
     * Enable browser caching headers
     */
    enableCaching() {
        // This would be done server-side
        console.log('Ensure proper Cache-Control headers are set');
    }

    /**
     * Minify resources
     */
    minifyResources() {
        // This would be done in build process
        console.log('Ensure all JS/CSS is minified in production');
    }

    /**
     * Get performance report
     * @returns {Object} Performance metrics
     */
    getReport() {
        return {
            metrics: this.metrics,
            budgets: this.budgets,
            recommendations: this.getRecommendations()
        };
    }

    /**
     * Get performance recommendations
     * @returns {Array} Recommendations
     */
    getRecommendations() {
        const recommendations = [];

        if (this.metrics.loadTime > 3000) {
            recommendations.push('Reduce JavaScript bundle size');
        }

        if (this.metrics.fcp > 2000) {
            recommendations.push('Optimize critical rendering path');
        }

        if (this.metrics.resources && this.metrics.resources.image) {
            const largeImages = this.metrics.resources.image.filter(img => img.size > 100000);
            if (largeImages.length > 0) {
                recommendations.push('Compress large images');
            }
        }

        return recommendations;
    }

    /**
     * Memory usage monitoring
     */
    monitorMemory() {
        if (performance.memory) {
            setInterval(() => {
                const used = performance.memory.usedJSHeapSize;
                const total = performance.memory.totalJSHeapSize;
                const limit = performance.memory.jsHeapSizeLimit;
                
                this.metrics.memoryUsage = {
                    used: Math.round(used / 1048576) + 'MB',
                    total: Math.round(total / 1048576) + 'MB',
                    limit: Math.round(limit / 1048576) + 'MB',
                    percentage: Math.round((used / limit) * 100) + '%'
                };

                // Warn if memory usage is high
                if (used / limit > 0.9) {
                    console.warn('High memory usage detected:', this.metrics.memoryUsage);
                }
            }, 10000); // Check every 10 seconds
        }
    }
}

// Create global instance
window.Performance = new PerformanceOptimizer();

// Start memory monitoring
window.Performance.monitorMemory();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}