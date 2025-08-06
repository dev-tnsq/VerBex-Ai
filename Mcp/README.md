# DeFi Protocol MCP Server

A Model Context Protocol (MCP) server for interacting with DeFi protocols on the Stellar network. This server provides tools for managing lending pools, swaps, vaults, and portfolio analysis across multiple DeFi protocols.

## Features

### Blend Protocol Tools
- **Pool Management**: Load pool data, create pools, add reserves
- **Lending Operations**: Lend, borrow, withdraw, repay assets
- **Rewards**: Claim rewards from pools
- **Token Operations**: Get token balances and metadata

### Soroswap Tools
- **Liquidity Pools**: Get available pools and user LP positions
- **Swapping**: Execute asset swaps with configurable slippage
- **Liquidity Management**: Add and remove liquidity from pools
- **Price Data**: Get asset prices and token lists

### DeFindex Tools
- **Vault Management**: Create vaults, deposit, withdraw
- **Strategy Analysis**: Get available strategies and yield opportunities
- **Portfolio Analytics**: Get vault analytics and user positions
- **Risk Management**: Analyze risk tolerance and opportunities

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
RPC_URL=https://soroban-testnet.stellar.org
BACKSTOP_ID=CC4TSDVQKBAYMK4BEDM65CSNB3ISI2A54OOBRO6IPSTFHJY3DEEKHRKV
BACKSTOP_ID_V2=CC4TSDVQKBAYMK4BEDM65CSNB3ISI2A54OOBRO6IPSTFHJY3DEEKHRKV
POOL_FACTORY_ID=CDIE73IJJKOWXWCPU5GWQ745FUKWCSH3YKZRF5IQW7GE3G7YAZ773MYK
AGENT_SECRET=your_secret_key_here
```

### Cursor Configuration

Add the following to your `.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "Defi Protocol MCP": {
      "command": "node",
      "args": [
        "/path/to/your/Mcp/dist/server.js"
      ],
      "env": {
        "RPC_URL": "https://soroban-testnet.stellar.org",
        "BACKSTOP_ID": "CC4TSDVQKBAYMK4BEDM65CSNB3ISI2A54OOBRO6IPSTFHJY3DEEKHRKV",
        "BACKSTOP_ID_V2": "CC4TSDVQKBAYMK4BEDM65CSNB3ISI2A54OOBRO6IPSTFHJY3DEEKHRKV",
        "POOL_FACTORY_ID": "CDIE73IJJKOWXWCPU5GWQ745FUKWCSH3YKZRF5IQW7GE3G7YAZ773MYK"
      }
    }
  }
}
```

**Important**: Replace `/path/to/your/Mcp/dist/server.js` with the actual absolute path to your compiled server.

## Usage

### Starting the Server

The server runs via stdio transport and is designed to be used by MCP clients like Cursor:

```bash
node dist/server.js
```

### Testing the Server

You can test the server manually using JSON-RPC calls:

```bash
# Initialize the server
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}' | node dist/server.js

# List available tools
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}' | node dist/server.js
```

### Available Tools

#### Blend Protocol Tools

1. **loadPoolData** - Load comprehensive data for a Blend pool
2. **getTokenBalance** - Get token balance for a user
3. **getPoolEvents** - Get historical events for a pool
4. **loadBackstopData** - Load backstop contract data
5. **loadTokenMetadata** - Load token metadata
6. **lend** - Lend assets to a pool
7. **withdraw-pool** - Withdraw assets from a pool
8. **borrow** - Borrow assets from a pool
9. **repay** - Repay borrowed assets
10. **claimRewards** - Claim rewards from a pool
11. **createPool** - Create a new lending pool
12. **addReserve** - Add a reserve to a pool
13. **buyNft** - Buy an NFT

#### Soroswap Tools

1. **getAvailableSoroswapPools** - Get all available pools
2. **getUserLPPositions** - Get user LP positions
3. **getPrice** - Get asset price
4. **getAssetList** - Get available assets
5. **getUserTokenBalances** - Get user token balances
6. **swap** - Execute asset swap
7. **addLiquidity** - Add liquidity to pool
8. **removeLiquidity** - Remove liquidity from pool

#### DeFindex Tools

1. **getAvailableVaults** - Get available vaults
2. **getAvailableStrategies** - Get available strategies
3. **getUserPositions** - Get user positions
4. **getVaultAnalytics** - Get vault analytics
5. **getYieldOpportunities** - Get yield opportunities
6. **getBalance** - Get vault balance
7. **createVault** - Create new vault
8. **deposit** - Deposit to vault
9. **withdraw-vault** - Withdraw from vault

## Development

### Project Structure

```
src/
├── server.ts              # Main MCP server
└── services/
    ├── blend.service.ts   # Blend protocol service
    ├── soroswap.service.ts # Soroswap service
    ├── defindex.service.ts # DeFindex service
    ├── stellar.service.ts  # Stellar network service
    └── portfolio.service.ts # Unified portfolio service
```

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## Troubleshooting

### Common Issues

1. **Server not starting**: Check that all dependencies are installed and the TypeScript is compiled
2. **Tools not showing in Cursor**: Verify the path in `.cursor/mcp.json` is correct
3. **Import errors**: Ensure all import statements include `.js` extensions for ES modules

### Debug Mode

Run the server with additional logging:

```bash
DEBUG=* node dist/server.js
```

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here] 