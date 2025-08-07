import * as THREE from 'three';

export class LightCatCharacter {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Create character group
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // Character properties
        this.position = new THREE.Vector3(0, 2, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.grounded = false;
        this.jumpForce = 15;
        this.moveSpeed = 10;
        this.maxSpeed = 15;
        
        // Create mesh
        this.createCharacterMesh();
        
        // Setup camera follow
        this.cameraOffset = new THREE.Vector3(0, 8, 15);
        this.cameraLookOffset = new THREE.Vector3(0, 2, 0);
        
        // Expose mesh for collision detection
        this.mesh = this.group;
    }
    
    createCharacterMesh() {
        // Create a stylized cat character
        const bodyGeometry = new THREE.SphereGeometry(1, 16, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            emissive: 0xFFAA00,
            emissiveIntensity: 0.3,
            shininess: 100
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, 0, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        this.group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.set(0, 0.8, 0.3);
        head.castShadow = true;
        this.group.add(head);
        
        // Ears
        const earGeometry = new THREE.ConeGeometry(0.3, 0.6, 4);
        const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
        leftEar.position.set(-0.4, 1.3, 0.2);
        leftEar.rotation.z = -0.3;
        leftEar.castShadow = true;
        this.group.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
        rightEar.position.set(0.4, 1.3, 0.2);
        rightEar.rotation.z = 0.3;
        rightEar.castShadow = true;
        this.group.add(rightEar);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.3, 0.9, 0.9);
        this.group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.3, 0.9, 0.9);
        this.group.add(rightEye);
        
        // Tail
        const tailGeometry = new THREE.CylinderGeometry(0.1, 0.3, 1.5, 8);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(0, 0.3, -0.8);
        tail.rotation.z = -0.5;
        tail.castShadow = true;
        this.group.add(tail);
        
        // Lightning effect
        this.createLightningEffect();
    }
    
    createLightningEffect() {
        // Create particle system for lightning effect
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (SecureRandom.random() - 0.5) * 4;
            positions[i * 3 + 1] = SecureRandom.random() * 4;
            positions[i * 3 + 2] = (SecureRandom.random() - 0.5) * 4;
            
            colors[i * 3] = 1;
            colors[i * 3 + 1] = SecureRandom.random() * 0.5 + 0.5;
            colors[i * 3 + 2] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.group.add(this.particles);
    }
    
    reset() {
        // Reset character to starting position
        this.position.set(0, 2, 0);
        this.velocity.set(0, 0, 0);
        this.grounded = false;
        this.group.position.copy(this.position);
        
        // Reset camera
        if (this.camera) {
            this.camera.position.copy(this.position).add(this.cameraOffset);
            this.camera.lookAt(this.position.clone().add(this.cameraLookOffset));
        }
    }
    
    jump() {
        if (this.grounded) {
            this.velocity.y = this.jumpForce;
            this.grounded = false;
        }
    }
    
    update(deltaTime, input, gameWorld) {
        // Handle input
        const moveVector = new THREE.Vector3();
        
        if (input.keys['ArrowLeft'] || input.keys['KeyA'] || input.joystick.x < -0.2) {
            moveVector.x = -1;
        }
        if (input.keys['ArrowRight'] || input.keys['KeyD'] || input.joystick.x > 0.2) {
            moveVector.x = 1;
        }
        if (input.keys['ArrowUp'] || input.keys['KeyW'] || input.joystick.y > 0.2) {
            moveVector.z = -1;
        }
        if (input.keys['ArrowDown'] || input.keys['KeyS'] || input.joystick.y < -0.2) {
            moveVector.z = 1;
        }
        
        // Apply movement
        if (moveVector.length() > 0) {
            moveVector.normalize();
            moveVector.multiplyScalar(this.moveSpeed * deltaTime);
            
            // Apply to velocity
            this.velocity.x += moveVector.x;
            this.velocity.z += moveVector.z;
        }
        
        // Apply friction
        this.velocity.x *= 0.85;
        this.velocity.z *= 0.85;
        
        // Apply gravity
        if (!this.grounded) {
            this.velocity.y -= 30 * deltaTime;
        }
        
        // Limit speed
        const horizontalVelocity = new THREE.Vector2(this.velocity.x, this.velocity.z);
        if (horizontalVelocity.length() > this.maxSpeed) {
            horizontalVelocity.normalize().multiplyScalar(this.maxSpeed);
            this.velocity.x = horizontalVelocity.x;
            this.velocity.z = horizontalVelocity.y;
        }
        
        // Update position
        const moveDistance = this.velocity.clone().multiplyScalar(deltaTime);
        this.position.add(moveDistance);
        
        // Ground collision (simple)
        if (this.position.y <= 1) {
            this.position.y = 1;
            this.velocity.y = 0;
            this.grounded = true;
        }
        
        // World bounds
        const bounds = 50;
        this.position.x = Math.max(-bounds, Math.min(bounds, this.position.x));
        this.position.z = Math.max(-bounds, Math.min(bounds, this.position.z));
        
        // Update mesh position
        this.group.position.copy(this.position);
        
        // Rotate based on movement
        if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1) {
            const angle = Math.atan2(this.velocity.x, this.velocity.z);
            this.group.rotation.y = angle;
        }
        
        // Update camera
        this.updateCamera();
        
        // Update particle effects
        this.updateParticles(deltaTime);
    }
    
    updateCamera() {
        if (!this.camera) return;
        
        // Smooth camera follow
        const targetPosition = this.position.clone().add(this.cameraOffset);
        this.camera.position.lerp(targetPosition, 0.1);
        
        const targetLookAt = this.position.clone().add(this.cameraLookOffset);
        const currentLookAt = new THREE.Vector3();
        this.camera.getWorldDirection(currentLookAt);
        currentLookAt.multiplyScalar(10).add(this.camera.position);
        currentLookAt.lerp(targetLookAt, 0.1);
        this.camera.lookAt(currentLookAt);
    }
    
    updateParticles(deltaTime) {
        if (!this.particles) return;
        
        const positions = this.particles.geometry.attributes.position.array;
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Make particles fall
            positions[i + 1] -= deltaTime * 2;
            
            // Reset particles that fall too low
            if (positions[i + 1] < 0) {
                positions[i] = (SecureRandom.random() - 0.5) * 4;
                positions[i + 1] = 4;
                positions[i + 2] = (SecureRandom.random() - 0.5) * 4;
            }
            
            // Add some movement
            positions[i] += Math.sin(time + i) * 0.01;
            positions[i + 2] += Math.cos(time + i) * 0.01;
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
        
        // Rotate particle system
        this.particles.rotation.y += deltaTime * 0.5;
    }
    
    cleanup() {
        // Remove from scene
        if (this.group) {
            this.scene.remove(this.group);
        }
        
        // Dispose geometries and materials
        this.group.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                child.material.dispose();
            }
        });
    }
}