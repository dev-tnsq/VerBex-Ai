// Gemini intent parser and schema for Verbex AI Blend MCP integration
// This file defines the JSON contract and system prompt for Gemini as a wrapper

import { GoogleGenAI, Type } from "@google/genai";

export interface GeminiContext {
  wallet: string;
  balances: Record<string, number>;
  vaults: Array<{ id: string; strategy: string }>;
}

// Function declarations for Blend protocol actions
const blendFunctionDeclarations = [
  {
    name: 'getFeeStats',
    description: 'Get current Stellar network fee statistics',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'loadPoolData',
    description: 'Load pool details and user positions for a specific Blend pool',
    parameters: {
      type: Type.OBJECT,
      properties: {
        poolId: {
          type: Type.STRING,
          description: 'The pool address/ID on Stellar network',
        },
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address to check positions for',
        },
      },
      required: ['poolId', 'userAddress'],
    },
  },
  {
    name: 'getTokenBalance',
    description: 'Get token balance for a specific asset and user',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tokenId: {
          type: Type.STRING,
          description: 'Token identifier (XLM for native or contract address for other tokens)',
        },
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address to check balance for',
        },
      },
      required: ['tokenId', 'userAddress'],
    },
  },
  {
    name: 'lend',
    description: 'Lend assets to a Blend pool',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address',
        },
        amount: {
          type: Type.NUMBER,
          description: 'Amount to lend',
        },
        asset: {
          type: Type.STRING,
          description: 'Asset to lend (XLM or contract address)',
        },
        poolId: {
          type: Type.STRING,
          description: 'Pool address to lend to',
        },
      },
      required: ['userAddress', 'amount', 'asset', 'poolId'],
    },
  },
  {
    name: 'withdraw',
    description: 'Withdraw assets from a Blend pool',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address',
        },
        amount: {
          type: Type.NUMBER,
          description: 'Amount to withdraw',
        },
        asset: {
          type: Type.STRING,
          description: 'Asset to withdraw (XLM or contract address)',
        },
        poolId: {
          type: Type.STRING,
          description: 'Pool address to withdraw from',
        },
      },
      required: ['userAddress', 'amount', 'asset', 'poolId'],
    },
  },
  {
    name: 'borrow',
    description: 'Borrow assets from a Blend pool',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address',
        },
        amount: {
          type: Type.NUMBER,
          description: 'Amount to borrow',
        },
        asset: {
          type: Type.STRING,
          description: 'Asset to borrow (XLM or contract address)',
        },
        poolId: {
          type: Type.STRING,
          description: 'Pool address to borrow from',
        },
      },
      required: ['userAddress', 'amount', 'asset', 'poolId'],
    },
  },
  {
    name: 'repay',
    description: 'Repay borrowed assets to a Blend pool',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address',
        },
        amount: {
          type: Type.NUMBER,
          description: 'Amount to repay',
        },
        asset: {
          type: Type.STRING,
          description: 'Asset to repay (XLM or contract address)',
        },
        poolId: {
          type: Type.STRING,
          description: 'Pool address to repay to',
        },
      },
      required: ['userAddress', 'amount', 'asset', 'poolId'],
    },
  },
  {
    name: 'claimRewards',
    description: 'Claim rewards from a Blend pool',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address',
        },
        poolId: {
          type: Type.STRING,
          description: 'Pool address to claim rewards from',
        },
        reserveTokenIds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Array of reserve token IDs to claim rewards for',
        },
      },
      required: ['userAddress', 'poolId', 'reserveTokenIds'],
    },
  },
  {
    name: 'getAvailableBlendPools',
    description: 'Get list of all available Blend pools. Use with protocol: Blend.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
 
  {
    name: 'getPoolEvents',
    description: 'Get events history for a specific pool',
    parameters: {
      type: Type.OBJECT,
      properties: {
        poolId: {
          type: Type.STRING,
          description: 'The pool address/ID',
        },
        version: {
          type: Type.STRING,
          description: 'Pool version (V1 or V2)',
        },
        startLedger: {
          type: Type.NUMBER,
          description: 'Starting ledger number for events',
        },
      },
      required: ['poolId', 'version', 'startLedger'],
    },
  },
  {
    name: 'loadTokenMetadata',
    description: 'Load metadata for a specific token',
    parameters: {
      type: Type.OBJECT,
      properties: {
        assetId: {
          type: Type.STRING,
          description: 'Asset ID or contract address',
        },
      },
      required: ['assetId'],
    },
  },
  {
    name: 'simulateOperation',
    description: 'Simulate a transaction before execution',
    parameters: {
      type: Type.OBJECT,
      properties: {
        operationXdr: {
          type: Type.STRING,
          description: 'XDR string of the operation to simulate',
        },
        userAddress: {
          type: Type.STRING,
          description: 'User address for simulation',
        },
      },
      required: ['operationXdr', 'userAddress'],
    },
  },
  {
    name: 'createPool',
    description: 'Create a new Blend pool (admin function)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        admin: {
          type: Type.STRING,
          description: 'Admin wallet address',
        },
        name: {
          type: Type.STRING,
          description: 'Pool name',
        },
        oracleId: {
          type: Type.STRING,
          description: 'Oracle contract ID',
        },
        backstopRate: {
          type: Type.NUMBER,
          description: 'Backstop rate (0-1000000, representing 0% to 100%)',
        },
        maxPositions: {
          type: Type.NUMBER,
          description: 'Maximum positions allowed (1-255)',
        },
        minCollateral: {
          type: Type.NUMBER,
          description: 'Minimum collateral required',
        },
      },
      required: ['admin', 'name', 'oracleId', 'backstopRate', 'maxPositions', 'minCollateral'],
    },
  },
  {
    name: 'addReserve',
    description: 'Add a reserve asset to a pool (admin function)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        admin: {
          type: Type.STRING,
          description: 'Admin wallet address',
        },
        poolId: {
          type: Type.STRING,
          description: 'Pool contract address',
        },
        assetId: {
          type: Type.STRING,
          description: 'Asset contract address to add',
        },
        metadata: {
          type: Type.OBJECT,
          description: 'Asset metadata configuration',
        },
      },
      required: ['admin', 'poolId', 'assetId', 'metadata'],
    },
  },
  {
    name: 'buyNft',
    description: 'Purchase an NFT using smart contract',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'Buyer wallet address',
        },
        nftContractId: {
          type: Type.STRING,
          description: 'NFT contract address',
        },
        tokenId: {
          type: Type.STRING,
          description: 'NFT token ID to purchase',
        },
        price: {
          type: Type.NUMBER,
          description: 'Price to pay for the NFT',
        },
      },
      required: ['userAddress', 'nftContractId', 'tokenId', 'price'],
    },
  },
  {
    name: 'loadPool',
    description: 'Load complete pool data with metadata',
    parameters: {
      type: Type.OBJECT,
      properties: {
        poolId: {
          type: Type.STRING,
          description: 'Pool contract address',
        },
      },
      required: ['poolId'],
    },
  },
  {
    name: 'loadPoolUser',
    description: 'Load user position data for a specific pool',
    parameters: {
      type: Type.OBJECT,
      properties: {
        poolId: {
          type: Type.STRING,
          description: 'Pool contract address',
        },
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['poolId', 'userAddress'],
    },
  },
  {
    name: 'loadPoolOracle',
    description: 'Load oracle data for a pool',
    parameters: {
      type: Type.OBJECT,
      properties: {
        poolId: {
          type: Type.STRING,
          description: 'Pool contract address',
        },
      },
      required: ['poolId'],
    },
  },
  {
    name: 'loadBackstop',
    description: 'Load backstop protocol data',
    parameters: {
      type: Type.OBJECT,
      properties: {
        version: {
          type: Type.STRING,
          description: 'Protocol version (V1 or V2)',
        },
      },
      required: ['version'],
    },
  },
  {
    name: 'loadBackstopPool',
    description: 'Load backstop pool data',
    parameters: {
      type: Type.OBJECT,
      properties: {
        poolId: {
          type: Type.STRING,
          description: 'Pool contract address',
        },
        version: {
          type: Type.STRING,
          description: 'Pool version (V1 or V2)',
        },
      },
      required: ['poolId', 'version'],
    },
  },
  {
    name: 'loadBackstopPoolUser',
    description: 'Load user backstop pool position',
    parameters: {
      type: Type.OBJECT,
      properties: {
        poolId: {
          type: Type.STRING,
          description: 'Pool contract address',
        },
        version: {
          type: Type.STRING,
          description: 'Pool version (V1 or V2)',
        },
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['poolId', 'version', 'userAddress'],
    },
  },
];

// Function declarations for Soroswap protocol actions
const soroswapFunctionDeclarations = [
  {
    name: 'swap',
    description: 'Swap one token for another using Soroswap aggregator or AMM',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: { type: Type.STRING, description: 'User wallet address' },
        fromAsset: { type: Type.STRING, description: 'Asset to swap from (contract address)' },
        toAsset: { type: Type.STRING, description: 'Asset to swap to (contract address)' },
        amount: { type: Type.NUMBER, description: 'Amount to swap' },
        maxSlippage: { type: Type.NUMBER, description: 'Max slippage in percent (e.g. 0.5)' },
        routeType: { type: Type.STRING, description: 'Route type: "amm" or "aggregator"' }
      },
      required: ['userAddress', 'fromAsset', 'toAsset', 'amount']
    }
  },
  {
    name: 'addLiquidity',
    description: 'Add liquidity to Soroswap pool. Call this directly when user provides specific amounts (e.g., "add 100 XLM and 200 USDC"). Use known asset addresses for XLM, USDC, etc.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: { type: Type.STRING, description: 'The user\'s Stellar wallet address' },
        tokenA: { type: Type.STRING, description: 'Contract address of the first token to add to the pool (use known addresses for XLM, USDC, etc.)' },
        tokenB: { type: Type.STRING, description: 'Contract address of the second token to add to the pool (use known addresses for XLM, USDC, etc.)' },
        amountA: { type: Type.NUMBER, description: 'Amount of tokenA to add (in whole tokens, not stroops)' },
        amountB: { type: Type.NUMBER, description: 'Amount of tokenB to add (in whole tokens, not stroops)' },
        autoBalance: { type: Type.BOOLEAN, description: 'Auto-balance amounts to match pool ratio (recommended: true)' }
      },
      required: ['userAddress', 'tokenA', 'tokenB', 'amountA', 'amountB']
    }
  },
  {
    name: 'removeLiquidity',
    description: 'Remove liquidity from a Soroswap pool',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: { type: Type.STRING },
        poolId: { type: Type.STRING },
        lpAmount: { type: Type.NUMBER }
      },
      required: ['userAddress', 'poolId', 'lpAmount']
    }
  },
  {
    name: 'getAvailableSoroswapPools',
    description: 'Get list of all available Soroswap pools (testnet). ONLY call this when user asks for available pools or wants to add liquidity WITHOUT specifying amounts. DO NOT call this when user provides specific amounts for addLiquidity.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'getUserLPPositions',
    description: 'Get all LP positions for a user',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: { type: Type.STRING }
      },
      required: ['userAddress']
    }
  },
  {
    name: 'getPrice',
    description: 'Get price for one or more assets in relation to a reference currency',
    parameters: {
      type: Type.OBJECT,
      properties: {
        asset: { type: Type.STRING, description: 'Asset contract address or comma-separated list of addresses' },
        referenceCurrency: { type: Type.STRING, description: 'Reference currency (default USD)' }
      },
      required: ['asset']
    }
  },
  {
    name: 'getAssetList',
    description: 'Get a list of all available assets on Soroswap',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'getUserTokenBalances',
    description: 'get user token balance on soroswap',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: { type: Type.STRING, description: 'User wallet address' }
      },
      required: ['userAddress']
    }
  },
];

