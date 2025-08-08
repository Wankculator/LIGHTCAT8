# MCP (Model Context Protocol) Setup Guide for LIGHTCAT

## 🎯 Recommended MCP Servers for LIGHTCAT Project

### 1. **Playwright MCP** - For E2E Testing
**Purpose**: Automated browser testing, UI validation, payment flow testing
```bash
# Install globally
npm install -g @playwright/test playwright

# Or add to project
cd /mnt/c/Users/sk84l/Downloads/RGB\ LIGHT\ CAT\ NEW/LIGHTCAT8
npm install --save-dev @playwright/test playwright
```

### 2. **PostgreSQL MCP** - For Supabase Database
**Purpose**: Direct database queries, migrations, performance monitoring
```bash
# Install PostgreSQL client first
sudo apt-get update
sudo apt-get install postgresql-client

# Install MCP server
npx @modelcontextprotocol/create-server postgres
```

### 3. **GitHub MCP** - For Version Control
**Purpose**: Repository management, issue tracking, PR automation
```bash
# Clone and setup
git clone https://github.com/modelcontextprotocol/servers.git
cd servers/github
npm install
npm run build
```

### 4. **Filesystem MCP** - For Advanced File Operations
**Purpose**: File watching, batch operations, secure file handling
```bash
# Built into Claude Desktop - no installation needed
```

## 📋 Windows Configuration (Claude Desktop)

### Step 1: Locate Config File
```powershell
# In Windows PowerShell (not WSL)
cd %APPDATA%\Claude
notepad claude_desktop_config.json
```

### Step 2: Add MCP Servers Configuration
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-playwright"],
      "env": {
        "HEADLESS": "false"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@db.supabase.co:5432/postgres"
      }
    },
    "github": {
      "command": "node",
      "args": ["C:/path/to/github-mcp/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem"],
      "env": {
        "BASE_PATH": "C:/Users/sk84l/Downloads/RGB LIGHT CAT NEW/LIGHTCAT8"
      }
    }
  }
}
```

## 🚀 Quick Setup Script

Create this script to install everything at once:

```bash
#!/bin/bash
# File: install-mcp-servers.sh

echo "🚀 Installing MCP servers for LIGHTCAT..."

# Update package managers
sudo apt-get update
npm update -g

# Install Playwright
echo "📦 Installing Playwright..."
npm install -g playwright
npx playwright install chromium

# Install PostgreSQL client
echo "📦 Installing PostgreSQL client..."
sudo apt-get install -y postgresql-client

# Create MCP directory
mkdir -p ~/mcp-servers
cd ~/mcp-servers

# Clone MCP servers repository
echo "📦 Cloning MCP servers..."
git clone https://github.com/modelcontextprotocol/servers.git

# Build servers
cd servers
npm install
npm run build

echo "✅ MCP servers installation complete!"
echo "📝 Now configure claude_desktop_config.json in Windows"
```

## 🔧 Project-Specific MCP Uses

### For LIGHTCAT Project:

1. **Playwright Testing**
   - Test game functionality
   - Validate payment flows
   - Check mobile responsiveness
   - Monitor Lightning invoice generation

2. **PostgreSQL/Supabase**
   - Query transaction data
   - Monitor token distribution
   - Check user statistics
   - Optimize database performance

3. **GitHub Integration**
   - Automated deployments
   - Issue management
   - Code reviews
   - Release notes generation

4. **Filesystem Operations**
   - Batch CSS updates
   - Log analysis
   - Asset optimization
   - Backup management

## 📦 Alternative: Using npx (No Installation)

If you prefer not to install globally, you can use npx:

```bash
# Run Playwright tests
npx playwright test

# Run PostgreSQL queries
npx @modelcontextprotocol/server-postgres query "SELECT * FROM transactions"

# Use GitHub MCP
npx @modelcontextprotocol/server-github list-repos
```

## 🔍 Testing MCP Connection

After setup, test in Claude:

1. Restart Claude Desktop
2. Check MCP servers are connected (look for icon in Claude)
3. Try a command:
   ```
   "Use Playwright to test rgblightcat.com"
   "Query Supabase database for recent transactions"
   "Check GitHub issues for LIGHTCAT repository"
   ```

## ⚠️ Important Notes

1. **Security**: Never commit MCP config files with credentials
2. **Paths**: Use absolute paths in Windows config
3. **Permissions**: Ensure MCP servers have necessary permissions
4. **Updates**: Keep MCP servers updated regularly

## 🆘 Troubleshooting

### MCP Not Connecting:
1. Check Claude Desktop is latest version
2. Verify config file JSON syntax
3. Ensure paths are correct (Windows format)
4. Check firewall isn't blocking

### Permission Errors:
```bash
# Fix permissions
chmod +x ~/mcp-servers/servers/*/dist/index.js
```

### Port Conflicts:
- Playwright: Default port 9323
- PostgreSQL: Default port 5432
- Change in config if needed

## 📚 Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [Playwright Docs](https://playwright.dev)
- [Supabase PostgreSQL](https://supabase.com/docs/guides/database)
- [GitHub MCP API](https://github.com/modelcontextprotocol/servers)

---

Ready to enhance LIGHTCAT with MCP capabilities! 🚀