import * as THREE from 'three';
import { GameWorld } from './GameWorld.js';
import { LightCatCharacter } from './LightCatCharacter.js';
import { CollectibleManager } from './CollectibleManager.js';
// Use global SecureRandom instead of import

export class ProGame {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.timeRemaining = 30;
        this.gameTimer = null;
        
        // Callbacks
        this.onScoreUpdate = null;
        this.onTimeUpdate = null;
        this.onGameOver = null;
        
        // Input state
        this.input = {
            keys: {},
            mouse: { x: 0, y: 0 },
            joystick: { x: 0, y: 0 },
            isPointerLocked: false,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        };
        
        // Event listeners storage for cleanup
        this.eventListeners = [];
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Setup scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000033, 50, 200);
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Create game world
        this.gameWorld = new GameWorld(this.scene);
        
        // Create character
        this.character = new LightCatCharacter(this.scene, this.camera);
        
        // Create collectible manager
        this.collectibles = new CollectibleManager(this.scene);
        
        // Setup lighting
        this.setupLighting();
        
        // Setup controls
        this.setupControls();
        
        // Setup resize handler
        this.setupResize();
        
        // Start render loop
        this.animate();
    }

    setupLighting() {
        // Main directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xFFFFAA, 2);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        
        // Shadow configuration
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        sunLight.shadow.bias = -0.0005;
        
        this.scene.add(sunLight);
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x444466, 0.5);
        this.scene.add(ambientLight);
        
        // Rim light for visual appeal
        const rimLight = new THREE.DirectionalLight(0xFFFF44, 0.8);
        rimLight.position.set(-20, 20, -20);
        this.scene.add(rimLight);
        
        // Add hemisphere light for better overall illumination
        const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
        this.scene.add(hemiLight);
    }

    setupControls() {
        // Keyboard - Direct event listeners without SafeEvents
        const keydownHandler = (e) => {
            this.input.keys[e.code] = true;
            
            // Jump on press
            if (e.code === 'Space' && this.isPlaying) {
                this.jump();
            }
        };
        
        const keyupHandler = (e) => {
            this.input.keys[e.code] = false;
        };
        
        document.addEventListener('keydown', keydownHandler);
        document.addEventListener('keyup', keyupHandler);
        
        // Store for cleanup
        this.eventListeners.push(
            { target: document, type: 'keydown', handler: keydownHandler },
            { target: document, type: 'keyup', handler: keyupHandler }
        );
        
        // Mouse (desktop only)
        if (!this.input.isMobile) {
            const clickHandler = () => {
                if (this.isPlaying && !this.input.isPointerLocked) {
                    this.canvas.requestPointerLock();
                }
            };
            
            const mouseMoveHandler = (e) => {
                if (this.input.isPointerLocked) {
                    this.input.mouse.x += e.movementX;
                    this.input.mouse.y += e.movementY;
                }
            };
            
            this.canvas.addEventListener('click', clickHandler);
            document.addEventListener('mousemove', mouseMoveHandler);
            
            this.eventListeners.push(
                { target: this.canvas, type: 'click', handler: clickHandler },
                { target: document, type: 'mousemove', handler: mouseMoveHandler }
            );
            
            // Pointer lock change
            const pointerLockHandler = () => {
                this.input.isPointerLocked = document.pointerLockElement === this.canvas;
            };
            
            document.addEventListener('pointerlockchange', pointerLockHandler);
            this.eventListeners.push(
                { target: document, type: 'pointerlockchange', handler: pointerLockHandler }
            );
        }
    }

    setupResize() {
        const resizeHandler = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.push(
            { target: window, type: 'resize', handler: resizeHandler }
        );
    }

    startGame() {
        this.isPlaying = true;
        this.isPaused = false;
        this.score = 0;
        this.timeRemaining = 30;
        
        // Reset character position
        this.character.reset();
        
        // Clear and spawn collectibles
        this.collectibles.reset();
        this.spawnInitialCollectibles();
        
        // Start game timer
        this.startGameTimer();
        
        // Update UI
        if (this.onScoreUpdate) this.onScoreUpdate(0);
        if (this.onTimeUpdate) this.onTimeUpdate(30);
    }

    stopGame() {
        this.isPlaying = false;
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    startGameTimer() {
        const startTime = Date.now();
        
        this.gameTimer = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            this.timeRemaining = Math.max(0, 30 - elapsed);
            
            if (this.onTimeUpdate) {
                this.onTimeUpdate(Math.ceil(this.timeRemaining));
            }
            
            if (this.timeRemaining <= 0) {
                this.endGame();
            }
        }, 100);
    }

    endGame() {
        this.stopGame();
        if (this.onGameOver) {
            this.onGameOver(this.score);
        }
    }

    spawnInitialCollectibles() {
        const spawnCount = this.input.isMobile ? 8 : 10;
        for (let i = 0; i < spawnCount; i++) {
            this.spawnCollectible();
        }
    }

    spawnCollectible() {
        const positions = [
            // Ground level
            { x: (SecureRandom.random() - 0.5) * 80, y: 1, z: (SecureRandom.random() - 0.5) * 80 },
            // Platforms
            { x: (SecureRandom.random() - 0.5) * 60, y: 5 + SecureRandom.random() * 10, z: (SecureRandom.random() - 0.5) * 60 },
            // High places
            { x: (SecureRandom.random() - 0.5) * 40, y: 15 + SecureRandom.random() * 10, z: (SecureRandom.random() - 0.5) * 40 }
        ];
        
        const pos = positions[Math.floor(SecureRandom.random() * positions.length)];
        this.collectibles.spawn(pos.x, pos.y, pos.z);
    }

    jump() {
        if (this.character) {
            this.character.jump();
        }
    }

    handleJoystickInput(x, y) {
        this.input.joystick.x = x;
        this.input.joystick.y = y;
    }

    handleJump() {
        this.jump();
    }

    update(deltaTime) {
        if (!this.isPlaying || this.isPaused) return;
        
        // Update character with input
        this.character.update(deltaTime, this.input, this.gameWorld);
        
        // Update collectibles
        this.collectibles.update(deltaTime);
        
        // Check collisions
        const collected = this.collectibles.checkCollisions(this.character.mesh.position, 3);
        if (collected > 0) {
            this.score += collected;
            if (this.onScoreUpdate) {
                this.onScoreUpdate(this.score);
            }
            
            // Spawn new collectibles
            for (let i = 0; i < collected; i++) {
                setTimeout(() => this.spawnCollectible(), 100 + SecureRandom.random() * 900);
            }
        }
        
        // Update game world
        this.gameWorld.update(deltaTime);
    }

    animate() {
        const clock = new THREE.Clock();
        
        const animateLoop = () => {
            requestAnimationFrame(animateLoop);
            
            const deltaTime = Math.min(clock.getDelta(), 0.1);
            
            this.update(deltaTime);
            this.renderer.render(this.scene, this.camera);
        };
        
        animateLoop();
    }

    cleanup() {
        // Remove all event listeners
        this.eventListeners.forEach(({ target, type, handler }) => {
            target.removeEventListener(type, handler);
        });
        this.eventListeners = [];
        
        // Stop game
        this.stopGame();
        
        // Dispose Three.js resources
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Clean up components
        if (this.character) this.character.cleanup();
        if (this.collectibles) this.collectibles.cleanup();
        if (this.gameWorld) this.gameWorld.cleanup();
    }
}