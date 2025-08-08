#!/usr/bin/env node

/**
 * Test MCP Integration - Demonstrates the new MCP server capabilities
 */

const { MasterOrchestrator } = require('./agents/MasterOrchestrator');
const { getInstance: getMCPManager } = require('./agents/utils/MCPServerManager');
const { getInstance: getUsageTracker } = require('./agents/utils/MCPUsageTracker');

async function testMCPIntegration() {
  console.log('🚀 Testing MCP Integration for LIGHTCAT\n');
  
  const orchestrator = new MasterOrchestrator();
  const mcpManager = getMCPManager();
  const usageTracker = getUsageTracker({
    enablePeriodicReports: true,
    reportInterval: 60000 // 1 minute
  });
  
  try {
    // Initialize MCP servers
    console.log('📦 Initializing MCP servers...');
    await mcpManager.initialize();
    
    const loadedServers = mcpManager.getLoadedServers();
    console.log(`✅ Loaded ${loadedServers.length} MCP servers:`, loadedServers);
    
    // Health check all servers
    console.log('\n🏥 Running health checks...');
    const health = await mcpManager.healthCheck();
    console.log('Health status:', JSON.stringify(health, null, 2));
    
    // Test 1: E2E Testing with Playwright
    console.log('\n🧪 Test 1: E2E Testing with Playwright MCP');
    const e2eWorkflow = {
      name: 'E2E Test Workflow',
      tasks: [{
        type: 'E2ETestAgent',
        config: {
          testSuite: 'smoke',
          baseUrl: 'http://localhost:8082',
          options: {
            screenshotOnSuccess: false,
            contextOptions: {
              viewport: { width: 1920, height: 1080 }
            }
          },
          notifications: true
        }
      }]
    };
    
    console.log('Running smoke tests...');
    const e2eResult = await orchestrator.executeWorkflow(e2eWorkflow);
    console.log('E2E Test Results:', {
      success: e2eResult.success,
      summary: e2eResult.tasks[0].result.summary
    });
    
    // Test 2: Database Optimization
    console.log('\n🗄️ Test 2: Database Optimization with PostgreSQL MCP');
    const dbWorkflow = {
      name: 'Database Optimization Workflow',
      tasks: [{
        type: 'DatabaseOptimizationAgent',
        config: {
          mode: 'analyze',
          tables: ['payments', 'game_sessions'],
          options: {
            slowQueryThreshold: 50
          },
          notifications: true
        }
      }]
    };
    
    console.log('Analyzing database performance...');
    const dbResult = await orchestrator.executeWorkflow(dbWorkflow);
    console.log('Database Analysis:', {
      success: dbResult.success,
      overallHealth: dbResult.tasks[0].result.results.overallHealth,
      tablesAnalyzed: Object.keys(dbResult.tasks[0].result.results.tables)
    });
    
    // Test 3: Combined Workflow
    console.log('\n🔄 Test 3: Combined Workflow');
    const combinedWorkflow = {
      name: 'Full System Check',
      tasks: [
        {
          type: 'DatabaseOptimizationAgent',
          config: {
            mode: 'monitor',
            options: {
              checkReplication: false
            }
          }
        },
        {
          type: 'E2ETestAgent', 
          config: {
            testSuite: 'game',
            baseUrl: 'http://localhost:8082'
          },
          dependencies: []  // Run in parallel
        }
      ]
    };
    
    console.log('Running full system check...');
    const combinedResult = await orchestrator.executeWorkflow(combinedWorkflow);
    console.log('Combined Results:', {
      success: combinedResult.success,
      tasksCompleted: combinedResult.tasks.length
    });
    
    // Get usage statistics
    console.log('\n📊 MCP Usage Statistics:');
    const usageReport = usageTracker.getReport({
      includePercentiles: true,
      topCount: 5
    });
    
    console.log('Total operations:', usageReport.totalOperations);
    console.log('Top operations:', usageReport.topOperations.map(op => ({
      operation: `${op.server}:${op.operation}`,
      calls: op.calls,
      avgDuration: `${op.avgDuration.toFixed(2)}ms`
    })));
    
    // Export metrics
    console.log('\n📈 Exporting metrics...');
    const metrics = usageTracker.exportMetrics('json');
    await usageTracker.writeReport('mcp-test-report.json');
    console.log('Report saved to: ./logs/mcp-usage/mcp-test-report.json');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    usageTracker.stopPeriodicReporting();
    await mcpManager.shutdown();
    await orchestrator.shutdown();
  }
  
  console.log('\n✅ MCP Integration test completed successfully!');
}

// Run if executed directly
if (require.main === module) {
  testMCPIntegration().catch(console.error);
}

module.exports = { testMCPIntegration };