#!/bin/bash

echo "🔍 Testing rgblightcat.com deployment status..."
echo "================================================"

# Test if site is accessible
echo -e "\n📡 Testing site availability..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://rgblightcat.com)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Site is accessible (HTTP $HTTP_STATUS)"
else
    echo "❌ Site returned HTTP $HTTP_STATUS"
fi

# Check for lightning CSS
echo -e "\n🎨 Checking for lightning-background.css..."
curl -s https://rgblightcat.com | grep -q "lightning-background.css"
if [ $? -eq 0 ]; then
    echo "✅ Lightning CSS is referenced in HTML"
    
    # Check if CSS file exists
    CSS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://rgblightcat.com/css/lightning-background.css)
    if [ "$CSS_STATUS" = "200" ]; then
        echo "✅ Lightning CSS file is accessible"
        
        # Check for escaped characters
        curl -s https://rgblightcat.com/css/lightning-background.css | grep -q '\\!'
        if [ $? -eq 0 ]; then
            echo "❌ WARNING: CSS contains escaped characters (\\!important)"
        else
            echo "✅ CSS appears to be properly formatted"
        fi
    else
        echo "❌ Lightning CSS file returns HTTP $CSS_STATUS"
    fi
else
    echo "❌ Lightning CSS is NOT referenced in HTML"
fi

# Check for lightning JS
echo -e "\n📜 Checking for lightning-background.js..."
curl -s https://rgblightcat.com | grep -q "lightning-background.js"
if [ $? -eq 0 ]; then
    echo "✅ Lightning JS is referenced in HTML"
    
    # Check if JS file exists
    JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://rgblightcat.com/js/lightning-background.js)
    if [ "$JS_STATUS" = "200" ]; then
        echo "✅ Lightning JS file is accessible"
        
        # Check for escaped characters in CSS string
        curl -s https://rgblightcat.com/js/lightning-background.js | grep -q 'cssText.*\\!'
        if [ $? -eq 0 ]; then
            echo "❌ WARNING: JS contains escaped characters in CSS string"
        else
            echo "✅ JS appears to be properly formatted"
        fi
    else
        echo "❌ Lightning JS file returns HTTP $JS_STATUS"
    fi
else
    echo "❌ Lightning JS is NOT referenced in HTML"
fi

# Check for medal emojis
echo -e "\n🏆 Checking for medal emojis in HTML..."
MEDAL_COUNT=$(curl -s https://rgblightcat.com | grep -o '[🥇🥈🥉]' | wc -l)
if [ "$MEDAL_COUNT" -gt 0 ]; then
    echo "⚠️  Found $MEDAL_COUNT medal emoji(s) in HTML"
else
    echo "✅ No medal emojis found in HTML"
fi

# Check specific JS files for tier messages
echo -e "\n🔍 Checking tier-related JS files..."
for file in "main-page-tier-detector.js" "tier-display-restart-fix.js" "critical-fixes.js"; do
    FILE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://rgblightcat.com/js/$file)
    if [ "$FILE_STATUS" = "200" ]; then
        echo "  $file: Found (HTTP $FILE_STATUS)"
    else
        echo "  $file: Not found or inaccessible (HTTP $FILE_STATUS)"
    fi
done

echo -e "\n================================================"
echo "📋 DEPLOYMENT SUMMARY:"
echo "================================================"

# Final recommendations
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Site is live and accessible"
    
    # Check deployment status
    CSS_OK=$(curl -s -o /dev/null -w "%{http_code}" https://rgblightcat.com/css/lightning-background.css)
    JS_OK=$(curl -s -o /dev/null -w "%{http_code}" https://rgblightcat.com/js/lightning-background.js)
    
    if [ "$CSS_OK" != "200" ] || [ "$JS_OK" != "200" ]; then
        echo "❌ Lightning effect files need to be deployed"
        echo "   Run: scp client/css/lightning-background.css root@147.93.105.138:/var/www/rgblightcat/client/css/"
        echo "   Run: scp client/js/lightning-background.js root@147.93.105.138:/var/www/rgblightcat/client/js/"
    else
        ESCAPED=$(curl -s https://rgblightcat.com/js/lightning-background.js | grep -c 'cssText.*\\!')
        if [ "$ESCAPED" -gt 0 ]; then
            echo "⚠️  Lightning JS has escaped characters - needs fix"
        else
            echo "✅ Lightning effect files are properly deployed"
        fi
    fi
else
    echo "❌ Site is not accessible - check server status"
fi