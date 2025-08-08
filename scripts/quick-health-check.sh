#!/bin/bash
# Quick health check for LIGHTCAT development

echo "🏥 LIGHTCAT Health Check"
echo "========================"

# Check UI Server
echo -n "UI Server (8082): "
if curl -s http://localhost:8082/ | grep -q "RGBLightCat" 2>/dev/null; then
    echo "✅ OK"
else
    echo "❌ DOWN"
fi

# Check API Server
echo -n "API Server (3000): "
if curl -s http://localhost:3000/health | grep -q "ok" 2>/dev/null; then
    echo "✅ OK"
else
    echo "❌ DOWN"
fi

# Check RGB Stats Endpoint
echo -n "RGB Stats API: "
if curl -s http://localhost:3000/api/rgb/stats | grep -q "success" 2>/dev/null; then
    echo "✅ OK"
else
    echo "❌ ERROR"
fi

# Check Game
echo -n "Game Loading: "
if curl -s http://localhost:8082/game.html | grep -q "ProGame.js" 2>/dev/null; then
    echo "✅ OK"
else
    echo "❌ ERROR"
fi

# Check for recent errors
echo -n "Recent Errors: "
ERROR_COUNT=$(tail -20 server/logs/error.log 2>/dev/null | grep -c "ERROR" || echo "0")
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "✅ None"
else
    echo "⚠️  $ERROR_COUNT errors found"
fi

# Check mobile CSS
echo -n "Mobile CSS: "
if [ -f "client/css/mobile-optimized.css" ]; then
    echo "✅ Exists"
else
    echo "❌ Missing"
fi

echo "========================"

# Return appropriate exit code
if curl -s http://localhost:8082/ | grep -q "RGBLightCat" 2>/dev/null && \
   curl -s http://localhost:3000/health | grep -q "ok" 2>/dev/null; then
    echo "✅ System Ready"
    exit 0
else
    echo "❌ System Not Ready - Run: npm run dev"
    exit 1
fi