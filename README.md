# 🚀 Verbex AI - Agentic DeFi Assistant & MCP Protocol

> **Revolutionizing DeFi on Stellar with AI-Powered Portfolio Management & Multi-Protocol Integration**

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/VerbexAi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue.svg)](https://stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)

## 🎯 Project Overview

Verbex AI is a cutting-edge DeFi platform that combines **AI-powered conversational assistance** with **Model Context Protocol (MCP) integration** to provide seamless access to Stellar's DeFi ecosystem. Our platform integrates **Blend Protocol** (lending/borrowing), **Soroswap** (DEX), and **DeFindex** (yield farming) into a unified, intelligent interface.

### 🌟 Key Features

- **🤖 AI-Powered DeFi Assistant**: Conversational interface powered by Google Gemini
- **🔗 MCP Integration**: Direct blockchain interaction through Model Context Protocol
- **💼 Multi-Protocol Portfolio**: Unified view across Blend, Soroswap, and DeFindex
- **🔐 Secure Wallet Integration**: Freighter wallet with passkey authentication
- **📊 Real-Time Analytics**: Portfolio health, yield optimization, and risk assessment
- **🎨 Retro-Futuristic UI**: Modern design with nostalgic gaming aesthetics
- **⚡ Advanced Transaction Flow**: Smart signing URLs and transaction management

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   MCP Server    │    │   Blockchain    │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Stellar)     │
│                 │    │                 │    │                 │
│ • Gemini Chat   │    │ • Blend Service │    │ • Blend Protocol│
│ • Wallet Connect│    │ • Soroswap Svc  │    │ • Soroswap DEX  │
│ • Portfolio UI  │    │ • DeFindex Svc  │    │ • DeFindex Vault│
│ • Transaction   │    │ • Portfolio Svc │    │ • Smart Contracts│
│   Signing       │    │ • Stellar Svc   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Yarn or npm
- Freighter Wallet (Stellar)
- Stellar Testnet account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/VerbexAi.git
cd VerbexAi

# Install dependencies
yarn install

# Install MCP dependencies
cd Mcp && yarn install && cd ..

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate deploy

# Start the development server
yarn dev
```

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Stellar Configuration
STELLAR_NETWORK="testnet"
STELLAR_RPC_URL="https://soroban-testnet.stellar.org"

# MCP Server
MCP_SERVER_URL="http://localhost:3001"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Soroswap API
SOROSWAP_API_KEY="your-soroswap-api-key"
SOROSWAP_API_BASE="https://soroswap-api-staging-436722401508.us-central1.run.app"
```

## 🎮 Usage Guide

### 1. AI-Powered DeFi Assistant

Start a conversation with our Gemini-powered assistant:

```bash
# Ask about your portfolio
"Show my complete DeFi portfolio across Blend and Soroswap"

# Request complex operations
"Swap 100 XLM to USDC with best route optimization"

# Get yield recommendations
"Find the best yield opportunities for my risk tolerance"

# Execute multi-step operations
"Lend 500 USDC to Blend pool, then add 200 XLM to Soroswap liquidity"
```

### 2. MCP Integration

Use our MCP server for direct blockchain interactions:

```bash
# Start MCP server
cd Mcp && yarn start

# Available MCP Functions:
# loadPoolData
# getTokenBalance
# getPoolEvents
# loadBackstopData
# load TokenMetadata
# lend
# withdraw-pool
# borrow
# repay
# claimRewards createPool
# addReserve
# buyNft
# getAvailableSoroswapPools
# getUserLPPositions
# getPrice
# getAssetList
# getUserTokenBalances
# swap
# addLiquidity
# removeLiquidity
# getAvailableVaults
# getAvailableStrategies
# getUserPositions
# getVaultAnalytics
# getYieldOpportunities
# getBalance
# createVault
# deposit
# withdraw-vault
```

### 3. Advanced Transaction Flow

Our platform provides a sophisticated transaction signing experience:

1. **AI Assistant** generates transaction parameters
2. **MCP Server** creates unsigned XDR
3. **Signing URL** directs to dedicated signing page
4. **Wallet Integration** handles secure signing
5. **Transaction Submission** to Stellar network
6. **Result Reporting** back to AI assistant

## 🔧 Complex Features & Capabilities

### Multi-Protocol Portfolio Management