// Function declarations for DeFindex protocol actions
const defindexFunctionDeclarations = [
  {
    name: 'getAvailableVaults',
    description: 'Get all available DeFindex vaults and strategies',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'getAvailableStrategies',
    description: 'Get all available DeFindex strategies with real contract data',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: 'getUserPositions',
    description: 'Get user positions and balances in DeFindex vaults',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'getYieldOpportunities',
    description: 'Get yield opportunities and recommendations based on risk tolerance',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
        riskTolerance: {
          type: Type.STRING,
          description: 'Risk tolerance level: low, medium, high',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'createVault',
    description: 'Create a new DeFindex vault with the specified asset',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
        asset: {
          type: Type.STRING,
          description: 'Asset symbol (e.g., USDC, XLM)',
        },
        initialDeposit: {
          type: Type.NUMBER,
          description: 'Initial deposit amount (optional)',
        },
        vaultName: {
          type: Type.STRING,
          description: 'Custom vault name (optional)',
        },
      },
      required: ['userAddress', 'asset'],
    },
  },
  {
    name: 'deposit',
    description: 'Deposit assets into a DeFindex vault',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
        vaultAddress: {
          type: Type.STRING,
          description: 'Vault contract address',
        },
        amount: {
          type: Type.NUMBER,
          description: 'Amount to deposit',
        },
        asset: {
          type: Type.STRING,
          description: 'Asset symbol (e.g., USDC, XLM)',
        },
      },
      required: ['userAddress', 'vaultAddress', 'amount', 'asset'],
    },
  },
  {
    name: 'withdraw',
    description: 'Withdraw assets from a DeFindex vault',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
        vaultAddress: {
          type: Type.STRING,
          description: 'Vault contract address',
        },
        amount: {
          type: Type.NUMBER,
          description: 'Amount to withdraw',
        },
        asset: {
          type: Type.STRING,
          description: 'Asset symbol (e.g., USDC, XLM)',
        },
      },
      required: ['userAddress', 'vaultAddress', 'amount', 'asset'],
    },
  },
  {
    name: 'getBalance',
    description: 'Get user balance in a specific DeFindex vault',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
        vaultAddress: {
          type: Type.STRING,
          description: 'Vault contract address',
        },
      },
      required: ['userAddress', 'vaultAddress'],
    },
  },
  {
    name: 'getVaultAnalytics',
    description: 'Get detailed analytics and performance data for a vault',
    parameters: {
      type: Type.OBJECT,
      properties: {
        vaultAddress: {
          type: Type.STRING,
          description: 'Vault contract address',
        },
      },
      required: ['vaultAddress'],
    },
  },
  {
    name: 'sendTransaction',
    description: 'Send a signed transaction to the network',
    parameters: {
      type: Type.OBJECT,
      properties: {
        signedXdr: {
          type: Type.STRING,
          description: 'Signed transaction XDR',
        },
      },
      required: ['signedXdr'],
    },
  },
];

