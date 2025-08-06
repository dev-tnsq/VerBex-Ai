/**
 * Passkey Kit Integration Example
 * 
 * This example demonstrates how to use the Passkey Kit integration
 * with the DeFi MCP server to perform DeFi operations without
 * handling private keys directly.
 */

// Example: Create a passkey wallet for a user
const createWalletExample = {
  userId: "user123",
  action: "createPasskeyWallet"
};

// Example: Register an existing wallet for passkey operations
const registerWalletExample = {
  userId: "user123",
  address: "GDVKGWDSAGPP3HBWLUIBIKH4ZCHNFNQJ7J2HSPY3T7YEEJJXASVYWQV6",
  secretKey: "your_secret_key_here", // In production, this would be securely stored
  action: "registerWallet"
};

// Example: Get wallet information
const getWalletInfoExample = {
  userId: "user123",
  action: "getWalletInfo"
};

// Example: Lend assets using passkey authentication
const lendWithPasskeyExample = {
  userId: "user123",
  amount: 100,
  asset: "XLM", // Uses the known asset address automatically
  poolId: "CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5",
  action: "lend"
};

// Example: Sign a transaction with passkey
const signTransactionExample = {
  userId: "user123",
  unsignedXDR: "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",
  action: "signWithPasskey"
};

// Example: Remove wallet (for logout)
const removeWalletExample = {
  userId: "user123",
  action: "removeWallet"
};

// Example: Create a vault using passkey
const createVaultExample = {
  userId: "user123",
  asset: "XLM",
  strategyId: "CBO77JLVAT54YBRHBY4PSITLILWAAXX5JHPXGBFRW2XUFQKXZ3ZLJ7MJ",
  initialDeposit: 100,
  vaultName: "My XLM Vault",
  action: "createVault"
};

// Example: Swap assets using passkey
const swapExample = {
  userId: "user123",
  fromAsset: "XLM",
  toAsset: "USDC",
  amount: 50,
  maxSlippage: 0.5,
  routeType: "amm",
  action: "swap"
};

// Example: Add liquidity using passkey
const addLiquidityExample = {
  userId: "user123",
  tokenA: "XLM",
  tokenB: "USDC",
  amountA: 100,
  amountB: 200,
  autoBalance: true,
  action: "addLiquidity"
};

/**
 * Complete Workflow Example
 * 
 * This demonstrates the complete flow from creating a passkey wallet
 * to performing DeFi operations without handling private keys.
 */

const completeWorkflow = async () => {
  console.log("🚀 Starting Passkey Kit DeFi Workflow");
  
  // Step 1: Create a passkey wallet
  console.log("1. Creating passkey wallet...");
  // await createPasskeyWallet({ userId: "user123" });
  
  // Step 2: Check wallet info
  console.log("2. Checking wallet information...");
  // await getWalletInfo({ userId: "user123" });
  
  // Step 3: Perform DeFi operations
  console.log("3. Performing DeFi operations...");
  
  // Lend assets
  // await lend({ userId: "user123", amount: 100, asset: "XLM", poolId: "pool_id" });
  
  // Create vault
  // await createVault({ userId: "user123", asset: "XLM", strategyId: "strategy_id", initialDeposit: 100 });
  
  // Swap assets
  // await swap({ userId: "user123", fromAsset: "XLM", toAsset: "USDC", amount: 50 });
  
  console.log("✅ Workflow completed successfully!");
};

// Export examples for use in documentation
export {
  createWalletExample,
  registerWalletExample,
  getWalletInfoExample,
  lendWithPasskeyExample,
  signTransactionExample,
  removeWalletExample,
  createVaultExample,
  swapExample,
  addLiquidityExample,
  completeWorkflow
}; 