```typescript
// Unified portfolio across all protocols
const portfolio = {
  blend: {
    positions: [...],
    totalValue: "1,250 USDC",
    healthScore: 85
  },
  soroswap: {
    lpPositions: [...],
    totalValue: "2,100 XLM",
    impermanentLoss: "2.3%"
  },
  defindex: {
    vaults: [...],
    totalValue: "850 USDC",
    apy: "12.5%"
  }
}
```

### Advanced Yield Optimization

- **Cross-Protocol Arbitrage**: Automatically identify and execute profitable opportunities
- **Risk-Adjusted Returns**: Calculate optimal allocations based on risk tolerance
- **Impermanent Loss Protection**: Monitor and rebalance LP positions
- **Liquidation Prevention**: Real-time monitoring of lending positions

### Complex Transaction Sequences

```typescript
// Example: Multi-step DeFi strategy
const strategy = [
  "1. Swap 500 XLM to USDC (Soroswap)",
  "2. Lend 300 USDC to Blend pool",
  "3. Add 200 USDC to Soroswap LP",
  "4. Create DeFindex vault with remaining USDC"
];
```

### Real-Time Analytics & Alerts

- **Portfolio Health Monitoring**: Track position health across protocols
- **Price Impact Analysis**: Calculate optimal trade sizes
- **Gas Fee Optimization**: Route transactions for minimal costs
- **Risk Assessment**: Real-time risk scoring and alerts

## 🚀 Advanced Workflows & Use Cases

### 1. **Portfolio Analysis & Optimization Workflow**

```bash
# Complete portfolio health check
"Analyze my entire DeFi portfolio across all protocols"

# Workflow: loadPoolData → getTokenBalance → getUserLPPositions → getUnifiedPortfolioOverview
# Result: Comprehensive portfolio analysis with recommendations
```

**Complex Analysis Chain:**
1. **Load Pool Metadata** → Get pool configuration and risk parameters
2. **Get Token Balances** → Aggregate holdings across protocols
3. **Get LP Positions** → Analyze liquidity provision performance
4. **Get User Positions** → Cross-protocol position analysis
5. **Yield Analysis** → Identify optimization opportunities
6. **Risk Assessment** → Portfolio risk scoring and alerts

### 2. **Advanced Yield Farming Strategy**

```bash
# Multi-protocol yield optimization
"Find the best yield opportunities across Blend, Soroswap, and DeFindex"

# Workflow: getAvailableSoroswapPools → getAvailableVaults → getYieldOpportunities → optimizeYield
```

**Strategy Execution:**
1. **Pool Discovery** → `getAvailableSoroswapPools()` - Find all available liquidity pools
2. **Vault Analysis** → `getAvailableVaults()` - Identify DeFindex vault opportunities
3. **Yield Comparison** → `getYieldOpportunities()` - Compare APYs across protocols
4. **Position Optimization** → `optimizeYield()` - Generate rebalancing transactions
5. **Risk Assessment** → `riskAnalysis()` - Ensure optimal risk/reward ratio

### 3. **Cross-Protocol Arbitrage Workflow**

```bash
# Automated arbitrage detection and execution
"Find arbitrage opportunities between Blend lending and Soroswap trading"

# Workflow: getPrice → loadPoolData → swap → lend/borrow
```

**Arbitrage Chain:**
1. **Price Discovery** → `getPrice()` - Get real-time asset prices
2. **Pool Analysis** → `loadPoolData()` - Check lending rates and liquidity
3. **Opportunity Detection** → Compare lending APY vs trading spreads
4. **Execution Planning** → `swap()` + `lend()` - Execute arbitrage strategy
5. **Position Monitoring** → Track arbitrage performance

### 4. **Risk Management & Rebalancing**

```bash
# Automated portfolio rebalancing
"Rebalance my portfolio to 40% XLM, 30% USDC, 20% BTC, 10% LP positions"

# Workflow: getUnifiedPortfolioOverview → suggestRebalance → execute transactions
```

**Rebalancing Process:**
1. **Current State** → `getUnifiedPortfolioOverview()` - Analyze current allocation
2. **Target Calculation** → Calculate required trades for target allocation
3. **Transaction Building** → `suggestRebalance()` - Generate optimal swap XDRs
4. **Execution** → Execute rebalancing transactions
5. **Verification** → Confirm new allocation matches targets

### 5. **Advanced Lending Strategy**

