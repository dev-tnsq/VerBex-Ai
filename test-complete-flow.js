// Test script to verify the complete signing flow
const testCompleteFlow = async () => {
  console.log('Testing complete signing flow...');
  
  // Test 1: MCP Helper POST endpoint
  console.log('\n1. Testing MCP Helper POST endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/mcp-helper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signedXdr: 'AAAAAB+LCAAAAAAAAAAAB9QAAAAAAAAAAQAAAAAAAAABAAAAAQAAAAA=',
        txHash: 'test_hash_123',
        action: 'lend',
        userAddress: 'GABC123456789',
        poolId: 'pool123',
        amount: '100',
        asset: 'USDC'
      }),
    });
    
    const result = await response.json();
    console.log('✅ MCP Helper POST result:', result);
  } catch (error) {
    console.log('❌ MCP Helper POST failed:', error.message);
  }
  
  // Test 2: MCP Helper GET endpoint
  console.log('\n2. Testing MCP Helper GET endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/mcp-helper');
    const result = await response.json();
    console.log('✅ MCP Helper GET result:', result);
  } catch (error) {
    console.log('❌ MCP Helper GET failed:', error.message);
  }
  
  // Test 3: MCP Server transaction result endpoint
  console.log('\n3. Testing MCP Server transaction result endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/transaction-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId: 'test_transaction_123',
        action: 'lend',
        userAddress: 'GABC123456789',
        poolId: 'pool123',
        amount: '100',
        asset: 'USDC',
        txHash: 'test_hash_123',
        signedXdr: 'AAAAAB+LCAAAAAAAAAAAB9QAAAAAAAAAAQAAAAAAAAABAAAAAQAAAAA=',
        status: 'SUCCESS'
      }),
    });
    
    const result = await response.json();
    console.log('✅ MCP Server transaction result result:', result);
  } catch (error) {
    console.log('❌ MCP Server transaction result failed:', error.message);
  }
  
  // Test 4: MCP Server retrieve transaction result endpoint
  console.log('\n4. Testing MCP Server retrieve transaction result endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/transaction-result/test_transaction_123');
    const result = await response.json();
    console.log('✅ MCP Server retrieve result:', result);
  } catch (error) {
    console.log('❌ MCP Server retrieve failed:', error.message);
  }
  
  console.log('\n✅ Complete flow test completed!');
  console.log('\nFlow Summary:');
  console.log('1. Frontend signs transaction');
  console.log('2. Transaction submitted to Stellar network');
  console.log('3. Result sent to MCP Helper');
  console.log('4. MCP Helper forwards to MCP Server');
  console.log('5. MCP Server stores result for Cursor');
  console.log('6. Cursor can retrieve and display transaction details');
};

testCompleteFlow().catch(console.error); 