#!/bin/bash

# LIGHTCAT Hot Fix Script
# Quickly fix specific UI components

COMPONENT=${1:-all}

echo "🔥 LIGHTCAT Hot Fix - Component: $COMPONENT"
echo "========================================="

case $COMPONENT in
  "mobile")
    echo "📱 Fixing mobile UI..."
    # Inject mobile fixes directly
    cat > client/css/mobile-hot-fix.css << 'EOF'
/* MOBILE HOT FIX - IMMEDIATE FIXES */
@media screen and (max-width: 768px) {
    /* Force visibility */
    * { opacity: 1 !important; visibility: visible !important; }
    
    /* Section titles white */
    .section-title { color: #FFFFFF !important; }
    .section-title:active { color: #FFD700 !important; }
    
    /* Stat cards compact */
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
    .stat-card { padding: 12px 8px !important; }
    .stat-number { font-size: 1.5rem !important; }
    .stat-label { font-size: 0.75rem !important; }
    
    /* Buttons touch-friendly */
    button, .btn { min-height: 44px !important; }
}
EOF
    echo "✅ Mobile hot fix applied!"
    ;;
    
  "stats")
    echo "📊 Fixing stats section..."
    # Fix stats specifically
    cat >> client/index.html << 'EOF'
<style id="stats-hot-fix">
#stats .section-title { color: #FFFFFF !important; }
#stats .section-title:hover { color: #FFD700 !important; }
.stat-card { background: rgba(0,0,0,0.5) !important; border: 1px solid rgba(255,215,0,0.3) !important; }
</style>
EOF
    echo "✅ Stats hot fix applied!"
    ;;
    
  "all")
    echo "🎯 Applying all hot fixes..."
    $0 mobile
    $0 stats
    echo "✅ All hot fixes applied!"
    ;;
    
  *)
    echo "Usage: $0 [mobile|stats|all]"
    exit 1
    ;;
esac

echo ""
echo "🚀 Next steps:"
echo "1. Check locally: http://localhost:8082"
echo "2. Deploy: ./deploy.sh client"