```bash
# Complex lending optimization
"Lend my XLM to Blend, then use borrowed USDC for Soroswap liquidity"

# Workflow: loadPoolData → lend → borrow → addLiquidity
```

**Lending Strategy:**
1. **Pool Research** → `loadPoolData()` - Analyze lending pool parameters
2. **Collateral Deposit** → `lend()` - Deposit XLM as collateral
3. **Borrowing** → `borrow()` - Borrow USDC against XLM collateral
4. **Liquidity Provision** → `addLiquidity()` - Add USDC to Soroswap pools
5. **Yield Optimization** → Monitor and optimize lending/borrowing ratios

### 6. **DeFindex Vault Management**

```bash
# Advanced vault strategy
"Create a DeFindex vault for USDC and optimize its performance"

# Workflow: getAvailableStrategies → createVault → deposit → getVaultAnalytics
```

**Vault Management:**
1. **Strategy Selection** → `getAvailableStrategies()` - Choose optimal strategy
2. **Vault Creation** → `createVault()` - Initialize new vault
3. **Capital Deployment** → `deposit()` - Fund the vault
4. **Performance Monitoring** → `getVaultAnalytics()` - Track vault performance
5. **Optimization** → Adjust strategy based on analytics

### 7. **Multi-Step DeFi Operations**

```bash
# Complex multi-protocol operation
"Take 1000 XLM, swap 60% to USDC, lend 40% USDC to Blend, add 30% to Soroswap LP, create DeFindex vault with remaining 30%"

# Workflow: swap → lend → addLiquidity → createVault → deposit
```

**Multi-Step Execution:**
1. **Asset Conversion** → `swap()` - Convert XLM to USDC
2. **Lending Position** → `lend()` - Create lending position
3. **Liquidity Provision** → `addLiquidity()` - Add to Soroswap pools
4. **Vault Creation** → `createVault()` - Set up DeFindex vault
5. **Capital Allocation** → `deposit()` - Fund the vault

### 8. **Portfolio Health Monitoring**

```bash
# Real-time portfolio monitoring
"Monitor my portfolio health and alert me to any issues"

# Workflow: getUnifiedPortfolioOverview → riskAnalysis → yieldAnalysis → generateAlerts
```

**Monitoring System:**
1. **Portfolio Snapshot** → `getUnifiedPortfolioOverview()` - Current state
2. **Risk Assessment** → `riskAnalysis()` - Identify risk factors
3. **Yield Tracking** → `yieldAnalysis()` - Monitor performance
4. **Health Scoring** → Calculate overall portfolio health
5. **Alert Generation** → Notify on issues or opportunities

### 9. **Advanced Trading Strategies**

```bash
# Sophisticated trading strategy
"Execute a dollar-cost averaging strategy: buy 100 USDC worth of XLM every week"

# Workflow: getPrice → swap → track performance → repeat
```

**Trading Automation:**
1. **Market Analysis** → `getPrice()` - Get current market prices
2. **Trade Execution** → `swap()` - Execute the trade
3. **Performance Tracking** → Monitor trade outcomes
4. **Strategy Adjustment** → Optimize based on results

### 10. **Protocol Integration Workflows**

```bash
# Seamless protocol integration
"Show me how to integrate Blend lending with Soroswap trading for maximum efficiency"

# Workflow: loadPoolData → getAvailableSoroswapPools → analyzeIntegration → execute
```

**Integration Analysis:**
1. **Protocol Research** → Analyze both protocols' capabilities
2. **Opportunity Mapping** → Identify integration points
3. **Strategy Development** → Create cross-protocol strategies
4. **Execution Planning** → Plan optimal execution sequence

### 11. **Advanced Analytics Workflows**

```bash
# Deep portfolio analytics
"Provide deep analytics on my portfolio performance, risk metrics, and optimization opportunities"

# Workflow: analyzePortfolio → getUnifiedYieldAnalysis → getCrossProtocolOpportunities → generateReport
```

**Analytics Pipeline:**
1. **Portfolio Analysis** → `analyzePortfolio()` - Deep portfolio insights
2. **Yield Analysis** → `getUnifiedYieldAnalysis()` - Cross-protocol yield comparison
3. **Opportunity Detection** → `getCrossProtocolOpportunities()` - Find optimization opportunities
4. **Report Generation** → Comprehensive analytics report