// Function declarations for Portfolio management actions
const portfolioFunctionDeclarations = [
  {
    name: 'getUnifiedPortfolio',
    description: 'Get comprehensive portfolio overview across all protocols (DeFindex, Blend, Soroswap)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'getUnifiedPortfolioOverview', // Add the actual method name as an alternate function declaration
    description: 'Get comprehensive portfolio overview across all protocols (DeFindex, Blend, Soroswap)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'analyzePortfolio',
    description: 'Deep portfolio analysis including allocation, concentration, diversification, and cross-protocol insights',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'getUnifiedYieldAnalysis',
    description: 'Comprehensive yield analysis across all protocols with APY comparison and recommendations',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'suggestPortfolioRebalance',
    description: 'Suggest portfolio rebalancing across protocols or assets with XDR generation for execution',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
        targetAllocation: {
          type: Type.OBJECT,
          description: 'Target allocation percentages (e.g., {"defindex": 40, "blend": 30, "soroswap": 30} or {"USDC": 50, "XLM": 30})',
        },
      },
      required: ['userAddress', 'targetAllocation'],
    },
  },
  {
    name: 'optimizePortfolioYield',
    description: 'Find yield optimization opportunities across all protocols with executable XDRs',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'portfolioRiskAnalysis',
    description: 'Comprehensive risk analysis across all protocols including concentration and diversification risks',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'getCrossProtocolOpportunities',
    description: 'Find arbitrage and optimization opportunities between protocols',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'getDeFindexInsights',
    description: 'Get DeFindex-specific portfolio insights and recommendations',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'yieldAnalysis',
    description: 'Analyze yield for Soroswap LP positions with recommendations',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'getPortfolioOverview',
    description: 'Get unified portfolio overview (legacy method)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
];

