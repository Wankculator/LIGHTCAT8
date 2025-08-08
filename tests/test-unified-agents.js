#!/usr/bin/env node

/**
 * Test script for Unified Agents integration
 */

const { initializeUnifiedAgents } = require('./agents/unified-agents');

async function testUnifiedAgents() {
  console.log('🧪 Testing Unified Agents Integration...\n');

  try {
    // Initialize the unified agents
    console.log('1. Initializing Unified Agents...');
    const orchestrator = await initializeUnifiedAgents();
    console.log('✅ Unified Agents initialized successfully\n');

    // Test agent selection
    console.log('2. Testing agent selection...');
    const manager = orchestrator.unifiedManager;
    
    const paymentAgent = manager.selectAgent('payment');
    console.log(`✅ Payment task → Selected: ${paymentAgent.name}`);
    
    const rgbAgent = manager.selectAgent('rgb');
    console.log(`✅ RGB task → Selected: ${rgbAgent.name}`);
    
    const deploymentAgent = manager.selectAgent('deployment');
    console.log(`✅ Deployment task → Selected: ${deploymentAgent.name}\n`);

    // Test agent creation
    console.log('3. Testing agent creation...');
    const testAgent = await manager.createAgent('fintech-specialist', {
      testMode: true
    });
    console.log(`✅ Created agent: ${testAgent.id}`);
    console.log(`   Type: ${testAgent.type}`);
    console.log(`   Status: ${testAgent.status}`);
    console.log(`   MCP Tools: ${Array.from(testAgent.mcpTools.keys()).join(', ')}\n`);

    // Test task execution
    console.log('4. Testing task execution...');
    const result = await manager.executeTask(testAgent, {
      action: 'validate_payment_flow',
      testMode: true
    });
    console.log(`✅ Task completed in ${result.duration}ms`);
    console.log(`   Results: ${result.results.length} steps completed\n`);

    // Test workflow creation
    console.log('5. Testing workflow creation...');
    const rgbWorkflow = await orchestrator.createRGBReviewWorkflow();
    console.log(`✅ Created RGB Review Workflow: ${rgbWorkflow.name}`);
    console.log(`   ID: ${rgbWorkflow.id}`);
    console.log(`   Steps: ${rgbWorkflow.steps.length}`);
    
    const deployWorkflow = await orchestrator.createDeploymentWorkflow();
    console.log(`✅ Created Deployment Workflow: ${deployWorkflow.name}`);
    console.log(`   ID: ${deployWorkflow.id}`);
    console.log(`   Steps: ${deployWorkflow.steps.length}\n`);

    // Display configuration
    console.log('6. Configuration Summary:');
    console.log(`   Available agents: ${Object.keys(manager.config.agents).length}`);
    console.log(`   Max concurrent agents: ${manager.config.integrationSettings.maxConcurrentAgents}`);
    console.log(`   Timeout: ${manager.config.integrationSettings.timeoutMinutes} minutes`);
    console.log(`   Auto-selection: ${manager.config.integrationSettings.enableAutoSelection}\n`);

    console.log('✅ All tests passed! Unified Agents are ready to use.\n');
    
    console.log('📚 Example usage in your code:');
    console.log('```javascript');
    console.log('const { initializeUnifiedAgents } = require("./agents/unified-agents");');
    console.log('const orchestrator = await initializeUnifiedAgents();');
    console.log('');
    console.log('// Use a single agent');
    console.log('const agent = await orchestrator.unifiedManager.createAgent("fintech-specialist");');
    console.log('const result = await orchestrator.unifiedManager.executeTask(agent, {');
    console.log('  action: "validate_payment_flow"');
    console.log('});');
    console.log('```');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testUnifiedAgents().catch(console.error);