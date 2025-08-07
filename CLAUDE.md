# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview
LIGHTCAT is an RGB Protocol token platform featuring:
- First cat meme token on RGB Protocol (Bitcoin)
- Lightning Network payment integration via BTCPay Server
- Gamified purchase system with Three.js arcade game
- 21M token supply (700 tokens per batch @ 2,000 sats each)
- Real-time WebSocket updates and progress tracking
- Mobile-responsive professional UI

## 🏗️ Architecture & Structure

### Directory Layout:
```
/
├── client/              # Frontend (Vanilla JS, no frameworks)
│   ├── js/game/        # Three.js game files
│   ├── css/            # Styles (mobile-optimized.css)
│   └── index.html      # Main SPA entry point
├── server/             # Express.js backend
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic (RGB, Lightning, Supabase)
│   ├── routes/         # API endpoints
│   └── app.js         # Server entry point
├── docs/               # Comprehensive documentation
│   ├── ARCHITECTURE.md # System design and components
│   ├── API_REFERENCE.md # Complete API documentation
│   ├── PAYMENT_FLOW.md # RGB + Lightning flow details
│   ├── GAME_MECHANICS.md # Game logic and scoring
│   ├── SECURITY.md     # Security measures and checklist
│   ├── DEPLOYMENT.md   # Production deployment guide
│   ├── DATABASE_SCHEMA.md # Supabase schema details
│   └── TROUBLESHOOTING.md # Common issues and solutions
├── scripts/           # Deployment and utility scripts
└── tests/            # Jest test suites
```

### Key Technologies:
- **Backend**: Node.js, Express.js, WebSockets
- **Database**: Supabase (PostgreSQL with RLS)
- **Payments**: BTCPay Server (Lightning), RGB Protocol
- **Frontend**: Vanilla JavaScript, Three.js
- **Security**: JWT auth, rate limiting, CSP headers

## 📋 Common Commands

### Development:
```bash
cd litecat-website

# Start development servers (UI on 8082, API on 3000)
npm run dev

# Run specific servers
npm run dev:client    # UI only
npm run dev:server    # API only

# Database operations
npm run db:migrate    # Run migrations
node scripts/migrate-supabase.js  # Supabase setup
```

### Testing & Validation:
```bash
# Run tests
npm test                      # Unit tests
npm run test:coverage        # With coverage report
npm run test:e2e            # E2E tests

# Code quality
npm run lint                 # ESLint check
npm run lint:fix            # Auto-fix issues
npm run security:audit      # Security audit

# MCP validations (if available)
npm run mcp:validate-all    # Run all validations
npm run mcp:watch          # Watch mode
```

### Deployment:
```bash
# Build for production
npm run build

# Deploy scripts
./deploy-mobile-fix.sh      # Deploy mobile CSS fixes
./scripts/deploy-production.sh  # Full production deploy
```

## 🔐 Critical Payment Flow (DO NOT BREAK)

### RGB Invoice Flow:
1. User enters RGB invoice (format: `rgb:utxob:...`)
2. Backend validates and creates Lightning invoice
3. User pays Lightning invoice via QR/copy
4. System polls for payment confirmation
5. On payment: generates RGB consignment file
6. User downloads consignment to complete transfer

### Key Files:
- `/server/controllers/rgbPaymentController.js` - Payment endpoints
- `/server/services/rgbService.js` - RGB consignment generation
- `/server/services/lightningService.js` - BTCPay integration
- `/client/index.html` (lines ~1900-2000) - Invoice UI

### Critical Constants:
- Lightning invoice expiry: 15 minutes
- Payment polling interval: 3 seconds
- Max batches: Bronze=5, Silver=8, Gold=10
- Batch price: 2,000 sats

## 🎮 Game Integration

### Score to Tier Mapping:
```javascript
// DON'T CHANGE without testing purchase flow
if (score >= 28) return 'gold';    // 10 batches max
if (score >= 18) return 'silver';  // 8 batches max  
if (score >= 11) return 'bronze';  // 5 batches max
return null;                        // No unlock
```