export interface GeminiIntentOperation {
  protocol: string;
  action: string;
  parameters: Record<string, any>;
  value_references?: Record<string, any>;
}

export interface GeminiIntentResult {
  operations: GeminiIntentOperation[];
  confirmation_text: string;
}

// --- Blend MCP Action Schema ---
export const BLEND_ACTIONS = {
  loadPoolData: {
    description: 'Loads comprehensive data for a given Blend pool. Optionally includes user position.',
    parameters: {
      poolId: 'string',
      userAddress: 'string (optional)'
    },
    returns: 'Pool/user data object'
  },
  getTokenBalance: {
    description: 'Gets the balance of a specific token for a user address.',
    parameters: {
      tokenId: 'string',
      userAddress: 'string'
    },
    returns: 'Balance (bigint)'
  },
  getFeeStats: {
    description: 'Gets Soroban network fee stats.',
    parameters: {},
    returns: 'Fee stats object'
  },
  getPoolEvents: {
    description: 'Gets historical events for a specific pool.',
    parameters: {
      poolId: 'string',
      version: 'string',
      startLedger: 'number'
    },
    returns: 'Events array'
  },
  lend: {
    description: 'Lend (supply collateral) to a pool.',
    parameters: {
      userAddress: 'string',
      amount: 'number',
      asset: 'string',
      poolId: 'string'
    },
    returns: 'Transaction hash or XDR'
  },
  withdraw: {
    description: 'Withdraw assets from a pool.',
    parameters: {
      userAddress: 'string',
      amount: 'number',
      asset: 'string',
      poolId: 'string'
    },
    returns: 'Transaction hash or XDR'
  },
  borrow: {
    description: 'Borrow assets from a pool.',
    parameters: {
      userAddress: 'string',
      amount: 'number',
      asset: 'string',
      poolId: 'string'
    },
    returns: 'Transaction hash or XDR'
  },
  repay: {
    description: 'Repay borrowed assets to a pool.',
    parameters: {
      userAddress: 'string',
      amount: 'number',
      asset: 'string',
      poolId: 'string'
    },
    returns: 'Transaction hash or XDR'
  },
  claimRewards: {
    description: 'Claim available rewards from a pool.',
    parameters: {
      userAddress: 'string',
      poolId: 'string',
      reserveTokenIds: 'string[]'
    },
    returns: 'Transaction hash or XDR'
  },
  createPool: {
    description: 'Deploy a new, permissionless lending pool.',
    parameters: {
      admin: 'string',
      name: 'string',
      oracleId: 'string',
      backstopRate: 'number',
      maxPositions: 'number',
      minCollateral: 'bigint',
      privateKey: 'string (optional)'
    },
    returns: 'Pool contract ID/hash'
  },
  addReserve: {
    description: 'Add a new asset reserve to a pool.',
    parameters: {
      admin: 'string',
      poolId: 'string',
      assetId: 'string',
      metadata: 'object',
      privateKey: 'string (optional)'
    },
    returns: 'Transaction hash or XDR'
  },
  buyNft: {
    description: 'Buy an NFT from a Soroban NFT contract using provided funds.',
    parameters: {
      userAddress: 'string',
      nftContractId: 'string',
      tokenId: 'string | number',
      price: 'number',
      privateKey: 'string (optional)'
    },
    returns: 'Transaction hash or XDR'
  }
};

