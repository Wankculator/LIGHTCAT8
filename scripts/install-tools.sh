#!/bin/bash
# LIGHTCAT Tools Installation Script

echo "🚀 Installing essential tools for LIGHTCAT..."

# Install Playwright for testing
echo "📦 Installing Playwright..."
npm install -g playwright
npx playwright install-deps
npx playwright install chromium

# Install database tools
echo "📦 Installing PostgreSQL client..."
sudo apt-get update
sudo apt-get install -y postgresql-client

# Install monitoring tools
echo "📦 Installing monitoring tools..."
npm install -g lighthouse
npm install -g @lhci/cli

# Install security tools
echo "📦 Installing security scanners..."
npm install -g snyk
npm install -g npm-audit-resolver

# Install development tools
echo "📦 Installing dev tools..."
npm install -g nodemon
npm install -g pm2
npm install -g concurrently

echo "✅ Installation complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Configure MCP in Claude Desktop (Windows)"
echo "2. Set up environment variables"
echo "3. Run tests: npx playwright test"
echo "4. Check site: lighthouse https://rgblightcat.com"