// THREE.js Initialization Fix - Handles missing THREE global
(function() {
    'use strict';
    
    console.log('🔧 THREE.js Fix: Loading...');
    
    // Check if THREE is defined
    if (typeof THREE === 'undefined') {
        console.warn('[THREE.js] Not loaded yet, deferring initialization');
        
        // Create a stub to prevent errors
        window.THREE = {
            Scene: function() { return { add: () => {} }; },
            PerspectiveCamera: function() { return {}; },
            WebGLRenderer: function() { return { setSize: () => {}, render: () => {}, domElement: document.createElement('canvas') }; },
            BoxGeometry: function() { return {}; },
            MeshBasicMaterial: function() { return {}; },
            Mesh: function() { return { position: { set: () => {} }, rotation: { x: 0, y: 0 } }; },
            DirectionalLight: function() { return { position: { set: () => {} } }; },
            AmbientLight: function() { return {}; },
            Vector3: function() { return { x: 0, y: 0, z: 0 }; },
            isStub: true
        };
        
        // Try to load THREE.js dynamically
        function loadThreeJS() {
            if (window.THREE && !window.THREE.isStub) {
                console.log('✅ THREE.js already loaded');
                return Promise.resolve();
            }
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
                script.onload = () => {
                    console.log('✅ THREE.js loaded dynamically');
                    delete window.THREE.isStub;
                    
                    // Re-initialize any THREE.js dependent code
                    if (typeof window.initThree === 'function') {
                        try {
                            window.initThree();
                            console.log('✅ THREE.js scene re-initialized');
                        } catch (e) {
                            console.warn('[THREE.js] Re-init failed:', e);
                        }
                    }
                    
                    resolve();
                };
                script.onerror = () => {
                    console.error('[THREE.js] Failed to load from CDN');
                    reject(new Error('Failed to load THREE.js'));
                };
                document.head.appendChild(script);
            });
        }
        
        // Attempt to load THREE.js
        loadThreeJS().catch(error => {
            console.error('[THREE.js] Load failed:', error);
        });
    }
    
    // Wrap initThree to handle errors gracefully
    const originalInitThree = window.initThree;
    if (originalInitThree) {
        window.initThree = function() {
            if (!window.THREE || window.THREE.isStub) {
                console.warn('[THREE.js] Not ready, deferring initThree');
                // Try again after THREE.js loads
                setTimeout(() => {
                    if (window.THREE && !window.THREE.isStub) {
                        originalInitThree.call(this);
                    }
                }, 2000);
                return;
            }
            
            try {
                return originalInitThree.call(this);
            } catch (error) {
                console.error('[THREE.js] Init error:', error);
                // Don't throw, just log
            }
        };
    }
    
    console.log('✅ THREE.js fix applied');
})();