### 12. **Emergency Response Workflows**

```bash
# Emergency portfolio protection
"Emergency: Protect my portfolio from market volatility"

# Workflow: riskAnalysis → suggestRebalance → execute defensive moves
```

**Emergency Protocol:**
1. **Risk Assessment** → `riskAnalysis()` - Identify immediate risks
2. **Defensive Strategy** → Generate protective measures
3. **Quick Execution** → Execute defensive transactions
4. **Monitoring** → Track effectiveness of protective measures

## 🔄 Function Combination Examples

### **Portfolio Management Combinations:**
- `getUnifiedPortfolioOverview()` + `suggestRebalance()` + `optimizeYield()`
- `loadPoolData()` + `getTokenBalance()` + `getUserLPPositions()`
- `riskAnalysis()` + `yieldAnalysis()` + `getCrossProtocolOpportunities()`

### **Trading Strategy Combinations:**
- `getPrice()` + `swap()` + `addLiquidity()` + `getVaultAnalytics()`
- `getAvailableSoroswapPools()` + `getYieldOpportunities()` + `optimizeYield()`
- `loadPoolData()` + `lend()` + `borrow()` + `addLiquidity()`

### **Analytics Combinations:**
- `analyzePortfolio()` + `getUnifiedYieldAnalysis()` + `getDeFindexInsights()`
- `getUserPositions()` + `getVaultAnalytics()` + `riskAnalysis()`
- `getAvailableVaults()` + `getAvailableStrategies()` + `getYieldOpportunities()`

### **Risk Management Combinations:**
- `riskAnalysis()` + `suggestRebalance()` + `getCrossProtocolOpportunities()`
- `getUnifiedPortfolioOverview()` + `riskAnalysis()` + `optimizeYield()`
- `loadPoolData()` + `getTokenBalance()` + `riskAnalysis()`

These workflows demonstrate the sophisticated capabilities of Verbex AI, enabling users to execute complex DeFi strategies through simple natural language commands while maintaining full control over their transactions and portfolio management.

## 🛠️ Technical Implementation

### Frontend Architecture

- **Next.js 14**: App Router with server components
- **TypeScript**: Full type safety across the stack
- **Tailwind CSS**: Utility-first styling with custom retro theme
- **Stellar-Wallets-Kit**: Secure wallet integration
- **React Hooks**: Custom hooks for blockchain interactions

### Backend Services

- **MCP Server**: Model Context Protocol implementation
- **Express.js**: RESTful API endpoints
- **Prisma ORM**: Database management
- **Stellar SDK**: Blockchain interactions
- **Axios**: HTTP client for external APIs

### Smart Contract Integration

```typescript
// Blend Protocol Integration
const blendService = new BlendService();
await blendService.loadPool(poolId, meta);

// Soroswap Integration
const soroswapService = new SoroswapService();
await soroswapService.swap({
  userAddress,
  fromAsset: "XLM",
  toAsset: "USDC",
  amount: 100
});

// DeFindex Integration
const defindexService = new DeFindexService();
await defindexService.createVault({
  userAddress,
  asset: "USDC",
  strategyId: "yield-farming-v1"
});
```

## 📊 Supported Protocols & Assets

### Blend Protocol (Lending/Borrowing)
- **Assets**: XLM, USDC, BTC, ETH, XRP, EURC
- **Features**: Collateralized lending, borrowing, interest earning
- **Risk Management**: Liquidation protection, health factor monitoring

### Soroswap (Decentralized Exchange)
- **Assets**: 50+ tokens including XLM, USDC, BTC, ETH, XRP, AQUA
- **Features**: AMM swaps, liquidity provision, route optimization
- **Advanced**: Multi-hop swaps, price impact analysis

### DeFindex (Yield Farming)
- **Strategies**: Automated yield farming, vault management
- **Features**: Strategy optimization, risk-adjusted returns
- **Integration**: Cross-protocol yield opportunities

## 🔧 Complete Function Reference

