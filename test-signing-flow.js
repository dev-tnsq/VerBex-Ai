// Test script to verify the signing flow
const testSigningFlow = async () => {
  console.log('Testing signing flow...');
  
  // Test URL generation
  const testParams = {
    xdr: 'AAAAAB+LCAAAAAAAAAAAB9QAAAAAAAAAAQAAAAAAAAABAAAAAQAAAAA=',
    action: 'lend',
    userAddress: 'GABC123456789',
    poolId: 'pool123',
    amount: '100',
    asset: 'USDC'
  };
  
  const signingUrl = `http://localhost:3000/passkey/sign?xdr=${encodeURIComponent(testParams.xdr)}&action=${testParams.action}&userAddress=${testParams.userAddress}&poolId=${testParams.poolId}&amount=${testParams.amount}&asset=${testParams.asset}`;
  
  console.log('Generated signing URL:', signingUrl);
  console.log('URL length:', signingUrl.length);
  
  // Test MCP response format
  const mcpResponse = {
    status: 'NEEDS_SIGNATURE',
    signingUrl: signingUrl,
    unsignedXDR: testParams.xdr
  };
  
  console.log('MCP Response:', JSON.stringify(mcpResponse, null, 2));
  
  // Test frontend parameters parsing
  const url = new URL(signingUrl);
  const params = {
    xdr: url.searchParams.get('xdr'),
    action: url.searchParams.get('action'),
    userAddress: url.searchParams.get('userAddress'),
    poolId: url.searchParams.get('poolId'),
    amount: url.searchParams.get('amount'),
    asset: url.searchParams.get('asset')
  };
  
  console.log('Parsed parameters:', params);
  
  // Test action descriptions
  const actionDescriptions = {
    lend: `Lend ${params.amount} ${params.asset} to pool ${params.poolId}`,
    withdraw: `Withdraw ${params.amount} ${params.asset} from pool ${params.poolId}`,
    borrow: `Borrow ${params.amount} ${params.asset} from pool ${params.poolId}`,
    repay: `Repay ${params.amount} ${params.asset} to pool ${params.poolId}`,
    claimRewards: `Claim rewards from pool ${params.poolId}`,
    createPool: `Create new lending pool`,
    addReserve: `Add reserve to pool ${params.poolId}`,
    buyNft: `Buy NFT`,
    swap: `Swap ${params.amount} ${params.asset} on Soroswap`,
    addLiquidity: `Add liquidity to Soroswap pool`,
    removeLiquidity: `Remove liquidity from Soroswap pool`,
    createVault: `Create DeFindex vault`,
    deposit: `Deposit to vault`,
    'withdraw-vault': `Withdraw from vault`
  };
  
  console.log('Action description:', actionDescriptions[params.action]);
  
  console.log('✅ Signing flow test completed successfully!');
};

testSigningFlow().catch(console.error); 