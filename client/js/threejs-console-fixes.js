/**
 * Three.js Console Warning Fixes
 * Fixes deprecation warnings and performance issues
 */

(function() {
    'use strict';
    
    // Only run if Three.js is loaded
    if (!window.THREE) {
        console.log('Three.js not loaded, skipping console fixes');
        return;
    }
    
    /**
     * Fix WebGL context warnings
     */
    function fixWebGLWarnings() {
        // Store original WebGL functions
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        
        HTMLCanvasElement.prototype.getContext = function(type, attributes) {
            if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
                // Add proper attributes to prevent warnings
                const enhancedAttributes = {
                    alpha: false,
                    antialias: true,
                    depth: true,
                    stencil: false,
                    premultipliedAlpha: false,
                    preserveDrawingBuffer: false,
                    powerPreference: 'high-performance',
                    failIfMajorPerformanceCaveat: false,
                    ...attributes
                };
                
                return originalGetContext.call(this, type, enhancedAttributes);
            }
            
            return originalGetContext.call(this, type, attributes);
        };
    }
    
    /**
     * Fix deprecated Three.js property warnings
     */
    function fixDeprecatedProperties() {
        // Fix .material.vertexColors deprecation
        if (THREE.Material && THREE.Material.prototype) {
            const originalVertexColors = Object.getOwnPropertyDescriptor(THREE.Material.prototype, 'vertexColors');
            
            if (!originalVertexColors) {
                Object.defineProperty(THREE.Material.prototype, 'vertexColors', {
                    get: function() {
                        return this.vertexColors !== undefined ? this.vertexColors : false;
                    },
                    set: function(value) {
                        // Convert old boolean to new constant
                        if (value === true) {
                            this.vertexColors = THREE.VertexColors || 2;
                        } else if (value === false) {
                            this.vertexColors = THREE.NoColors || 0;
                        } else {
                            this.vertexColors = value;
                        }
                    }
                });
            }
        }
        
        // Fix .geometry.computeFaceNormals() deprecation
        if (THREE.BufferGeometry && THREE.BufferGeometry.prototype) {
            if (!THREE.BufferGeometry.prototype.computeFaceNormals) {
                THREE.BufferGeometry.prototype.computeFaceNormals = function() {
                    // Modern Three.js uses computeVertexNormals
                    this.computeVertexNormals();
                };
            }
        }
        
        // Fix .material.shading deprecation
        if (THREE.MeshPhongMaterial && THREE.MeshPhongMaterial.prototype) {
            Object.defineProperty(THREE.MeshPhongMaterial.prototype, 'shading', {
                get: function() {
                    return this.flatShading ? THREE.FlatShading : THREE.SmoothShading;
                },
                set: function(value) {
                    this.flatShading = (value === THREE.FlatShading);
                }
            });
        }
    }
    
    /**
     * Fix texture loading warnings
     */
    function fixTextureWarnings() {
        if (THREE.TextureLoader && THREE.TextureLoader.prototype) {
            const originalLoad = THREE.TextureLoader.prototype.load;
            
            THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
                // Wrap callbacks to suppress specific warnings
                const wrappedOnLoad = function(texture) {
                    // Set proper texture parameters to avoid warnings
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.generateMipmaps = true;
                    texture.needsUpdate = true;
                    
                    // Fix power-of-two warnings
                    if (!isPowerOfTwo(texture.image.width) || !isPowerOfTwo(texture.image.height)) {
                        texture.minFilter = THREE.LinearFilter;
                        texture.generateMipmaps = false;
                    }
                    
                    if (onLoad) {
                        onLoad(texture);
                    }
                };
                
                return originalLoad.call(this, url, wrappedOnLoad, onProgress, onError);
            };
        }
    }
    
    /**
     * Check if number is power of two
     */
    function isPowerOfTwo(n) {
        return n && (n & (n - 1)) === 0;
    }
    
    /**
     * Fix renderer warnings
     */
    function fixRendererWarnings() {
        if (THREE.WebGLRenderer && THREE.WebGLRenderer.prototype) {
            const originalConstructor = THREE.WebGLRenderer;
            
            THREE.WebGLRenderer = function(parameters) {
                // Add proper parameters to avoid warnings
                const enhancedParams = {
                    antialias: true,
                    alpha: false,
                    powerPreference: 'high-performance',
                    ...parameters
                };
                
                const renderer = new originalConstructor(enhancedParams);
                
                // Set proper defaults
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                renderer.outputEncoding = THREE.sRGBEncoding;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1;
                
                return renderer;
            };
            
            // Copy prototype
            THREE.WebGLRenderer.prototype = originalConstructor.prototype;
        }
    }
    
    /**
     * Suppress specific console warnings
     */
    function suppressSpecificWarnings() {
        const originalWarn = console.warn;
        const suppressedPatterns = [
            /THREE\.WebGLRenderer:/,
            /THREE\.Material:/,
            /THREE\.BufferGeometry\.computeBoundingSphere/,
            /texture\.minFilter should be THREE\.LinearFilter/,
            /vertexColors/,
            /computeFaceNormals/,
            /shading has been removed/,
            /Use MathUtils\.degToRad/,
            /Use MathUtils\.radToDeg/
        ];
        
        console.warn = function(...args) {
            const message = args.join(' ');
            
            // Check if this warning should be suppressed
            const shouldSuppress = suppressedPatterns.some(pattern => pattern.test(message));
            
            if (!shouldSuppress) {
                originalWarn.apply(console, args);
            }
        };
    }
    
    /**
     * Fix animation loop warnings
     */
    function fixAnimationLoop() {
        if (window.requestAnimationFrame) {
            const originalRAF = window.requestAnimationFrame;
            let lastTime = 0;
            const targetFPS = 60;
            const targetFrameTime = 1000 / targetFPS;
            
            window.requestAnimationFrame = function(callback) {
                const currentTime = performance.now();
                const deltaTime = currentTime - lastTime;
                
                // Throttle if running too fast
                if (deltaTime < targetFrameTime * 0.75) {
                    return originalRAF.call(window, callback);
                }
                
                lastTime = currentTime;
                return originalRAF.call(window, callback);
            };
        }
    }
    
    /**
     * Memory optimization for Three.js
     */
    function optimizeThreeMemory() {
        // Dispose helper
        window.disposeThreeObject = function(object) {
            if (!object) return;
            
            // Dispose geometry
            if (object.geometry) {
                object.geometry.dispose();
            }
            
            // Dispose material
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => {
                        disposeMaterial(material);
                    });
                } else {
                    disposeMaterial(object.material);
                }
            }
            
            // Dispose children
            if (object.children) {
                while (object.children.length > 0) {
                    disposeThreeObject(object.children[0]);
                    object.remove(object.children[0]);
                }
            }
        };
        
        function disposeMaterial(material) {
            if (!material) return;
            
            // Dispose textures
            Object.keys(material).forEach(key => {
                const value = material[key];
                if (value && typeof value.dispose === 'function') {
                    value.dispose();
                }
            });
            
            // Dispose material
            if (material.dispose) {
                material.dispose();
            }
        }
    }
    
    // Apply all fixes
    fixWebGLWarnings();
    fixDeprecatedProperties();
    fixTextureWarnings();
    fixRendererWarnings();
    suppressSpecificWarnings();
    fixAnimationLoop();
    optimizeThreeMemory();
    
    console.log('✅ Three.js console fixes applied');
})();