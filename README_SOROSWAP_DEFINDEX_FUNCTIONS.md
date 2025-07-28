# Soroswap & Defindex AI Function List

This document lists all the functions your AI DeFi assistant (Verbex AI) can support for **Soroswap** and **Defindex** protocols. Each function includes a description, required parameters, and example user prompts.

---

## Soroswap Functions

### 1. Swap Tokens
- **Function:** `swap`
- **Description:** Swap one token for another using Soroswap pools/aggregator.
- **Parameters:**
  - `userAddress` (string): User's wallet address
  - `fromAsset` (string): Asset to swap from (contract address)
  - `toAsset` (string): Asset to swap to (contract address)
  - `amount` (number): Amount to swap
- **Example Prompt:**
  - "Swap 100 XLM for USDC"
  - "Convert my USDC to wBTC"

### 2. Add Liquidity
- **Function:** `addLiquidity`
- **Description:** Add liquidity to a Soroswap pool.
- **Parameters:**
  - `userAddress` (string)
  - `poolId` (string): Pool contract address
  - `amounts` (object): Asset contract addresses and amounts to add
- **Example Prompt:**
  - "Add liquidity to the XLM/USDC pool"

### 3. Remove Liquidity
- **Function:** `removeLiquidity`
- **Description:** Remove liquidity from a Soroswap pool.
- **Parameters:**
  - `userAddress` (string)
  - `poolId` (string)
  - `lpAmount` (number): Amount of LP tokens to remove
- **Example Prompt:**
  - "Remove my liquidity from wBTC/USDC"

### 4. View Pool Stats
- **Function:** `getPoolStats`
- **Description:** View statistics for a Soroswap pool.
- **Parameters:**
  - `poolId` (string)
- **Example Prompt:**
  - "Show me the stats for the XLM/USDC pool"

### 5. View My LP Positions
- **Function:** `getUserLPPositions`
- **Description:** View user's LP token balances and positions.
- **Parameters:**
  - `userAddress` (string)
- **Example Prompt:**
  - "What’s my LP balance?"

### 6. Stake LP Tokens (if available)
- **Function:** `stakeLP`
- **Description:** Stake Soroswap LP tokens for rewards.
- **Parameters:**
  - `userAddress` (string)
  - `lpToken` (string)
  - `amount` (number)
- **Example Prompt:**
  - "Stake my LP tokens for rewards"

### 7. Find Best Swap Route
- **Function:** `findBestSwap`
- **Description:** Find the best swap route for a given asset and amount.
- **Parameters:**
  - `fromAsset` (string)
  - `toAsset` (string, optional)
  - `amount` (number)
- **Example Prompt:**
  - "Swap my XLM for the highest-yielding asset"

---

## Defindex Functions

### 1. Invest in Strategy
- **Function:** `invest`
- **Description:** Invest in a Defindex strategy.
- **Parameters:**
  - `userAddress` (string)
  - `strategyId` (string)
  - `amount` (number)
  - `asset` (string)
- **Example Prompt:**
  - "Invest 500 USDC in the top Defindex strategy"

### 2. Withdraw from Strategy
- **Function:** `withdraw`
- **Description:** Withdraw funds from a Defindex strategy.
- **Parameters:**
  - `userAddress` (string)
  - `strategyId` (string)
  - `amount` (number)
- **Example Prompt:**
  - "Withdraw my funds from Defindex"

### 3. View Strategy Performance
- **Function:** `getStrategyPerformance`
- **Description:** View APY and performance for Defindex strategies.
- **Parameters:**
  - `strategyId` (string, optional)
- **Example Prompt:**
  - "Show me the APY for Defindex strategies"

### 4. List Available Strategies
- **Function:** `listStrategies`
- **Description:** List all available Defindex strategies.
- **Parameters:**
  - None
- **Example Prompt:**
  - "Show me available Defindex strategies"

### 5. Create/Customize Strategy
- **Function:** `createStrategy`
- **Description:** Create a new custom Defindex strategy.
- **Parameters:**
  - `userAddress` (string)
  - `allocations` (object): Asset -> percent
- **Example Prompt:**
  - "Create a new strategy with 60% XLM, 40% USDC"

### 6. Rebalance Portfolio
- **Function:** `rebalancePortfolio`
- **Description:** Rebalance user’s portfolio to target allocations.
- **Parameters:**
  - `userAddress` (string)
  - `allocations` (object): Asset -> percent
- **Example Prompt:**
  - "Rebalance my portfolio to 60% XLM, 40% USDC"

### 7. Auto-Invest/Compound
- **Function:** `autoInvest`
- **Description:** Set up automatic investment or compounding.
- **Parameters:**
  - `userAddress` (string)
  - `asset` (string)
  - `amount` (number)
  - `frequency` (string)
- **Example Prompt:**
  - "Auto-invest my rewards every week"

### 8. Find Best Yield
- **Function:** `getBestYield`
- **Description:** Find the best yield opportunity for a given asset and amount across all protocols.
- **Parameters:**
  - `asset` (string)
  - `amount` (number)
- **Example Prompt:**
  - "What’s the best yield for my USDC?"

### 9. Set Smart Alert
- **Function:** `setAlert`
- **Description:** Set up a smart alert for APY, price, or position changes.
- **Parameters:**
  - `userAddress` (string)
  - `type` (string): e.g., 'apy', 'price', 'position'
  - `threshold` (number)
  - `asset` (string)
- **Example Prompt:**
  - "Alert me if APY drops below 5% on USDC"

---

## Cross-Protocol/AI Features

### 1. Portfolio Overview
- **Function:** `getPortfolioOverview`
- **Description:** Show all DeFi balances and positions across protocols.
- **Parameters:**
  - `userAddress` (string)
- **Example Prompt:**
  - "Show all my DeFi balances"

### 2. Smart Recommendations
- **Function:** `recommendStrategy`
- **Description:** Recommend the best strategy or action based on user’s assets and market data.
- **Parameters:**
  - `userAddress` (string)
  - `asset` (string, optional)
  - `amount` (number, optional)
- **Example Prompt:**
  - "What should I do with my USDC?"

### 3. Automated Flows
- **Function:** `executeFlow`
- **Description:** Execute a sequence of actions (swap, invest, stake, etc.).
- **Parameters:**
  - `userAddress` (string)
  - `actions` (array): List of actions to execute
- **Example Prompt:**
  - "Swap XLM for USDC, then invest in Defindex"

---

**You can extend this list as new protocol features are released!** 