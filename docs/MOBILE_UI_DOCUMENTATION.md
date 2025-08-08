# Mobile UI Documentation - LIGHTCAT

## Overview
This document provides comprehensive implementation details for the LIGHTCAT mobile UI to prevent breaking changes during future updates.

## Mobile Breakpoints
- **Primary breakpoint**: 768px (tablets and below)
- **Small devices**: 480px
- **Extra small**: 375px  
- **Tiny devices**: 320px
- **Landscape**: 812px width + landscape orientation

## Critical Mobile Implementations

### 1. Number Formatting (Mobile-Aware)
**Location**: `index.html` lines ~368-383
```javascript
const formatNumber = (num) => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        if (num >= 1000000) {
            const millions = (num / 1000000).toFixed(1);
            return millions.endsWith('.0') ? millions.slice(0, -2) + 'M' : millions + 'M';
        } else if (num >= 10000) {
            const thousands = Math.round(num / 1000);
            return thousands + 'K';
        }
    } else {
        return num.toLocaleString();
    }
    return num.toLocaleString();
};
```
**Critical**: Updates on window resize event. Shows abbreviated numbers (1.2M, 28K) on mobile.

### 2. Header Implementation
**Location**: `index.html` lines ~2600-2750, `mobile-optimized.css` lines 51-193

#### Structure:
```html
<header>
    <div class="container">
        <div class="header-content">
            <div class="logo-section">
                <img class="logo" /> <!-- 60px on mobile -->
                <div>
                    <h1 class="site-title">LIGHTCAT</h1> <!-- 2.2rem -->
                    <p class="tagline">First Cat Meme Token on RGB Protocol</p> <!-- 1rem, animated -->
                </div>
            </div>
            <nav><!-- Hidden on mobile --></nav>
            <button class="mobile-menu-toggle"><!-- Mobile only --></button>
        </div>
    </div>
</header>
```

#### Key Mobile Styles:
- **Fixed header**: Solid black background (#000000)
- **Height**: Auto with min-height 110px
- **Logo**: 60px (increased from 40px)
- **Title**: 2.2rem (increased from 1.25rem)
- **Tagline**: 1rem with lightning-strike animation
- **Background override**: Forces solid black, removes transparency

### 3. Purchase Tier Grid (Horizontal Scroll)
**Location**: `index.html` lines ~2824-2845

#### Mobile Layout:
```css
@media (max-width: 768px) {
    .tier-grid {
        display: flex;
        overflow-x: auto;
        gap: 10px;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
    }
    
    .tier-card {
        flex: 0 0 auto;
        width: 110px;
        scroll-snap-align: center;
    }
}
```
**Critical**: Horizontal scrolling with snap points. Each card 110px wide.

### 4. Stats Grid Layout
**Location**: `index.html` lines ~1150-1200

#### Mobile Grid:
```css
@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr 1fr; /* 2 columns always */
        gap: 12px;
        margin: 0 -5px;
    }
    
    .stat-card {
        min-height: 100px;
        padding: 20px 10px;
    }
}
```
**Critical**: Always 2 columns, even on 320px screens. Uses formatNumber() for abbreviated values.

### 5. Feature Boxes (Uniform Layout)
**Location**: `index.html` lines ~2880-2920

#### Mobile Implementation:
```css
@media (max-width: 768px) {
    .features-grid {
        flex-direction: column;
        gap: 15px;
    }
    
    .feature-box {
        width: 100%;
        min-height: 90px;
        padding: 20px;
        margin: 0;
    }
}
```
**Critical**: Vertical stack, uniform 90px height, full width.

### 6. Spacing Optimization
**Location**: `index.html` lines ~2950-3050

#### Global Overrides:
```css
@media (max-width: 768px) {
    /* Override inline styles */
    section[style*="padding"] {
        padding: 40px 0 !important;
    }
    
    .section-title {
        margin-bottom: 30px !important;
    }
    
    [style*="margin-bottom: 80px"] {
        margin-bottom: 40px !important;
    }
}
```
**Critical**: Uses !important to override inline styles. Reduces all large gaps.

### 7. Game Section
**Location**: `index.html` lines ~2780-2800

#### Mobile Adjustments:
- Game frame height: 400px (350px on 480px screens)
- Fullscreen button: Centered with flexbox
- Touch-friendly: 44px minimum height

### 8. Mobile Navigation Drawer
**Location**: `mobile-optimized.css` lines 432-562

#### Implementation:
- Slides in from right (-300px to 0)
- Full height overlay
- Touch-friendly links (44px height)
- Quick select grid for batch amounts

## Critical CSS Files

### 1. mobile-optimized.css
- Primary mobile styles
- Emergency fixes at end (lines 720+)
- Header black background overrides
- Touch target sizes

### 2. Inline Style Overrides (index.html)
```css
/* Emergency overrides for stubborn inline styles */
@media (max-width: 768px) {
    * {
        /* Reset any problematic inline styles */
    }
}
```

## JavaScript Mobile Enhancements

### 1. Resize Event Listener
```javascript
window.addEventListener('resize', debounce(() => {
    updateAllNumbers();
    updateProgressBar();
}, 250));
```

### 2. Mobile Menu Toggle
```javascript
document.querySelector('.mobile-menu-toggle')?.addEventListener('click', () => {
    document.querySelector('.mobile-nav').classList.toggle('open');
    document.querySelector('.mobile-nav-overlay').classList.toggle('show');
});
```

### 3. Touch Event Optimizations
- Disabled tap highlight: `-webkit-tap-highlight-color: transparent`
- Smooth scrolling: `-webkit-overflow-scrolling: touch`
- Prevents zoom on input: `font-size: 16px` on form controls

## Testing Checklist

### Visual Tests:
- [ ] Header solid black on all pages
- [ ] Logo and title properly sized
- [ ] Tagline visible and animated
- [ ] Numbers show as 1.2M format
- [ ] Tier cards scroll horizontally
- [ ] Feature boxes uniform height
- [ ] No large gaps between sections

### Functional Tests:
- [ ] Mobile menu opens/closes
- [ ] Touch targets ≥ 44px
- [ ] Horizontal scroll works on tiers
- [ ] Numbers update on orientation change
- [ ] Game fullscreen button works
- [ ] Forms don't zoom on focus

### Device-Specific Tests:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (landscape/portrait)
- [ ] 320px width devices

## Common Issues & Solutions

### Issue: Header Shows Transparency
**Solution**: Check `mobile-optimized.css` lines 6-11 for override styles

### Issue: Large Numbers Don't Abbreviate  
**Solution**: Verify formatNumber() and resize listener in index.html

### Issue: Sections Have Large Gaps
**Solution**: Check inline style overrides in index.html (~line 2950)

### Issue: Tier Cards Stack Vertically
**Solution**: Ensure `.tier-grid` has `display: flex` not `grid` on mobile

## Maintenance Guidelines

1. **Never remove !important flags** in mobile-optimized.css without testing
2. **Test all breakpoints** when modifying styles
3. **Maintain 44px minimum** touch targets
4. **Keep formatNumber()** logic intact
5. **Preserve header structure** and class names
6. **Test on real devices**, not just browser DevTools

## File Locations
- Main HTML: `/client/index.html`
- Mobile CSS: `/client/css/mobile-optimized.css`
- Deployment: `rgblightcat.com`
- Local dev: `http://localhost:8082`

Last Updated: 2025-01-27
Version: 1.0.0