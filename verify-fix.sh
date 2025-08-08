#!/bin/bash

echo "🔍 Verifying lightning-background.js fix..."
echo "==========================================="

# Check local file
echo -e "\n📁 LOCAL FILE CHECK:"
if [ -f "client/js/lightning-background.js" ]; then
    LOCAL_ESCAPED=$(grep -c '\\!' client/js/lightning-background.js)
    if [ "$LOCAL_ESCAPED" -eq 0 ]; then
        echo "✅ Local file is FIXED (no escaped characters)"
    else
        echo "❌ Local file has $LOCAL_ESCAPED escaped character(s)"
    fi
else
    echo "❌ Local file not found"
fi

# Check deployed file
echo -e "\n🌐 DEPLOYED FILE CHECK:"
DEPLOYED_ESCAPED=$(curl -s https://rgblightcat.com/js/lightning-background.js 2>/dev/null | grep -c '\\!')
if [ "$DEPLOYED_ESCAPED" -eq 0 ]; then
    echo "✅ Deployed file is FIXED (no escaped characters)"
else
    echo "❌ Deployed file has $DEPLOYED_ESCAPED escaped character(s)"
    echo "   The file needs to be deployed to the server"
fi

# Check if canvas creation line is correct
echo -e "\n🎨 CSS STRING CHECK:"
curl -s https://rgblightcat.com/js/lightning-background.js 2>/dev/null | grep -q 'cssText.*position:fixed !important'
if [ $? -eq 0 ]; then
    echo "✅ CSS string appears correct"
else
    echo "⚠️  CSS string may have issues"
fi

# Summary
echo -e "\n==========================================="
echo "📋 SUMMARY:"
if [ "$DEPLOYED_ESCAPED" -eq 0 ]; then
    echo "✅ Lightning effect should be working!"
    echo "   Visit https://rgblightcat.com and check for yellow lightning bolts"
else
    echo "❌ Deployment needed!"
    echo "   The fixed file needs to be deployed to the server"
    echo "   See deploy-fixes.sh for manual deployment instructions"
fi