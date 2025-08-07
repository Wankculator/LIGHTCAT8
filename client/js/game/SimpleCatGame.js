// This file requires memory-safe-events.js to be loaded first
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

import * as THREE from 'three';

export class SimpleCatGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.score = 0;
        this.timeRemaining = 60;
        this.isPlaying = false;
        
        this.init();
    }

    init() {
        // Basic Three.js setup
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 10, 100);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Simple black ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.8
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
        
        // Grid
        const gridHelper = new THREE.GridHelper(100, 50, 0xFFFF00, 0x444444);
        this.scene.add(gridHelper);
        
        // Simple cat (black with yellow outline)
        this.createSimpleCat();
        
        // Lightning bolts to collect
        this.lightningBolts = [];
        this.createLightningBolts();
        
        // Rain effect
        this.createRainEffect();
        
        // Controls
        this.keys = {};
        this.setupControls();
        
        // Animation
        this.clock = new THREE.Clock();
        this.animate();
    }

    createSimpleCat() {
        const catGroup = new THREE.Group();
        
        // Body - simple black box
        const bodyGeometry = new THREE.BoxGeometry(2, 1.5, 3);
        const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const body = new THREE.Mesh(bodyGeometry, blackMaterial);
        body.castShadow = true;
        catGroup.add(body);
        
        // Head - simple sphere
        const headGeometry = new THREE.SphereGeometry(1, 8, 8);
        const head = new THREE.Mesh(headGeometry, blackMaterial);
        head.position.set(0, 1.5, 1);
        head.castShadow = true;
        catGroup.add(head);
        
        // Ears - simple cones
        const earGeometry = new THREE.ConeGeometry(0.5, 1, 4);
        const leftEar = new THREE.Mesh(earGeometry, blackMaterial);
        leftEar.position.set(-0.5, 2.5, 0.8);
        catGroup.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, blackMaterial);
        rightEar.position.set(0.5, 2.5, 0.8);
        catGroup.add(rightEar);
        
        // Eyes - yellow dots
        const eyeGeometry = new THREE.SphereGeometry(0.15);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 1.6, 1.8);
        catGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 1.6, 1.8);
        catGroup.add(rightEye);
        
        // Add yellow glow
        const catGlow = new THREE.PointLight(0xFFFF00, 0.5, 5);
        catGlow.position.set(0, 2, 0);
        catGroup.add(catGlow);
        
        this.cat = catGroup;
        this.cat.position.set(0, 0.75, 0);
        this.scene.add(this.cat);
        
        // Movement speed
        this.catSpeed = 20;
    }

    createLightningBolts() {
        const boltGeometry = new THREE.ConeGeometry(0.3, 2, 4);
        const boltMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00,
            emissive: 0xFFFF00
        });
        
        // Create 30 lightning bolts
        for (let i = 0; i < 30; i++) {
            const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
            bolt.position.set(
                (gameRandom() - 0.5) * 80,
                gameRandom() * 20 + 10,
                (gameRandom() - 0.5) * 80
            );
            bolt.rotation.z = Math.PI;
            
            // Add glow
            const glow = new THREE.PointLight(0xFFFF00, 1, 5);
            glow.position.copy(bolt.position);
            this.scene.add(glow);
            
            bolt.userData = {
                glow: glow,
                fallSpeed: 2 + gameRandom() * 3,
                collected: false
            };
            
            this.scene.add(bolt);
            this.lightningBolts.push(bolt);
        }
    }

    createRainEffect() {
        const rainCount = 500;
        const rainGeometry = new THREE.BufferGeometry();
        const rainPositions = new Float32Array(rainCount * 3);
        
        for (let i = 0; i < rainCount * 3; i += 3) {
            rainPositions[i] = (gameRandom() - 0.5) * 100;
            rainPositions[i + 1] = gameRandom() * 50;
            rainPositions[i + 2] = (gameRandom() - 0.5) * 100;
        }
        
        rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
        
        const rainMaterial = new THREE.PointsMaterial({
            color: 0xFFFF00,
            size: 0.1,
            transparent: true,
            opacity: 0.3
        });
        
        this.rain = new THREE.Points(rainGeometry, rainMaterial);
        this.scene.add(this.rain);
    }

    setupControls() {
        document.this.keydownHandler = (e) => {
            this.keys[e.code] = true;
        };
        addEventListener('keydown', this.keydownHandler));
        
        document.this.keyupHandler = (e) => {
            this.keys[e.code] = false;
        };
        addEventListener('keyup', this.keyupHandler));
        
        window.this.resizeHandler = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        addEventListener('resize', this.resizeHandler));
    }

    start() {
        this.isPlaying = true;
        this.score = 0;
        this.timeRemaining = 60;
        this.cat.position.set(0, 0.75, 0);
        
        // Reset lightning bolts
        this.lightningBolts.forEach(bolt => {
            bolt.userData.collected = false;
            bolt.visible = true;
            bolt.userData.glow.visible = true;
            bolt.position.y = gameRandom() * 20 + 10;
        });
        
        // Start timer
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            document.getElementById('timer').textContent = this.timeRemaining;
            
            if (this.timeRemaining <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        window.game.endGame();
    }

    update(deltaTime) {
        if (!this.isPlaying) return;
        
        // Simple cat movement
        const moveSpeed = this.catSpeed * deltaTime;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.cat.position.z -= moveSpeed;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.cat.position.z += moveSpeed;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.cat.position.x -= moveSpeed;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.cat.position.x += moveSpeed;
        }
        
        // Keep cat in bounds
        this.cat.position.x = Math.max(-45, Math.min(45, this.cat.position.x));
        this.cat.position.z = Math.max(-45, Math.min(45, this.cat.position.z));
        
        // Update camera to follow cat
        this.camera.position.x = this.cat.position.x;
        this.camera.position.z = this.cat.position.z + 20;
        this.camera.lookAt(this.cat.position);
        
        // Update lightning bolts
        this.lightningBolts.forEach(bolt => {
            if (!bolt.userData.collected) {
                // Fall down
                bolt.position.y -= bolt.userData.fallSpeed * deltaTime;
                bolt.rotation.y += deltaTime * 2;
                
                // Reset when hits ground
                if (bolt.position.y < 0) {
                    bolt.position.y = 20 + gameRandom() * 10;
                    bolt.position.x = (gameRandom() - 0.5) * 80;
                    bolt.position.z = (gameRandom() - 0.5) * 80;
                }
                
                // Check collection
                const distance = this.cat.position.distanceTo(bolt.position);
                if (distance < 3) {
                    bolt.userData.collected = true;
                    bolt.visible = false;
                    bolt.userData.glow.visible = false;
                    this.score++;
                    document.getElementById('score').textContent = this.score;
                    
                    // Respawn after delay
                    setTimeout(() => {
                        bolt.userData.collected = false;
                        bolt.visible = true;
                        bolt.userData.glow.visible = true;
                        bolt.position.y = 20 + gameRandom() * 10;
                        bolt.position.x = (gameRandom() - 0.5) * 80;
                        bolt.position.z = (gameRandom() - 0.5) * 80;
                    }, 2000);
                    
                    // Play sound
                    if (window.game && window.game.sound) {
                        window.game.sound.playCollectSound();
                    }
                }
                
                // Update glow position
                bolt.userData.glow.position.copy(bolt.position);
            }
        });
        
        // Update rain
        const rainPositions = this.rain.geometry.attributes.position.array;
        for (let i = 0; i < rainPositions.length; i += 3) {
            rainPositions[i + 1] -= 20 * deltaTime;
            
            if (rainPositions[i + 1] < 0) {
                rainPositions[i + 1] = 50;
            }
        }
        this.rain.geometry.attributes.position.needsUpdate = true;
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        
        this.renderer.render(this.scene, this.camera);
    }

    // Cleanup method to prevent memory leaks
    cleanup() {
        // Clean up all event listeners
        window.SafeEvents.cleanup();

        // Remove all event listeners
        if (this.canvas) {
            this.window.SafeEvents.off(canvas, 'click', this.handleClick);
            this.window.SafeEvents.off(canvas, 'mousemove', this.handleMouseMove);
            this.window.SafeEvents.off(canvas, 'touchstart', this.handleTouchStart);
            this.window.SafeEvents.off(canvas, 'touchmove', this.handleTouchMove);
            this.window.SafeEvents.off(canvas, 'touchend', this.handleTouchEnd);
        }
        
        if (typeof window !== 'undefined') {
            window.SafeEvents.off(window, 'resize', this.handleResize);
            window.SafeEvents.off(window, 'keydown', this.handleKeyDown);
            window.SafeEvents.off(window, 'keyup', this.handleKeyUp);
        }
        
        // Clear any timers
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clear references
        this.canvas = null;
        this.ctx = null;
    }
    
}