/**
 * Unified system prompt for Gemini (testnet asset addresses)
 */
export function getUnifiedSystemPrompt(): string {
  return `You are Gemini AI, a production-grade conversational DeFi assistant for the Blend Protocol, Soroswap Protocol, DeFindex Protocol, and Unified Portfolio Management on Stellar. Your mission is to make DeFi accessible, safe, and easy for everyone, regardless of their technical background.

**PROJECT CONTEXT:**
- You are the primary user-facing agent for Verbex AI, which integrates Blend (lending/borrowing), Soroswap (swaps, liquidity), DeFindex (automated yield strategies), and Unified Portfolio Management on the Stellar blockchain (testnet only).
- Users interact with you via chat to perform DeFi actions, get analytics, and manage their portfolios across all protocols.
- **ALL TRANSACTIONS RETURN UNSIGNED XDRs** that users must sign with their wallets; you never ask for private keys or execute transactions directly.
- You have access to real-time blockchain data, protocol APIs, and advanced analytics across all three protocols.

**AVAILABLE FUNCTIONS (Complete List):**

**Blend Protocol (Lending & Borrowing):**
- **Core Operations:** lend, withdraw, borrow, repay, claimRewards
- **Data & Analytics:** getFeeStats, getAvailableBlendPools, loadPoolData, getTokenBalance, getPoolEvents, loadTokenMetadata
- **Advanced Functions:** simulateOperation, loadPool, loadPoolUser, loadPoolOracle
- **Backstop Operations:** loadBackstop, loadBackstopPool, loadBackstopPoolUser
- **Admin Functions:** createPool, addReserve, buyNft

**Soroswap Protocol (AMM & Trading):**
- **Trading:** swap (with best route optimization)
- **Liquidity Management:** addLiquidity (with auto-balance), removeLiquidity
- **Data & Discovery:** getAvailableSoroswapPools, getUserLPPositions, getPrice, getAssetList, getUserTokenBalances

**DeFindex Protocol (Automated Yield Strategies):**
- **Vault Management:** createVault, deposit, withdraw, getBalance
- **Strategy Discovery:** getAvailableVaults, getAvailableStrategies, getYieldOpportunities
- **Analytics:** getUserPositions, getVaultAnalytics

**Portfolio Management (Cross-Protocol):**
- **Overview & Analysis:** getUnifiedPortfolio, analyzePortfolio, getUnifiedYieldAnalysis
- **Optimization:** suggestPortfolioRebalance (with XDRs), optimizePortfolioYield (with XDRs)
- **Risk Management:** portfolioRiskAnalysis, getCrossProtocolOpportunities
- **Specialized Insights:** getDeFindexInsights, yieldAnalysis

**TESTNET ASSET ADDRESSES (ALWAYS USE THESE):**
- XLM = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
- USDC = "CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM"
- XRP = "CCPOB5HBFV2MGDFHR2QOFW3Y2JS7DQVJMWL7YESGSGH4AGQWVCJIPCKE"
- EURC = "CA34FYW2SL7VZW5E6WIPA2NOTLGG7TNAOKQLEO5YZHVUGNRFHM4HJ7WD"
- BTC = "CAD23PIPKXXRLZ54VKAW7IGOOM4FFW6WFZZM2XPD5VC6Q4BA3FN4F32F"
- [All other existing assets...]

**CRITICAL: When users mention asset symbols (XLM, USDC, etc.), ALWAYS use the contract addresses above. Never ask users for asset IDs.**

**YOUR ENHANCED ROLE & CAPABILITIES:**

**🔹 DeFi Expert Across All Protocols:**
- Help users navigate Blend lending/borrowing with optimal rates and risk management
- Guide Soroswap trading with best route optimization and liquidity provision strategies
- Recommend DeFindex automated yield strategies based on user risk tolerance
- Provide unified portfolio analysis and cross-protocol optimization

**🔹 Transaction Management:**
- **Every transaction function returns unsigned XDRs with status: "READY"**
- Always explain what the transaction will do BEFORE presenting the XDR
- Tell users to sign the XDR in their connected wallet
- For multi-step operations (like portfolio rebalancing), provide multiple XDRs in sequence
- Handle both single XDRs and arrays of XDRs for complex operations

**🔹 Advanced Analytics & Insights:**
- Cross-protocol yield comparison and arbitrage identification
- Portfolio diversification analysis with concentration risk assessment
- Real-time performance tracking and historical analysis
- Risk-adjusted return calculations and optimization recommendations

**ENHANCED EXAMPLES & USE CASES:**

**DeFindex Operations:**
- "Create a USDC vault using the Blend fixed income strategy with 1000 USDC initial deposit"
- "Show me DeFindex vaults with medium risk tolerance and compare their APYs"
- "Deposit 500 USDC into my highest-performing DeFindex vault"
- "Analyze performance of my DeFindex positions over the last 30 days"

**Portfolio Management:**
- "Show my complete DeFi portfolio across Blend, Soroswap, and DeFindex"
- "Rebalance my portfolio to 40% DeFindex, 30% Blend, 30% Soroswap with executable transactions"
- "Find yield optimization opportunities and generate the necessary XDRs"
- "Analyze my portfolio risk and suggest specific actions to improve diversification"

**Cross-Protocol Operations:**
- "Compare yields between Blend lending and DeFindex strategies for USDC"
- "Show me arbitrage opportunities between protocols"
- "Move my funds from lowest to highest yielding positions across all protocols"
- "Help me build a balanced DeFi portfolio with risk management"

**TRANSACTION FLOW & XDR HANDLING:**

1. **User Request:** "Deposit 1000 USDC into best DeFindex vault"
2. **Your Analysis:** Find best vault, explain strategy and expected returns
3. **XDR Generation:** Call appropriate function, receive unsigned XDR
4. **User Guidance:** "I've prepared your deposit transaction. Here's what it will do: [explain details]. Please review and sign this XDR in your wallet: [XDR]"
5. **Follow-up:** After signing, guide user on transaction submission

**MULTI-XDR OPERATIONS:**
For complex operations like portfolio rebalancing:
- Generate multiple XDRs (e.g., withdraw from protocol A, swap tokens, deposit to protocol B)
- Explain each step clearly
- Present XDRs in logical execution order
- Guide users through signing each transaction

**COMMUNICATION STYLE:**
- **Conversational & Helpful:** Never show raw JSON - always interpret and explain
- **Educational:** Explain DeFi concepts, risks, and opportunities clearly
- **Proactive:** Suggest optimizations and improvements without being pushy
- **Safety-First:** Always explain transaction details and risks before XDR signing
- **Cross-Protocol Aware:** Consider all three protocols in recommendations

**RISK MANAGEMENT:**
- Always explain risks associated with each protocol and strategy
- Highlight concentration risks and suggest diversification
- Explain impermanent loss, smart contract risks, and yield variability
- Provide clear risk ratings (Low/Medium/High) for strategies and positions

**IMPORTANT TECHNICAL NOTES:**
- All amounts are in human-readable format (not stroops)
- Asset addresses are automatically resolved from symbols
- XDRs are always unsigned and require user wallet signatures
- Support both single operations and complex multi-step workflows
- Handle errors gracefully with clear explanations and alternatives

**REMEMBER:**
You are the user's trusted DeFi advisor across the entire Stellar ecosystem. Your goal is to make complex DeFi operations simple, safe, and profitable while maintaining the highest standards of security and user education. Every interaction should leave users more confident and knowledgeable about their DeFi journey.`;
}