### Game Files:
- `/client/js/game/ProGame.js` - Main game logic
- `/client/js/game/main.js` - Game initialization
- `/client/game.html` - Game container

## 🚨 Security Requirements

### Never Do:
- Store private keys in code/localStorage
- Expose internal API endpoints
- Remove rate limiting
- Disable CORS protections
- Use Math.random() for crypto
- Commit .env files

### Always Do:
- Validate Bitcoin addresses
- Sanitize all inputs
- Use parameterized queries
- Implement idempotency keys
- Check payment amounts
- Log security events

## 📱 Mobile Requirements

### Minimum Touch Targets:
```css
/* All interactive elements */
button, a, input, select {
    min-height: 44px;
    min-width: 44px;
}
```

### Responsive Breakpoints:
- 320px: Small phones
- 375px: Standard phones
- 768px: Tablets
- 1024px: Desktop

### Button Styling Guidelines:
1. **Text Centering**:
   - Use flexbox: `display: flex; align-items: center; justify-content: center;`
   - Set `line-height: 1` to prevent vertical spacing issues
   - Include `box-sizing: border-box` for consistent sizing
   
2. **Padding Rules**:
   - Use equal horizontal padding (e.g., `padding: 0 15px`)
   - Avoid inline styles that override CSS
   - Test alignment on all breakpoints

3. **MAX Button Specific**:
   - Font sizes: Desktop 0.875rem → Mobile 0.5rem
   - Min width adjusts per breakpoint
   - Letter spacing reduces on smaller screens

## 🐛 Common Issues & Fixes

### Payment Not Detected:
```bash
# Check webhook
curl http://localhost:3000/api/webhooks/lightning

# Check payment status
curl http://localhost:3000/api/rgb/invoice/[UUID]/status

# View logs
tail -f server/logs/rgb-payments.log
```

### Game Won't Load:
```bash
# Verify assets
ls -la client/game/assets/

# Check Three.js
curl -I http://localhost:8082/js/game/ProGame.js

# Test game page
curl http://localhost:8082/game.html | grep "game-canvas"
```

### RGB Invoice Errors:
```bash
# Test validation
curl -X POST http://localhost:3000/api/rgb/invoice \
  -H "Content-Type: application/json" \
  -d '{"rgbInvoice": "rgb:utxob:test", "batchCount": 1}'
```

## ⚡ Performance Targets

- Page load: < 2 seconds
- API response: < 200ms
- Lightning invoice: < 1 second  
- Payment detection: < 5 seconds
- Game FPS: 60 (min: 30)

## 📚 Documentation

Complete documentation is available in the `/docs` directory:

- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design, components, data flow
- **[API Reference](docs/API_REFERENCE.md)** - All endpoints with examples
- **[Payment Flow](docs/PAYMENT_FLOW.md)** - Detailed RGB + Lightning integration
- **[Game Mechanics](docs/GAME_MECHANICS.md)** - Scoring, physics, anti-cheat
- **[Security Guide](docs/SECURITY.md)** - Security measures and best practices
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production setup and monitoring
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - Complete Supabase schema
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## 🤖 Recursive Agent System & MCP Integration

### Agent Architecture:
The LIGHTCAT project uses a recursive agent system with MCP (Model Context Protocol) tools for automation.

#### Available Agents:
1. **E2ETestAgent** - Automated E2E testing with Playwright MCP
2. **DatabaseOptimizationAgent** - DB performance with PostgreSQL MCP
3. **SecurityAuditAgent** - Security scanning and fixes
4. **DeploymentAgent** - Automated deployment workflows
5. **PerformanceOptimizationAgent** - Performance profiling and fixes

#### MCP Servers Integrated:
- **Phase 1 (Complete)**:
  - `mcp__playwright` - Browser automation for testing
  - `mcp__postgresql` - Database operations
  - `mcp__slack` - Team notifications
  
