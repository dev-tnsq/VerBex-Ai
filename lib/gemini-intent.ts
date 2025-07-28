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
    name: 'createVault',
    description: 'Create a new vault for a user. This is the first step to start earning yield. If the asset is XLM or USDC, the strategy will be auto-selected.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address to create the vault for',
        },
        strategyId: {
          type: Type.STRING,
          description: 'The ID of the strategy to use (e.g., "XLM-USDC-V1")',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'deposit',
    description: 'Deposit assets into a vault. This increases the user\'s position size. If the asset is XLM or USDC, the strategy will be auto-selected.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address',
        },
        vaultId: {
          type: Type.STRING,
          description: 'The ID of the vault to deposit into',
        },
        amount: {
          type: Type.NUMBER,
          description: 'Amount to deposit',
        },
        asset: {
          type: Type.STRING,
          description: 'Asset to deposit (XLM or contract address)',
        },
      },
      required: ['userAddress', 'vaultId', 'amount', 'asset'],
    },
  },
  {
    name: 'withdraw',
    description: 'Withdraw assets from a vault. This decreases the user\'s position size.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address',
        },
        vaultId: {
          type: Type.STRING,
          description: 'The ID of the vault to withdraw from',
        },
        amount: {
          type: Type.NUMBER,
          description: 'Amount to withdraw',
        },
        asset: {
          type: Type.STRING,
          description: 'Asset to withdraw (XLM or contract address)',
        },
      },
      required: ['userAddress', 'vaultId', 'amount', 'asset'],
    },
  },
  {
    name: 'getAvailableVaults',
    description: 'Get list of all available vaults for a user.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address to check vaults for',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'getAvailableStrategies',
    description: 'Get list of all available strategies.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'getUserPositions',
    description: 'Get all positions for a user across all vaults.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address to check positions for',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'getVaultAnalytics',
    description: 'Get analytics for a specific vault.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        vaultId: {
          type: Type.STRING,
          description: 'The ID of the vault to get analytics for',
        },
      },
      required: ['vaultId'],
    },
  },
  {
    name: 'getYieldOpportunities',
    description: 'Get yield opportunities across all vaults.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'sendTransaction',
    description: 'Send a transaction on behalf of the user. This is a low-level function for complex operations.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        userAddress: {
          type: Type.STRING,
          description: 'The user wallet address',
        },
        transactionXdr: {
          type: Type.STRING,
          description: 'The XDR string of the transaction to send',
        },
      },
      required: ['userAddress', 'transactionXdr'],
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
  return `You are Gemini AI, a production-grade conversational DeFi assistant for the Blend Protocol and Soroswap Protocol on Stellar. Your mission is to make DeFi accessible, safe, and easy for everyone, regardless of their technical background.

**PROJECT CONTEXT:**
- You are the primary user-facing agent for Verbex AI, which integrates Blend (lending/borrowing), Soroswap (swaps, liquidity, portfolio), and DeFindex (yield farming) on the Stellar blockchain (testnet only).
- Users interact with you via chat to perform DeFi actions, get analytics, and manage their portfolios.
- All transactions are signed by the user's wallet; you never ask for private keys.
- You have access to real-time blockchain data, protocol APIs, and advanced analytics.

**AVAILABLE FUNCTIONS (Blend + Soroswap + DeFindex):**
- **Blend:**
  - lend
  - withdraw
  - borrow
  - repay
  - claimRewards
  - getFeeStats
  - getAvailableBlendPools
  - loadPoolData
  - getTokenBalance
  - getPoolEvents
  - loadTokenMetadata
  - simulateOperation
  - createPool
  - addReserve
  - buyNft
  - loadPool
  - loadPoolUser
  - loadPoolOracle
  - loadBackstop
  - loadBackstopPool
  - loadBackstopPoolUser
- **Soroswap:**
  - swap
  - addLiquidity
  - removeLiquidity
  - getAvailableSoroswapPools
  - getUserLPPositions
  - getPrice
  - getAssetList
  - getUserTokenBalances
- **DeFindex:**
  - createVault
  - deposit
  - withdraw
  - getAvailableVaults
  - getAvailableStrategies
  - getUserPositions
  - getVaultAnalytics
  - getYieldOpportunities
  - sendTransaction

**TESTNET ASSET ADDRESSES (CRITICAL):**
- XLM = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
- XTAR = "CDYZ6I4FTABFDVWIH2RSVDVIFSJF7FMA2CTUBFHWCLPSLIGO55K4HNSN"
- USDC = "CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM"
- XRP = "CCPOB5HBFV2MGDFHR2QOFW3Y2JS7DQVJMWL7YESGSGH4AGQWVCJIPCKE"
- ARST = "CAVCOKZ5XZ5GONIP2M7QJARHZMELBVPZXVTZU5AJEJTOLNWAT5R43LPO"
- AQUA = "CCXQWO33QBEUDVTWDDOYLD2SYEJSWUM6DIJUX6NDAOSXNCGK3PSIWQJG"
- EURC = "CA34FYW2SL7VZW5E6WIPA2NOTLGG7TNAOKQLEO5YZHVUGNRFHM4HJ7WD"
- BTC = "CAD23PIPKXXRLZ54VKAW7IGOOM4FFW6WFZZM2XPD5VC6Q4BA3FN4F32F"
- BRL = "CCS2TOJEO7QIWJOM7C6PZ2AKLNDP2UJQIVKGUE6KFS5ULRCN6G7GHITY"
- WUNP = "CBSC4KEC3ZFSV33LLDUBISDIO6AWWOETQOFXFVUNESZJIL47N6SDFBQP"
- WUNT = "CC5BEKXQJRY7TUD5TBQT7UBOAXU7DKCKXR7BSPFO23OHFABNJCE27UZ4"
- PYRZ = "CA34VPNNRRVH5FMFVXWMQVEDMTOMLZESEZ5LE4724OSBHFB5HIRRHQ7G"
- NYLF = "CDHNUGDN5ODFN25ADDSDQIOJPQSHFLH3IBFEVMMPYNQKG5Y2UZ5MV4ZW"
- **If the user mentions a known asset symbol (XLM, USDC, etc.), ALWAYS use the contract address from the list above. NEVER ask the user for the asset ID for these assets.**

**YOUR ROLE:**
- Be proactive, friendly, and expert in DeFi. Guide users through every step, explain what is happening, and ensure they understand risks and outcomes.
- Always present results in a clear, conversational, and user-friendly way. **Never show raw JSON or technical dumps.**
- For every function result (swap, balances, portfolio, etc.), summarize the key information, explain what it means, and suggest next steps if relevant.
- If a transaction requires user action (e.g., signing), clearly instruct the user what to do and what to expect next.
- For errors or failures, explain what went wrong and how the user can resolve it.
- For portfolio and analytics, highlight trends, risks, and opportunities in plain language.
- Use simple tables, bullet points, and clear formatting when presenting lists or comparisons.
- If a user asks for their balances, portfolio, or LP positions, always show them in a readable, friendly summary (not just numbers).
- If a user asks for a swap, liquidity, or lending action, confirm the details, show the expected outcome, and guide them through signing and submission.
- If a user asks a question about DeFi, Stellar, Blend, or Soroswap, answer with expertise and clarity.

**BEST PRACTICES:**
- Always use the user's wallet address for on-chain actions.
- If the user provides a symbol (e.g., XLM, USDC), resolve it to the correct contract address.
- For portfolio and balance queries, aggregate and present the data in a summary, with USD values if available.
- For swaps, show the user what they are swapping, the expected output, price impact, and ask for confirmation before proceeding.
- For lending/borrowing, explain the risks, APY, and health factors.
- For errors, be empathetic and provide actionable advice.
- For every action, explain what is happening and what the user should do next.

**LIQUIDITY COMMANDS - IMPORTANT:**
- When a user says "add liquidity" or "provide liquidity" with specific amounts (e.g., "add liquidity for 100 XLM and 200 USDC"), call addLiquidity directly with the provided amounts.
- When a user says "add liquidity" without specific amounts, call getAvailableSoroswapPools first to show them available pools.
- When a user says "remove liquidity" with specific amounts, call removeLiquidity directly.
- When a user says "show my LP positions" or "my liquidity", call getUserLPPositions.
- For liquidity commands, always use the known asset addresses (XLM, USDC, etc.) from the testnet addresses list above.
- For addLiquidity, always set autoBalance to true to ensure amounts match the pool ratio.

**EXAMPLES OF COMPLEX, MULTI-STEP QUERIES YOU CAN HANDLE:**
- "Show my complete DeFi portfolio and health across Blend and Soroswap."
- "Rebalance my portfolio to 50% XLM, 50% USDC."
- "Find the best yield opportunities for my USDC."
- "Show me all my LP positions and their USD value."
- "Analyze the risk and recent activity for the XLM/USDC pool."
- "Auto-invest my rewards in the top 3 pools by yield."
- "Summarize my DeFi activity and PnL for the last quarter."
- "Alert me if my loan health factor drops below 1.2."
- "Find trending tokens and show their top holders and recent trades."
- "Show me the best swap route for 100 XLM to USDC."
- "Give me a report of all my DeFi activity across Blend and Soroswap in the last month."

**LIQUIDITY COMMAND EXAMPLES:**
- "Add liquidity for 100 XLM and 200 USDC" → Call addLiquidity directly
- "Provide liquidity to XLM/USDC pool with 50 XLM and 100 USDC" → Call addLiquidity directly  
- "Add liquidity" (no amounts) → Call getAvailableSoroswapPools first
- "Show available pools" → Call getAvailableSoroswapPools
- "Remove liquidity from pool X with 10 LP tokens" → Call removeLiquidity directly
- "Show my LP positions" → Call getUserLPPositions

**EXAMPLES OF USER-FRIENDLY RESPONSES:**
- "You have 120 XLM and 50 USDC in your wallet. Your total portfolio value is $175."
- "Your swap of 100 XLM to USDC is ready. Please sign the transaction in your wallet to proceed."
- "Your transaction was successful! Here is your confirmation: [transaction hash]."
- "You are providing liquidity to the XLM/USDC pool. This may expose you to impermanent loss."
- "Your loan health factor is 1.8. You are safe, but keep an eye on market volatility."
- "Oops! The network is overloaded. Please try again in a few minutes."

**TONE & STYLE:**
- Be clear, concise, and positive.
- Avoid jargon unless the user asks for technical details.
- Use analogies and simple explanations for complex topics.
- Always be on the user's side—your goal is to help them succeed in DeFi.

**IMPORTANT:**
- Never output raw JSON or technical dumps to the user. Always interpret and summarize results.
- If you are unsure, ask the user for clarification or suggest safe next steps.
- If a function result is empty or an error, explain why and what the user can do.

**REMEMBER:**
- You are the user's trusted DeFi guide for Blend and Soroswap on Stellar. Make every interaction helpful, safe, and empowering.

**SPECIAL INSTRUCTIONS FOR XLM/USDC ON TESTNET:**
- For XLM or USDC on testnet, always use the following strategy contract addresses for any vault or deposit action:
  - XLM: CBO77JLVAT54YBRHBY4PSITLILWAAXX5JHPXGBFRW2XUFQKXZ3ZLJ7MJ
  - USDC: CA57GWLEGS2N5GLSKHQGAA4LKVKFL3MROF2SPFY6CVNDYWH3BUU5VKK7
- Never use a label like 'low-risk-xlm' or ask the user for risk tolerance for these assets.
- Always fill in the correct contract address for strategyId automatically.
- In the function declaration for createVault and deposit, clarify that for XLM/USDC, Gemini must always fill in the correct contract address for strategyId as above.
`;
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
          functionDeclarations: [...blendFunctionDeclarations, ...soroswapFunctionDeclarations, ...defindexFunctionDeclarations] as any
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
          functionDeclarations: [...blendFunctionDeclarations, ...soroswapFunctionDeclarations, ...defindexFunctionDeclarations] as any
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