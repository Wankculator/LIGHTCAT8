# 🚀 Instructions for Bolt.new (or similar AI services)

## Package Contents:
Your `mobile-fix-package` folder contains:
- `index.html` - The main website file
- `css/` - All CSS files including current mobile styles
- `requirements.md` - Detailed requirements and issues
- `current-issues.md` - Visual representation of problems
- `test-page.html` - Simplified test page to verify fixes

## 🎯 Copy-Paste Prompt for Bolt.new:

```
I need you to fix mobile UI issues for a crypto token website. The main problems are:

1. STAT CARDS: Remove empty space below text in frames. Currently there's ~30px of wasted space under the numbers/labels. Make frames fit tightly with only 8px padding.

2. SECTION TITLE: Change "LIVE MINT STATUS" from yellow to white (#FFFFFF) by default, yellow (#FFD700) only on hover/tap.

3. RESPONSIVE: Ensure everything fits on 320px width screens without overflow.

4. TOUCH TARGETS: All buttons/interactive elements need minimum 44px height.

The stat cards should display:
- 4,397 Batches Sold
- 25,603 Remaining  
- 3,077,900 Tokens Sold
- 45 Unique Wallets

Please create mobile-optimized CSS that:
- Uses @media (max-width: 768px) for mobile styles
- Removes all unnecessary spacing in stat cards
- Makes text fit perfectly in frames
- Maintains black/gold color scheme
- Keeps professional crypto aesthetic

Test on iPhone SE (375x667) viewport. The site is live at https://rgblightcat.com
```

## 📁 How to Upload to Bolt.new:

1. **Option A - Upload Files**:
   - Upload `index.html`
   - Upload `css/mobile-optimized.css`
   - Upload `css/mobile-complete-fix.css`
   - Upload `requirements.md`

2. **Option B - Use Test Page**:
   - Just upload `test-page.html` for a simplified version
   - This shows all the issues in one file

3. **Option C - Link to Live Site**:
   - Provide: https://rgblightcat.com
   - Mention: "View on mobile to see spacing issues in stat cards"

## ✅ Expected Output:

Bolt.new should provide you with:
1. Updated CSS file with mobile fixes
2. Possibly updated HTML if structure changes needed
3. Preview showing the fixes work

## 🔧 After Receiving Fixes:

1. Test the CSS locally first
2. Copy the fixed CSS to your project
3. Deploy using: `./deploy.sh client`

## 💡 Pro Tips:

- Ask Bolt to "show before/after comparison"
- Request "test on multiple viewport sizes"
- Say "maintain existing functionality, only fix mobile CSS"
- Mention "professional crypto/gaming aesthetic"

The package is ready at:
`/mnt/c/Users/sk84l/Downloads/RGB LIGHT CAT/litecat-website/mobile-fix-package/`

Or as compressed file:
`/mnt/c/Users/sk84l/Downloads/RGB LIGHT CAT/litecat-website/mobile-fix-package.tar.gz`