// --- Gemini Intent Parser (real Gemini API call) ---
export async function parseGeminiIntent(command: string, context: GeminiContext & { pools?: Array<{ id: string; name?: string }> }): Promise<GeminiIntentResult> {
  const systemPrompt = getUnifiedSystemPrompt();
  
  try {
    // Initialize Google GenAI
    const ai = new GoogleGenAI({});
    
    const userPrompt = JSON.stringify({ command, context });

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        tools: [{
          functionDeclarations: [...blendFunctionDeclarations, ...soroswapFunctionDeclarations, ...defindexFunctionDeclarations, ...portfolioFunctionDeclarations] as any
        }],
      },
    });
    
    // Check for function calls first
    if (result.functionCalls && result.functionCalls.length > 0) {
      const functionCall = result.functionCalls[0];
      console.log('[Gemini Function Call]:', {
        name: functionCall.name,
        args: functionCall.args
      });
      // Determine protocol
      let protocol = "Blend";
      if (soroswapFunctionDeclarations.some(f => f.name === functionCall.name)) {
        protocol = "Soroswap";
      } else if (defindexFunctionDeclarations.some(f => f.name === functionCall.name)) {
        protocol = "DeFindex";
      } else if (portfolioFunctionDeclarations.some(f => f.name === functionCall.name)) {
        protocol = "Portfolio";
      }
      const operation = {
        protocol,
        action: functionCall.name ?? "",
        parameters: functionCall.args ?? {},
      };
      console.log('[Gemini Intent] Operations array:', [operation]);
      return {
        operations: [operation],
        confirmation_text: `Executing ${functionCall.name ?? ''}...`,
      };
    }
    
    const text = result.text;
    
    // Log the raw Gemini output text
    console.log('[Gemini Raw Output]', text);
    
    // Clean up the response - remove markdown if present
    let cleanText = (text ?? '').trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/, '').replace(/```$/, '').trim();
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/, '').replace(/```$/, '').trim();
    }
    
    // If Gemini outputs a follow-up question, treat as no actionable intent
    try {
      const intent = JSON.parse(cleanText);
      if (intent && intent.operations) {
        console.log('[Gemini Parsed Intent]', intent);
        console.log('[Gemini Intent] Final operations array:', intent.operations);
        return intent;
      }
    } catch (e) {
      // Not JSON, treat as follow-up question
      console.log('[Gemini Follow-up Question]', cleanText);
      return {
        operations: [],
        confirmation_text: cleanText,
      };
    }
    // Fallback: no actionable intent
    return {
      operations: [],
      confirmation_text: cleanText || "No actionable intent found.",
    };
  } catch (e: any) {
    console.error('[Gemini API Error]', e);
    return {
      operations: [],
      confirmation_text: `Gemini API error: ${e.message}`,
    };
  }
}

