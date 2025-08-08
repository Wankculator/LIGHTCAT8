# Desktop UI Documentation - LIGHTCAT

## Overview
This document provides comprehensive implementation details for the LIGHTCAT desktop UI to ensure consistency and prevent breaking changes during future updates.

## Desktop Breakpoints
- **Primary breakpoint**: 769px and above
- **Large desktop**: 1200px+
- **Standard desktop**: 1024px-1199px
- **Small desktop/tablet**: 769px-1023px

## Critical Desktop Implementations

### 1. Three.js Background Canvas
**Location**: `index.html` lines ~3100-3500
```javascript
// Three.js initialization
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('three-canvas'),
    alpha: true,
    antialias: true 
});

// Lightning effect particles
const lightningParticles = new THREE.Points(geometry, material);
scene.add(lightningParticles);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updateLightning();
    renderer.render(scene, camera);
}
```
**Critical**: Full viewport background, handles resize events, performance optimized.

### 2. Header Implementation (Desktop)
**Location**: `index.html` lines ~2600-2750, main styles ~500-650

#### Structure:
```html
<header>
    <div class="container">
        <div class="header-content">
            <div class="logo-section">
                <img class="logo" /> <!-- 40px on desktop -->
                <div>
                    <h1 class="site-title">LIGHTCAT</h1> <!-- 1.5rem -->
                    <p class="tagline">First Cat Meme Token on RGB Protocol</p> <!-- Hidden on mobile -->
                </div>
            </div>
            <nav>
                <a href="#stats">Home</a>
                <a href="#game">Game</a>
                <a href="#purchase">Buy</a>
                <a href="#about">About</a>
            </nav>
        </div>
    </div>
</header>
```

#### Key Desktop Styles:
- **Transparent background**: `rgba(0, 0, 0, 0.2)` with backdrop-filter
- **Fixed positioning**: Sticky header with blur effect
- **Height**: 80px standard
- **Logo**: 40px with glow effect
- **Navigation**: Horizontal with hover effects

### 3. Hero Section (Desktop Only)
**Location**: `index.html` lines ~2750-2800

```css
.hero-section {
    min-height: 100vh;
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
}

.lightning-rain {
    position: absolute;
    width: 100%;
    height: 100%;
    background: url('data:image/svg+xml,...') repeat;
    animation: rain 20s linear infinite;
    opacity: 0.1;
}
```
**Critical**: Full viewport height, parallax lightning effect, smooth animations.

### 4. Stats Grid (Desktop)
**Location**: `index.html` lines ~1150-1200

#### Desktop Grid:
```css
@media (min-width: 769px) {
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 30px;
    }
    
    .stat-card {
        padding: 30px;
        min-height: 150px;
        background: linear-gradient(135deg, 
            rgba(255, 215, 0, 0.1) 0%, 
            rgba(255, 215, 0, 0.02) 100%);
        border: 2px solid rgba(255, 215, 0, 0.3);
        position: relative;
        overflow: hidden;
    }
    
    .stat-card::before {
        /* Animated border glow effect */
        content: '';
        position: absolute;
        inset: -2px;
        background: linear-gradient(45deg, 
            transparent, #FFD700, transparent);
        transform: rotate(0deg);
        animation: rotate-border 4s linear infinite;
    }
}
```
**Critical**: 4-column grid, animated borders, full number display (no abbreviation).

### 5. Game Section (Desktop)
**Location**: `index.html` lines ~2780-2820

```css
.game-frame {
    width: 100%;
    max-width: 1200px;
    height: 600px;
    margin: 0 auto;
    border: 3px solid var(--yellow);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
}

.fullscreen-btn {
    position: absolute;
    bottom: 20px;
    right: 20px;
    padding: 15px 30px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid var(--yellow);
}
```
**Critical**: Large game area, prominent fullscreen button, glowing borders.

### 6. Purchase Tier Cards (Desktop)
**Location**: `index.html` lines ~2824-2870

```css
@media (min-width: 769px) {
    .tier-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30px;
    }
    
    .tier-card {
        padding: 40px;
        text-align: center;
        transform-style: preserve-3d;
        transition: all 0.3s ease;
    }
    
    .tier-card:hover {
        transform: translateY(-10px) rotateX(5deg);
        box-shadow: 0 20px 40px rgba(255, 215, 0, 0.3);
    }
    
    .tier-icon {
        font-size: 4rem;
        margin-bottom: 20px;
        display: block;
    }
}
```
**Critical**: 3-column grid, 3D hover effects, large icons, smooth animations.

### 7. Feature Boxes (Desktop)
**Location**: `index.html` lines ~2880-2920

```css
@media (min-width: 769px) {
    .features-grid {
        display: flex;
        gap: 30px;
        justify-content: center;
    }
    
    .feature-box {
        flex: 1;
        max-width: 350px;
        padding: 40px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 215, 0, 0.2);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
    }
    
    .feature-box:hover {
        transform: translateY(-5px);
        border-color: var(--yellow);
        background: rgba(255, 215, 0, 0.05);
    }
}
```
**Critical**: Equal height boxes, hover lift effect, backdrop blur.

### 8. Desktop Navigation
**Location**: `index.html` lines ~600-700

