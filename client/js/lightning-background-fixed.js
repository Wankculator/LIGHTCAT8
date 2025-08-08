// Lightning Background Effect - FIXED VERSION
(function() {
    'use strict';
    
    console.log('⚡ Lightning effect loading...');
    
    // Remove any existing Three.js canvas first
    const existingCanvas = document.getElementById('three-canvas');
    if (existingCanvas) {
        console.log('⚡ Removing conflicting Three.js canvas');
        existingCanvas.remove();
    }
    
    // Remove any other canvas elements that might conflict
    const allCanvases = document.querySelectorAll('canvas:not(#lightning-canvas)');
    allCanvases.forEach(canvas => {
        if (canvas.style.position === 'fixed' && canvas.style.zIndex < 100) {
            console.log('⚡ Removing conflicting canvas:', canvas.id || 'unnamed');
            canvas.remove();
        }
    });
    
    class LightningBackground {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.bolts = [];
            this.maxBolts = 8;
            this.nextStrike = 0;
            this.animationId = null;
            this.initAttempts = 0;
            this.maxInitAttempts = 10;
            
            // Bright yellow color scheme
            this.colors = {
                main: '#FFFF00',
                glow: '#FFD700',
                core: '#FFFFFF',
                background: 'rgba(0, 0, 0, 0.02)'
            };
            
            this.init();
        }
        
        init() {
            console.log('⚡ Creating lightning canvas...');
            
            // Prevent infinite loop
            this.initAttempts++;
            if (this.initAttempts > this.maxInitAttempts) {
                console.error('⚡ Failed to initialize after', this.maxInitAttempts, 'attempts');
                return;
            }
            
            // Wait for body to exist
            if (!document.body) {
                console.log('⚡ Waiting for document.body... (attempt', this.initAttempts + ')');
                setTimeout(() => this.init(), 100);
                return;
            }
            
            // Remove any existing lightning canvas
            const existing = document.getElementById('lightning-canvas');
            if (existing) existing.remove();
            
            // Create new canvas with proper CSS (no escaped characters)
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'lightning-canvas';
            this.canvas.style.cssText = 'position:fixed !important;top:0 !important;left:0 !important;width:100% !important;height:100% !important;pointer-events:none !important;z-index:0 !important;opacity:0.6 !important;mix-blend-mode:screen !important;';
            
            // Insert at beginning of body (safely)
            try {
                if (document.body.firstChild) {
                    document.body.insertBefore(this.canvas, document.body.firstChild);
                } else {
                    document.body.appendChild(this.canvas);
                }
            } catch (e) {
                console.error('⚡ Failed to insert canvas:', e);
                return;
            }
            
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            
            window.addEventListener('resize', () => this.resize());
            
            console.log('⚡ Lightning canvas created and attached!');
            this.animate();
        }
        
        resize() {
            if (this.canvas) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
        }
        
        createBolt() {
            const bolt = {
                x: Math.random() * this.canvas.width,
                y: 0,
                targetY: this.canvas.height,
                segments: [],
                branches: [],
                life: 1.0,
                maxLife: 100 + Math.random() * 50,
                thickness: 8 + Math.random() * 8
            };
            
            const steps = 15 + Math.floor(Math.random() * 10);
            let currentX = bolt.x;
            let currentY = bolt.y;
            
            for (let i = 0; i <= steps; i++) {
                const progress = i / steps;
                currentY = bolt.y + (bolt.targetY - bolt.y) * progress;
                
                if (i > 0 && i < steps) {
                    currentX += (Math.random() - 0.5) * 150;
                }
                
                bolt.segments.push({ x: currentX, y: currentY });
                
                if (i > 2 && i < steps - 2 && Math.random() < 0.5) {
                    this.createBranch(bolt, currentX, currentY, progress);
                }
            }
            
            return bolt;
        }
        
        createBranch(parentBolt, startX, startY) {
            const branch = { segments: [] };
            const branchLength = 5 + Math.floor(Math.random() * 5);
            const angle = (Math.random() - 0.5) * Math.PI / 2;
            
            let currentX = startX;
            let currentY = startY;
            
            for (let i = 0; i <= branchLength; i++) {
                const progress = i / branchLength;
                const distance = progress * (100 + Math.random() * 100);
                
                currentX = startX + Math.cos(angle) * distance;
                currentY = startY + Math.sin(angle + Math.PI/4) * distance;
                currentX += (Math.random() - 0.5) * 40;
                
                branch.segments.push({ x: currentX, y: currentY });
            }
            
            parentBolt.branches.push(branch);
        }
        
        drawBolt(bolt) {
            if (!this.ctx) return;
            
            const opacity = bolt.life / bolt.maxLife;
            
            // Super bright outer glow
            this.ctx.strokeStyle = '#FFFF00';
            this.ctx.lineWidth = bolt.thickness * 6;
            this.ctx.globalAlpha = opacity * 0.3;
            this.ctx.shadowBlur = 60;
            this.ctx.shadowColor = '#FFFF00';
            this.drawPath(bolt.segments);
            
            // Mid glow
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = bolt.thickness * 3;
            this.ctx.globalAlpha = opacity * 0.6;
            this.ctx.shadowBlur = 40;
            this.ctx.shadowColor = '#FFD700';
            this.drawPath(bolt.segments);
            
            // Bright core
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = bolt.thickness;
            this.ctx.globalAlpha = opacity;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#FFFFFF';
            this.drawPath(bolt.segments);
            
            // Draw branches
            bolt.branches.forEach(branch => {
                this.ctx.strokeStyle = '#FFFF00';
                this.ctx.lineWidth = bolt.thickness * 0.8;
                this.ctx.globalAlpha = opacity * 0.7;
                this.ctx.shadowBlur = 20;
                this.drawPath(branch.segments);
            });
            
            this.ctx.globalAlpha = 1;
            this.ctx.shadowBlur = 0;
        }
        
        drawPath(segments) {
            if (!this.ctx || segments.length < 2) return;
            
            this.ctx.beginPath();
            this.ctx.moveTo(segments[0].x, segments[0].y);
            
            for (let i = 1; i < segments.length; i++) {
                this.ctx.lineTo(segments[i].x, segments[i].y);
            }
            
            this.ctx.stroke();
        }
        
        animate() {
            if (!this.ctx || !this.canvas) return;
            
            // Very slow fade for trail effect
            this.ctx.fillStyle = this.colors.background;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Create bolts frequently
            if (Date.now() > this.nextStrike && this.bolts.length < this.maxBolts) {
                this.bolts.push(this.createBolt());
                this.nextStrike = Date.now() + 20 + Math.random() * 200;
            }
            
            // Update and draw
            this.bolts = this.bolts.filter(bolt => {
                bolt.life--;
                if (bolt.life > 0) {
                    this.drawBolt(bolt);
                    return true;
                }
                return false;
            });
            
            this.animationId = requestAnimationFrame(() => this.animate());
        }
        
        destroy() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    }
    
    // Start immediately when DOM is ready
    function startLightning() {
        try {
            // Remove any Three.js initialization
            if (window.threeAnimation) {
                window.threeAnimation = null;
            }
            
            // Clean up any existing instance
            if (window.lightningBackground) {
                if (window.lightningBackground.destroy) {
                    window.lightningBackground.destroy();
                }
                window.lightningBackground = null;
            }
            
            window.lightningBackground = new LightningBackground();
            console.log('⚡ Lightning background ACTIVE! Canvas should be visible.');
            
            // Debug: Check if canvas is actually there
            setTimeout(() => {
                const canvas = document.getElementById('lightning-canvas');
                if (canvas) {
                    console.log('⚡ Canvas found:', canvas.style.cssText);
                    console.log('⚡ Canvas dimensions:', canvas.width, 'x', canvas.height);
                } else {
                    console.error('⚡ ERROR: Canvas not found!');
                }
            }, 500);
            
        } catch (error) {
            console.error('⚡ Lightning error:', error);
        }
    }
    
    // Better initialization logic
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // DOM is already ready
        setTimeout(startLightning, 100);
    } else {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(startLightning, 100);
        });
    }
})();