### **Blend Protocol Functions**
```typescript
// Core Lending & Borrowing
lend(userAddress, amount, asset, poolId)           // Deposit collateral
withdraw(userAddress, amount, asset, poolId)       // Withdraw collateral
borrow(userAddress, amount, asset, poolId)         // Borrow against collateral
repay(userAddress, amount, asset, poolId)          // Repay borrowed amount

// Pool Management
loadPoolData(poolId, userAddress?)                 // Get pool details & user positions
getAvailableBlendPools()                           // List all available pools
loadPool(poolId)                                   // Load complete pool data
loadPoolUser(poolId, userAddress)                  // Load user position data
loadPoolOracle(poolId)                             // Load oracle data

// Rewards & Analytics
claimRewards(userAddress, poolId, reserveTokenIds) // Claim earned rewards
getPoolEvents(poolId, version, startLedger)        // Get historical events

// Token Operations
getTokenBalance(tokenId, userAddress)              // Get token balance
loadTokenMetadata(assetId)                         // Load token metadata

// Admin Functions
createPool(admin, name, oracleId, backstopRate, maxPositions, minCollateral)
addReserve(admin, poolId, assetId, metadata)       // Add new asset to pool

// Backstop Protocol
loadBackstop(version)                              // Load backstop data
loadBackstopPool(poolId, version)                  // Load backstop pool data
loadBackstopPoolUser(poolId, version, userAddress) // Load user backstop position

// Utilities
getFeeStats()                                      // Get network fee statistics
simulateOperation(operationXdr, userAddress)      // Simulate transaction
buyNft(userAddress, nftContractId, tokenId, price) // Purchase NFT
```

### **Soroswap Protocol Functions**
```typescript
// Trading & Swaps
swap(userAddress, fromAsset, toAsset, amount, maxSlippage?, routeType?)
getPrice(asset, referenceCurrency?)                // Get asset price
getAssetList()                                     // List all available assets

// Liquidity Management
addLiquidity(userAddress, tokenA, tokenB, amountA, amountB, autoBalance?)
removeLiquidity(userAddress, poolId, lpAmount)     // Remove liquidity
getAvailableSoroswapPools()                        // List all pools
getUserLPPositions(userAddress)                    // Get user LP positions

// Portfolio & Balances
getUserTokenBalances(userAddress)                  // Get all token balances
```

### **DeFindex Protocol Functions**
```typescript
// Vault Management
createVault(userAddress, asset, strategyId, vaultName?, initialDeposit?)
deposit(userAddress, vaultId, amount, asset)       // Deposit to vault
withdraw(userAddress, vaultId, amount, asset)      // Withdraw from vault

// Analytics & Discovery
getAvailableVaults(userAddress?)                   // List available vaults
getAvailableStrategies()                           // List available strategies
getUserPositions(userAddress)                      // Get user positions
getVaultAnalytics(vaultId)                         // Get vault analytics
getYieldOpportunities(userAddress, riskTolerance?) // Find yield opportunities

// Advanced Operations
sendTransaction(userAddress, transactionXdr)       // Send custom transaction
```

### **Portfolio & Analytics Functions**
```typescript
// Unified Portfolio Management
getUnifiedPortfolioOverview(userAddress)           // Complete portfolio view
getUnifiedPortfolio(userAddress)                   // Basic portfolio data
getPortfolioAnalytics(userAddress)                 // Portfolio analytics

// Advanced Analytics
analyzePortfolio(userAddress)                      // Deep portfolio analysis
getUnifiedYieldAnalysis(userAddress)               // Cross-protocol yield analysis
getDeFindexInsights(userAddress)                   // DeFindex-specific insights
getCrossProtocolOpportunities(userAddress)         // Cross-protocol opportunities

// Risk & Optimization
riskAnalysis(userAddress)                          // Portfolio risk assessment
suggestRebalance(userAddress, targetAllocation)    // Rebalancing suggestions
optimizeYield(userAddress)                         // Yield optimization
yieldAnalysis(userAddress)                         // Yield performance analysis

// Soroswap Portfolio
getSoroswapPortfolioOverview(userAddress)          // Soroswap-specific portfolio
```

### **Function Categories by Use Case**

#### **🔄 Portfolio Management**
- `getUnifiedPortfolioOverview()` - Complete portfolio snapshot
- `getSoroswapPortfolioOverview()` - Soroswap-specific view
- `getUnifiedPortfolio()` - Basic portfolio data
- `getPortfolioAnalytics()` - Performance analytics

#### **📊 Analytics & Insights**
- `analyzePortfolio()` - Deep portfolio analysis
- `getUnifiedYieldAnalysis()` - Cross-protocol yield comparison
- `getDeFindexInsights()` - DeFindex-specific analytics
- `getCrossProtocolOpportunities()` - Optimization opportunities
- `riskAnalysis()` - Risk assessment
- `yieldAnalysis()` - Yield performance analysis

