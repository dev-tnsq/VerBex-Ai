// Test script for the enhanced Dynamic Execution Engine
const { DynamicExecutionEngine } = require('./lib/dynamic-execution-engine.ts');

async function testEngine() {
  console.log('🚀 Testing Enhanced Dynamic Execution Engine...\n');
  
  const engine = new DynamicExecutionEngine();
  const testWallet = 'GCKFBEIYTKP6RCZX6HOHHJJMCEWXKC5BKPJJBJDQAYIIN6YGKBKM7A4X';
  
  // Test cases
  const testCases = [
    {
      name: 'Simple Balance Check',
      message: 'Show my token balances',
      expected: 'Should call getUserBalances'
    },
    {
      name: 'Lending Workflow',
      message: 'Lend 100 XLM to the best Blend pool',
      expected: 'Should call getAvailablePools then lend'
    },
    {
      name: 'Swap Workflow',
      message: 'Swap 50 XLM for USDC',
      expected: 'Should call swap directly'
    },
    {
      name: 'Portfolio Analysis',
      message: 'Show me my complete DeFi portfolio with analysis',
      expected: 'Should call multiple functions and provide analysis'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`💬 Message: "${testCase.message}"`);
    console.log(`🎯 Expected: ${testCase.expected}`);
    console.log('⏳ Executing...\n');
    
    try {
      const startTime = Date.now();
      const context = await engine.executeUserIntent(testCase.message, testWallet);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Completed in ${duration}ms`);
      console.log(`📊 Steps executed: ${context.steps.length}`);
      console.log(`🏁 Final status: ${context.isComplete ? 'Complete' : 'Incomplete'}`);
      
      if (context.pendingTransaction) {
        console.log(`🔐 Transaction ready for signing`);
        console.log(`📝 Summary: ${context.pendingTransaction.summary}`);
      } else {
        console.log(`💬 Response: ${context.finalResponse.substring(0, 200)}...`);
      }
      
      // Show step details
      context.steps.forEach((step, i) => {
        console.log(`  Step ${i + 1}: ${step.functionName} (${step.status})`);
        if (step.executionTime) {
          console.log(`    ⏱️  ${step.executionTime}ms`);
        }
        if (step.error) {
          console.log(`    ❌ ${step.error}`);
        }
      });
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testEngine().catch(console.error);
}

module.exports = { testEngine };// Test script for the enhanced Dynamic Execution Engine
const { DynamicExecutionEngine } = require('./lib/dynamic-execution-engine.ts');

async function testEngine() {
  console.log('🚀 Testing Enhanced Dynamic Execution Engine...\n');
  
  const engine = new DynamicExecutionEngine();
  const testWallet = 'GCKFBEIYTKP6RCZX6HOHHJJMCEWXKC5BKPJJBJDQAYIIN6YGKBKM7A4X';
  
  // Test cases
  const testCases = [
    {
      name: 'Simple Balance Check',
      message: 'Show my token balances',
      expected: 'Should call getUserBalances'
    },
    {
      name: 'Lending Workflow',
      message: 'Lend 100 XLM to the best Blend pool',
      expected: 'Should call getAvailablePools then lend'
    },
    {
      name: 'Swap Workflow',
      message: 'Swap 50 XLM for USDC',
      expected: 'Should call swap directly'
    },
    {
      name: 'Portfolio Analysis',
      message: 'Show me my complete DeFi portfolio with analysis',
      expected: 'Should call multiple functions and provide analysis'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`💬 Message: "${testCase.message}"`);
    console.log(`🎯 Expected: ${testCase.expected}`);
    console.log('⏳ Executing...\n');
    
    try {
      const startTime = Date.now();
      const context = await engine.executeUserIntent(testCase.message, testWallet);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Completed in ${duration}ms`);
      console.log(`📊 Steps executed: ${context.steps.length}`);
      console.log(`🏁 Final status: ${context.isComplete ? 'Complete' : 'Incomplete'}`);
      
      if (context.pendingTransaction) {
        console.log(`🔐 Transaction ready for signing`);
        console.log(`📝 Summary: ${context.pendingTransaction.summary}`);
      } else {
        console.log(`💬 Response: ${context.finalResponse.substring(0, 200)}...`);
      }
      
      // Show step details
      context.steps.forEach((step, i) => {
        console.log(`  Step ${i + 1}: ${step.functionName} (${step.status})`);
        if (step.executionTime) {
          console.log(`    ⏱️  ${step.executionTime}ms`);
        }
        if (step.error) {
          console.log(`    ❌ ${step.error}`);
        }
      });
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testEngine().catch(console.error);
}

module.exports = { testEngine };