```css
nav {
    display: flex;
    gap: 30px;
    align-items: center;
}

nav a {
    color: var(--white);
    text-decoration: none;
    font-weight: 500;
    padding: 10px 20px;
    border-radius: 25px;
    transition: all 0.3s ease;
    position: relative;
}

nav a::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    width: 0;
    height: 2px;
    background: var(--yellow);
    transition: all 0.3s ease;
    transform: translateX(-50%);
}

nav a:hover::after {
    width: 80%;
}
```
**Critical**: Animated underline, smooth transitions, adequate spacing.

## Animation Systems

### 1. Lightning Strike Animation
```css
@keyframes lightning-strike {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
}

.lightning-text {
    background: linear-gradient(90deg, 
        #2a2a2a 0%,
        #2a2a2a 40%,
        #666666 48%,
        #FFFF00 50%,
        #FFFF00 52%,
        #666666 54%,
        #2a2a2a 62%,
        #2a2a2a 100%
    );
    background-size: 300% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: lightning-strike 4s ease-in-out infinite;
}
```

### 2. Particle Effects
```javascript
// Three.js particle system
const particleCount = 5000;
const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 1000;
    positions[i + 1] = (Math.random() - 0.5) * 1000;
    positions[i + 2] = (Math.random() - 0.5) * 1000;
}
```

### 3. Scroll Animations
```javascript
// GSAP scroll triggers
gsap.registerPlugin(ScrollTrigger);

gsap.from('.stat-card', {
    scrollTrigger: {
        trigger: '.stats-section',
        start: 'top 80%'
    },
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.1
});
```

## Desktop-Specific Features

### 1. Keyboard Shortcuts
```javascript
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'g': window.location.hash = '#game'; break;
        case 'b': window.location.hash = '#purchase'; break;
        case 'h': window.location.hash = '#stats'; break;
        case 'Escape': closeModals(); break;
    }
});
```

### 2. Mouse Interactions
- Parallax effects on hero section
- Hover states on all interactive elements
- Custom cursor on game area
- Tooltip displays for complex data

### 3. Advanced Visual Effects
- WebGL shaders for lightning
- CSS transforms for 3D effects
- Backdrop filters for glass morphism
- Animated SVG patterns

## Performance Optimizations

### 1. Resource Loading
```javascript
// Lazy load heavy resources
const lazyLoadGame = () => {
    if ('IntersectionObserver' in window) {
        const gameObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadGameResources();
                    gameObserver.unobserve(entry.target);
                }
            });
        });
        gameObserver.observe(document.querySelector('.game-section'));
    }
};
```

### 2. Animation Performance
```css
/* Use GPU acceleration */
.animated-element {
    will-change: transform;
    transform: translateZ(0);
}

/* Reduce paint areas */
.complex-animation {
    contain: layout style paint;
}
```

### 3. Memory Management
```javascript
// Clean up Three.js resources
function cleanup() {
    scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
    });
    renderer.dispose();
}
```

## Desktop Layout Grid System

### Container Widths:
```css
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

@media (min-width: 1400px) {
    .container { max-width: 1320px; }
}

@media (min-width: 1600px) {
    .container { max-width: 1480px; }
}
```

### Section Spacing:
```css
section {
    padding: 100px 0;
}

.section-title {
    font-size: 3rem;
    margin-bottom: 60px;
    text-align: center;
}
```

## Testing Checklist

### Visual Tests:
- [ ] Three.js background animating
- [ ] Header transparency/blur working
- [ ] Navigation hover effects smooth
- [ ] All animations running at 60fps
- [ ] Tier cards have 3D hover effect
- [ ] Lightning text animation visible
- [ ] Particle effects performing well

### Interaction Tests:
- [ ] Keyboard shortcuts functional
- [ ] Smooth scrolling between sections
- [ ] Hover states on all elements
- [ ] Game fullscreen works
- [ ] Forms don't require zoom
- [ ] Tooltips appear correctly

### Performance Tests:
- [ ] Page loads < 2 seconds
- [ ] Animations maintain 60fps
- [ ] No memory leaks after 10 minutes
- [ ] Three.js uses < 100MB RAM
- [ ] Network requests optimized

## Common Issues & Solutions

### Issue: Three.js Performance Drop
**Solution**: Reduce particle count, enable LOD, check texture sizes

### Issue: Animations Stuttering
**Solution**: Use transform instead of position, enable GPU acceleration

### Issue: Header Blur Not Working
**Solution**: Check browser support for backdrop-filter, provide fallback

### Issue: Large Desktop Layout Breaking
**Solution**: Add max-width constraints, test on 4K displays

## Maintenance Guidelines

1. **Preserve animation timing** - Users expect smooth 4s lightning strikes
2. **Maintain visual hierarchy** - Yellow accents on black background
3. **Keep performance targets** - 60fps animations minimum
4. **Test WebGL features** - Not all browsers support advanced effects
5. **Respect grid systems** - 12-column base, 4-3-2-1 responsive
6. **Document shader changes** - WebGL code is complex

## Browser Support

### Full Support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Degraded Experience:
- Older browsers: No WebGL effects
- Safari: Limited backdrop-filter
- Firefox: Some blend modes differ

## File Locations
- Main HTML: `/client/index.html`
- Desktop styles: Embedded in index.html
- Three.js scene: `/client/js/three-scene.js`
- Game files: `/client/js/game/`
- Production: `https://rgblightcat.com`

Last Updated: 2025-01-27
Version: 1.0.0