#### **⚖️ Optimization & Rebalancing**
- `suggestRebalance()` - Portfolio rebalancing
- `optimizeYield()` - Yield optimization
- `getYieldOpportunities()` - Yield opportunity discovery

#### **💰 Lending & Borrowing (Blend)**
- `lend()` - Deposit collateral
- `withdraw()` - Withdraw collateral
- `borrow()` - Borrow against collateral
- `repay()` - Repay borrowed amount
- `claimRewards()` - Claim earned rewards

#### **🔄 Trading & Swaps (Soroswap)**
- `swap()` - Execute token swaps
- `getPrice()` - Get asset prices
- `getAssetList()` - List available assets

#### **🏊 Liquidity Provision (Soroswap)**
- `addLiquidity()` - Add liquidity to pools
- `removeLiquidity()` - Remove liquidity from pools
- `getAvailableSoroswapPools()` - List available pools
- `getUserLPPositions()` - Get user LP positions

#### **🏦 Vault Management (DeFindex)**
- `createVault()` - Create new vault
- `deposit()` - Deposit to vault
- `withdraw()` - Withdraw from vault
- `getAvailableVaults()` - List available vaults
- `getAvailableStrategies()` - List available strategies

#### **📈 Data & Discovery**
- `loadPoolData()` - Get pool information
- `getTokenBalance()` - Get token balances
- `getUserTokenBalances()` - Get all user balances
- `getUserPositions()` - Get user positions
- `loadTokenMetadata()` - Get token metadata

#### **🔧 Advanced Operations**
- `simulateOperation()` - Simulate transactions
- `sendTransaction()` - Send custom transactions
- `buyNft()` - Purchase NFTs
- `getPoolEvents()` - Get historical events

## 🔐 Security Features

- **Passkey Authentication**: Secure wallet connection
- **Transaction Signing**: Dedicated signing pages with clear details
- **Error Handling**: Comprehensive error management and user feedback
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Zod schemas for all user inputs

## 🎨 UI/UX Features

### Retro-Futuristic Design
- **Neon Green Theme**: Gaming-inspired color scheme
- **Pixel Borders**: Nostalgic design elements
- **Smooth Animations**: Modern micro-interactions
- **Responsive Design**: Mobile-first approach

### User Experience
- **Conversational Interface**: Natural language DeFi interactions
- **Real-Time Updates**: Live portfolio and transaction status
- **Progressive Disclosure**: Complex features revealed gradually
- **Error Recovery**: Clear error messages and recovery paths

## 🚀 Deployment

### Vercel Deployment

```bash
# Build command for Vercel
yarn install && cd Mcp && yarn install && cd .. && npx prisma generate && npx prisma migrate deploy && yarn build

# Environment variables in Vercel dashboard
DATABASE_URL="your-production-db-url"
STELLAR_NETWORK="testnet"
MCP_SERVER_URL="your-mcp-server-url"
GEMINI_API_KEY="your-gemini-api-key"
```

### MCP Server Deployment

```bash
# Deploy MCP server separately
cd Mcp
yarn build
yarn start:prod
```

## 📈 Performance & Scalability

- **Server-Side Rendering**: Fast initial page loads
- **Caching Strategy**: Redis for API responses
- **Database Optimization**: Indexed queries for portfolio data
- **CDN Integration**: Static asset delivery
- **Load Balancing**: Horizontal scaling support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone
git clone https://github.com/your-username/VerbexAi.git

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
yarn test
yarn lint

# Submit pull request
git push origin feature/amazing-feature
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stellar Development Foundation** for the blockchain infrastructure
- **Blend Protocol** for lending/borrowing capabilities
- **Soroswap** for DEX functionality
- **DeFindex** for yield farming strategies
- **Google Gemini** for AI capabilities
- **Model Context Protocol** for AI integration

## 📞 Support

- **Documentation**: [docs.verbex.ai](https://docs.verbex.ai)
- **Discord**: [discord.gg/verbex](https://discord.gg/verbex)
- **Twitter**: [@VerbexAI](https://twitter.com/VerbexAI)


---

**Built with ❤️ for the Stellar DeFi ecosystem**

*Verbex AI - Where AI meets DeFi on Stellar*