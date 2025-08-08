// Master Fix Loader - Loads all fixes in correct order
(function() {
    'use strict';
    
    console.log('🚀 LIGHTCAT Master Fix Loader: Initializing...');
    
    // List of fix scripts to load in order
    const fixes = [
        // Core utilities first
        { name: 'DOM Safety', file: 'dom-safety.js' },
        { name: 'Memory Leak Fix V2', file: 'memory-leak-fix-v2.js' },
        
        // Infrastructure fixes
        { name: 'WebSocket Fix', file: 'websocket-fix.js' },
        { name: 'THREE.js Fix', file: 'threejs-fix.js' },
        
        // Feature fixes
        { name: 'QR Scanner Fix', file: 'qr-scanner-fix.js' },
        { name: 'Payment Modal Guaranteed', file: 'payment-modal-guaranteed.js' },
        { name: 'Stats Polling Fix', file: 'stats-polling-fix.js' },
        
        // Keep existing fixes that still work
        { name: 'Direct Invoice Submit', file: 'direct-invoice-submit.js' },
        { name: 'Button Processing Fix', file: 'button-processing-fix.js' },
        { name: 'Form Submission Debugger', file: 'form-submission-debugger.js' },
        { name: 'Invoice Format Fix', file: 'invoice-format-fix.js' }
    ];
    
    let loadedCount = 0;
    let failedCount = 0;
    
    // Load a script dynamically
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            const existing = document.querySelector(`script[src*="${src}"]`);
            if (existing) {
                console.log(`✓ Already loaded: ${src}`);
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = `/js/${src}?v=${Date.now()}`;
            script.onload = () => {
                console.log(`✅ Loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Failed to load: ${src}`);
                reject(new Error(`Failed to load ${src}`));
            };
            document.head.appendChild(script);
        });
    }
    
    // Load all fixes
    async function loadAllFixes() {
        console.log(`Loading ${fixes.length} fix scripts...`);
        
        for (const fix of fixes) {
            try {
                await loadScript(fix.file);
                loadedCount++;
            } catch (error) {
                console.error(`Failed to load ${fix.name}:`, error);
                failedCount++;
                // Continue loading other fixes even if one fails
            }
        }
        
        console.log(`\n📊 Fix Loading Summary:`);
        console.log(`✅ Loaded: ${loadedCount}/${fixes.length}`);
        if (failedCount > 0) {
            console.log(`❌ Failed: ${failedCount}/${fixes.length}`);
        }
        
        // Final initialization
        finalizeInitialization();
    }
    
    // Final setup after all fixes are loaded
    function finalizeInitialization() {
        console.log('\n🎯 Finalizing initialization...');
        
        // Remove old broken scripts to prevent conflicts
        const brokenScripts = [
            'memory-leak-fix.js', // Old version with forEach error
            'qr-scanner.js', // Has syntax error
            'qr-scanner-ux-fix.js', // Has querySelector issues
            'websocket-integration.js', // Has undefined errors
            'app.js' // Has syntax error
        ];
        
        brokenScripts.forEach(script => {
            const element = document.querySelector(`script[src*="${script}"]`);
            if (element && !element.src.includes('-fix')) {
                element.remove();
                console.log(`🗑️ Removed broken script: ${script}`);
            }
        });
        
        // Set global flags
        window.LIGHTCAT_FIXES_LOADED = true;
        window.LIGHTCAT_FIX_VERSION = '2.0.0';
        
        // Dispatch event for other scripts
        document.dispatchEvent(new CustomEvent('lightcat:fixes:loaded', {
            detail: {
                loaded: loadedCount,
                failed: failedCount,
                total: fixes.length
            }
        }));
        
        console.log('✨ LIGHTCAT fixes initialization complete!');
        console.log('Console should now be much cleaner.');
    }
    
    // Start loading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllFixes);
    } else {
        loadAllFixes();
    }
})();