// --- CONVERSATIONAL AI WITH FUNCTION CALLING ---
export async function parseConversationalIntent(
  userMessage: string,
  userWallet?: string,
  conversationHistory?: string[]
): Promise<GeminiIntentResult> {
  console.log('[Conversational AI] Processing user message:', userMessage);
  console.log('[Conversational AI] User wallet:', userWallet);
  
  try {
    // Initialize Google GenAI
    const ai = new GoogleGenAI({});
    
    // Prepare the user message with context and history
    let contextualMessage = `User wallet: ${userWallet || 'Not connected'}`;
    
    if (conversationHistory && conversationHistory.length > 0) {
      contextualMessage += `\n\nRecent conversation history:\n${conversationHistory.join('\n')}`;
    }
    
    contextualMessage += `\n\nCurrent user message: "${userMessage}"`;

    console.log('[Conversational AI] Sending to Gemini with history...', {
      hasHistory: !!(conversationHistory && conversationHistory.length > 0),
      historyLength: conversationHistory?.length || 0
    });
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contextualMessage,
      config: {
        systemInstruction: getUnifiedSystemPrompt(),
        tools: [{
          functionDeclarations: [...blendFunctionDeclarations, ...soroswapFunctionDeclarations, ...defindexFunctionDeclarations, ...portfolioFunctionDeclarations] as any
        }],
      },
    });
    
    console.log('[Conversational AI] Response received');
    
    // Check if there are function calls in the response
    if (result.functionCalls && result.functionCalls.length > 0) {
      const functionCall = result.functionCalls[0];
      console.log('[Conversational AI] Function Call detected:', {
        name: functionCall.name,
        args: functionCall.args
      });
      // Determine protocol
      let protocol = "Blend";
      if (soroswapFunctionDeclarations.some(f => f.name === functionCall.name)) {
        protocol = "Soroswap";
      } else if (defindexFunctionDeclarations.some(f => f.name === functionCall.name)) {
        protocol = "DeFindex";
      } else if (portfolioFunctionDeclarations.some(f => f.name === functionCall.name)) {
        protocol = "Portfolio";
      }
      // Replace userAddress with actual wallet if needed
      const parameters = { ...functionCall.args };
      if (userWallet && parameters.userAddress === undefined) {
        parameters.userAddress = userWallet;
      }
      const operation = {
        protocol,
        action: functionCall.name ?? "",
        parameters
      };
      console.log('[Conversational AI] Intent Operations array:', [operation]);
      return {
        operations: [operation],
        confirmation_text: `I'll ${functionCall.name ?? ''} for you. Processing your request...`,
      };
    }
    
    // No function call, it's a conversational response
    const text = result.text;
    console.log('[Conversational AI] Conversational response:', text);
    
    if (!text || text.trim().length === 0) {
      console.error('[Conversational AI] Empty response from Gemini!');
      return {
        operations: [],
        confirmation_text: "Sorry, I didn't get a response. Please try again!",
      };
    }
    
    return {
      operations: [],
      confirmation_text: text.trim(),
    };
    
  } catch (e: any) {
    console.error('[Conversational AI] API Error:', e);
    console.error('[Conversational AI] Error details:', {
      message: e.message,
      stack: e.stack,
      name: e.name
    });
    
    // Check if it's an API key issue
    if (e.message?.includes('API key') || e.message?.includes('401') || e.message?.includes('authentication')) {
      return {
        operations: [],
        confirmation_text: `API authentication error. Please check your GEMINI_API_KEY in .env file.`,
      };
    }
    
    return {
      operations: [],
      confirmation_text: `Sorry, I encountered an error: ${e.message}. Please try again!`,
    };
  }
}

// Function for Gemini to format function results
export async function formatResultWithGemini(
  originalQuery: string,
  functionResult: any,
  userWallet?: string
): Promise<string> {
  const userPrompt = `The user asked: "${originalQuery}"

The function was executed and returned this result:
${JSON.stringify(functionResult, null, 2)}

User wallet: ${userWallet || 'Not connected'}

Please explain these results in a friendly and helpful way.`;

  const systemPrompt = `You are Gemini AI, a friendly DeFi assistant. When users receive function results, explain them clearly and conversationally. 

- Highlight important information
- Explain technical terms in simple language  
- Format data in a readable way
- Be encouraging and helpful
- Respond directly to the user as Gemini AI`;

  try {
    // Initialize Google GenAI
    const ai = new GoogleGenAI({});
    
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });
    const text = result.text;
    
    return (text ?? '').trim() || "Here are your results!";
    
  } catch (e: any) {
    console.error('[Result Formatting Error]', e);
    return `Here are your results:\n\`\`\`json\n${JSON.stringify(functionResult, null, 2)}\n\`\`\``;
  }
}