// This file requires crypto-secure-random.js to be loaded first
// Safe random function for game use (not cryptographic)
function gameRandom() {
    // Use crypto.getRandomValues for secure randomness if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] / (0xffffffff + 1);
    }
    // Fallback to Math.random for older browsers
    return window.SecureRandom.random();
}

/**
 * Object Pool Pattern for LIGHTCAT Game
 * Based on awesome-jsgames performance patterns
 * Dramatically reduces garbage collection in the game
 */

class ObjectPool {
    constructor(objectClass, initialSize = 50) {
        this.ObjectClass = objectClass;
        this.pool = [];
        this.active = new Set();
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new this.ObjectClass());
        }
        
        console.log(`🎮 Object pool created with ${initialSize} ${objectClass.name} objects`);
    }

    /**
     * Get an object from the pool
     */
    acquire(...args) {
        let obj;
        
        if (this.pool.length > 0) {
            // Reuse existing object
            obj = this.pool.pop();
            if (obj.reset) {
                obj.reset(...args);
            }
        } else {
            // Create new object if pool is empty
            obj = new this.ObjectClass(...args);
            console.warn(`Pool exhausted for ${this.ObjectClass.name}, creating new object`);
        }
        
        this.active.add(obj);
        return obj;
    }

    /**
     * Return an object to the pool
     */
    release(obj) {
        if (!this.active.has(obj)) {
            console.warn('Attempting to release object not from this pool');
            return;
        }
        
        this.active.delete(obj);
        
        // Clean up the object
        if (obj.cleanup) {
            obj.cleanup();
        }
        
        // Return to pool
        this.pool.push(obj);
    }

    /**
     * Release all active objects
     */
    releaseAll() {
        this.active.forEach(obj => {
            if (obj.cleanup) {
                obj.cleanup();
            }
            this.pool.push(obj);
        });
        this.active.clear();
    }

    /**
     * Get pool statistics
     */
    getStats() {
        return {
            poolSize: this.pool.length,
            activeCount: this.active.size,
            totalCreated: this.pool.length + this.active.size
        };
    }
}

// Example: Lightning Collectible for the game
class LightningCollectible {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.velocity = { x: 0, y: 0 };
        this.active = false;
        this.mesh = null;
    }

    reset(x, y, velocity) {
        this.x = x;
        this.y = y;
        this.velocity = velocity || { x: 0, y: 5 };
        this.active = true;
        
        // Reset mesh position if it exists
        if (this.mesh) {
            this.mesh.position.set(x, y, 0);
            this.mesh.visible = true;
        }
    }

    cleanup() {
        this.active = false;
        if (this.mesh) {
            this.mesh.visible = false;
        }
    }

    update(deltaTime) {
        if (!this.active) return;
        
        // Update position
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Update mesh
        if (this.mesh) {
            this.mesh.position.x = this.x;
            this.mesh.position.y = this.y;
            this.mesh.rotation.z += deltaTime * 2; // Spin effect
        }
        
        // Check if off screen
        if (this.y < -10) {
            this.active = false;
        }
    }
}

// Usage in LIGHTCAT game:
/*
// In ProGame.js constructor:
this.lightningPool = new ObjectPool(LightningCollectible, 100);

// When spawning lightning:
const lightning = this.lightningPool.acquire(
    gameRandom() * this.gameWidth,
    this.gameHeight + 10,
    { x: 0, y: -5 }
);

// In update loop:
this.lightnings.forEach(lightning => {
    lightning.update(deltaTime);
    
    if (!lightning.active) {
        this.lightningPool.release(lightning);
        this.lightnings.delete(lightning);
    }
});

// Check pool performance:
console.log('Pool stats:', this.lightningPool.getStats());
*/

export { ObjectPool, LightningCollectible };