- **Planned**:
  - `mcp__bitcoin` - Bitcoin network operations
  - `mcp__lightning` - Lightning Network monitoring
  - `mcp__sonarqube` - Code quality analysis

### Using Agents:
```javascript
// Example: Run E2E tests
const orchestrator = new MasterOrchestrator();
await orchestrator.executeWorkflow({
  name: 'Test Payment Flow',
  tasks: [{
    type: 'E2ETestAgent',
    config: {
      testSuite: 'payment',
      baseUrl: 'http://localhost:8082'
    }
  }]
});
```

### Agent Guidelines:
1. **When to use agents**:
   - Complex multi-step tasks
   - Tasks requiring specialized MCP tools
   - Automated testing and monitoring
   - Performance optimization
   
2. **Agent best practices**:
   - Always validate task configuration
   - Monitor resource usage
   - Handle errors gracefully
   - Use sub-agents for complex workflows
   
3. **MCP tool usage**:
   - Initialize MCP manager before use
   - Track usage with MCPUsageTracker
   - Handle tool unavailability
   - Respect rate limits

### Files:
- `/agents/` - Agent implementations
- `/agents/utils/MCPServerManager.js` - MCP server management
- `/agents/mcp-server-configs.json` - MCP configurations
- `/agents/templates/` - Agent templates

## 🔄 Git Workflow

### Branch Naming:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `perf/description` - Performance
- `docs/description` - Documentation

### Before Committing:
```bash
# Must pass all
npm run lint
npm test
curl http://localhost:8082/      # UI loads
curl http://localhost:3000/health # API responds
```

### Code Standards:
- No `console.log` in production code
- All async functions must have error handling
- Comments only when logic is complex
- Prefer descriptive variable names over comments
- Follow existing code style in each file

## 🚀 Quick Start After Clone

```bash
# 1. Install dependencies
cd litecat-website
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 3. Setup database
npm run db:migrate
node scripts/migrate-supabase.js

# 4. Start development
npm run dev

# 5. Open browser
# UI: http://localhost:8082
# API: http://localhost:3000
```

## 🤖 Recursive Agent System

LIGHTCAT includes a powerful recursive agent system for complex automation tasks. Agents can spawn sub-agents, leverage MCP tools, and handle multi-step workflows.

### Available Agent Templates:
- **[Security Audit Agent](agents/templates/LIGHTCAT_SECURITY_AUDIT_AGENT.md)** - Comprehensive security scanning
- **[Performance Optimization Agent](agents/templates/LIGHTCAT_PERFORMANCE_OPTIMIZATION_AGENT.md)** - System-wide optimization
- **[Deployment Agent](agents/templates/LIGHTCAT_DEPLOYMENT_AGENT.md)** - Zero-downtime deployments

### Agent System Documentation:
- **[Agent Architecture](agents/AGENT_SYSTEM_ARCHITECTURE.md)** - Complete system design
- **[MCP Integration](agents/MCP_INTEGRATION_GUIDE.md)** - Model Context Protocol tools
- **[Orchestration System](agents/ORCHESTRATION_SYSTEM.md)** - Workflow management

### Quick Agent Usage:

```javascript
// Example: Run security audit
const orchestrator = new MasterOrchestrator();

await orchestrator.executeWorkflow({
  name: 'Security Audit',
  tasks: [{
    type: 'LIGHTCAT_SECURITY_AUDIT_AGENT',
    config: { 
      autoFix: true,
      depth: 'comprehensive' 
    }
  }]
});
```

### MCP Tools Available:
- `mcp__code_analyzer` - Deep code analysis
- `mcp__vulnerability_scanner` - Security scanning
- `mcp__performance_profiler` - Performance analysis
- `mcp__docker_manager` - Container operations
- `mcp__database_optimizer` - Query optimization
- And many more...

### Best Practices:
1. Use agents for complex, multi-step tasks
2. Leverage MCP tools for specialized operations
3. Monitor agent resource usage
4. Implement proper error handling
5. Use recursive agents for divide-and-conquer approaches

Last Updated: 2025-08-04
Version: 2.1.0