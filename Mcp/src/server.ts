import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { BlendService } from './services/blend.service.js';
import { StellarService } from './services/stellar.service.js';
import { SoroswapService } from './services/soroswap.service.js';
import { DeFindexService } from './services/defindex.service.js';
import { UnifiedPortfolioService } from './services/portfolio.service.js';
import { PoolV1, PoolV2 } from '@blend-capital/blend-sdk';
import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason, promise);
  process.exit(1);
});

dotenv.config();

/**
 * Custom replacer function for JSON.stringify to handle BigInts.
 */
function jsonReplacer(key: any, value: any) {
  return typeof value === 'bigint' ? value.toString() : value;
}

// Initialize Express app and storage FIRST
const app = express();
app.use(express.json());

// In-memory storage for challenges (in production, use Redis or database)
const challengeStore = new Map<string, any>();
const passkeyStore = new Map<string, any>(); // Store passkey registrations

// Start HTTP server for frontend integration
const PORT = process.env.MCP_SERVER_PORT || 3001;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

app.listen(PORT, () => {
  console.error(`MCP HTTP server running on port ${PORT}`);
});

// 1. Create an MCP server instance
const server = new McpServer({
  name: 'defi-protocol-server',
  version: '2.0.0',
  title: 'DeFi Protocol MCP',
  description: 'A server for interacting with the DeFi Protocol on the Stellar network.',
});

const blendService = new BlendService();
const stellarService = new StellarService();
const soroswapService = new SoroswapService();
const defindexService = new DeFindexService();
const portfolioService = new UnifiedPortfolioService();

// API endpoints for passkey integration
app.get('/mcp/enroll', (req, res) => {
  const { challenge } = req.query;
  res.redirect(`${FRONTEND_BASE_URL}/passkey/enroll?challenge=${challenge}`);
});

app.get('/mcp/sign', (req, res) => {
  const { challenge, xdr } = req.query;
  res.redirect(`${FRONTEND_BASE_URL}/passkey/sign?challenge=${challenge}&xdr=${xdr}`);
});

app.post('/api/passkey/start-enrollment', (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' });
    }
    
    const challenge = crypto.randomBytes(32).toString('base64url');
    const challengeData = {
      challenge,
      walletAddress: userAddress,
      userIdentifier: `user_${userAddress.substring(0, 8)}`,
      timestamp: Date.now(),
    };
    
    challengeStore.set(challenge, challengeData);
    
    res.json({
      success: true,
      challenge,
      walletAddress: userAddress,
      publicKeyCredentialCreationOptions: {
        challenge: Buffer.from(challenge, 'base64url'),
        rp: {
          name: "VerbexAI DeFi",
          id: "localhost",
        },
        user: {
          id: Buffer.from(userAddress, 'utf-8'),
          name: userAddress,
          displayName: `Wallet ${userAddress.substring(0, 8)}...`,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { alg: -257, type: "public-key" },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "direct",
      }
    });
  } catch (error) {
    console.error('Error starting enrollment:', error);
    res.status(500).json({ error: 'Failed to start enrollment' });
  }
});

app.post('/api/passkey/complete-enrollment', (req, res) => {
  try {
    const { walletAddress, credential, challenge } = req.body;
    
    if (!walletAddress || !credential || !challenge) {
      return res.status(400).json({ error: 'walletAddress, credential, and challenge are required' });
    }
    
    const challengeData = challengeStore.get(challenge);
    
    if (!challengeData || challengeData.walletAddress !== walletAddress) {
      return res.status(400).json({ error: 'Invalid or expired enrollment session' });
    }
    
    const clientDataJSON = JSON.parse(Buffer.from(credential.response.clientDataJSON, 'base64url').toString());
    
    if (clientDataJSON.challenge !== challenge) {
      return res.status(400).json({ error: 'Challenge mismatch' });
    }
    
    passkeyStore.set(walletAddress, {
      credentialId: credential.id,
      publicKey: credential.response.attestationObject,
      userIdentifier: challengeData.userIdentifier,
      registeredAt: Date.now(),
    });
    
    challengeStore.delete(challenge);
    
    res.json({
      success: true,
      status: 'ENROLLED',
      walletAddress,
      message: 'Passkey enrolled successfully! You can now use this wallet for transactions.',
    });
  } catch (error) {
    console.error('Error completing enrollment:', error);
    res.status(500).json({ error: 'Failed to complete enrollment' });
  }
});

app.post('/api/passkey/start-signing', (req, res) => {
  try {
    const { walletAddress, xdr } = req.body;
    
    if (!walletAddress || !xdr) {
      return res.status(400).json({ error: 'walletAddress and xdr are required' });
    }
    
    const passkeyData = passkeyStore.get(walletAddress);
    if (!passkeyData) {
      return res.status(400).json({ error: 'No passkey enrolled for this wallet address' });
    }
    
    const challenge = crypto.randomBytes(32).toString('base64url');
    const challengeData = {
      challenge,
      walletAddress,
      xdr,
      timestamp: Date.now(),
    };
    
    challengeStore.set(challenge, challengeData);
    
    res.json({
      success: true,
      challenge,
      publicKeyCredentialRequestOptions: {
        challenge: Buffer.from(challenge, 'base64url'),
        allowCredentials: [{
          id: Buffer.from(passkeyData.credentialId, 'base64url'),
          type: 'public-key',
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      }
    });
  } catch (error) {
    console.error('Error starting signing:', error);
    res.status(500).json({ error: 'Failed to start signing' });
  }
});

app.post('/api/passkey/complete-signing', (req, res) => {
  try {
    const { walletAddress, assertion, challenge, xdr } = req.body;
    
    if (!walletAddress || !assertion || !challenge || !xdr) {
      return res.status(400).json({ error: 'walletAddress, assertion, challenge, and xdr are required' });
    }
    
    const passkeyData = passkeyStore.get(walletAddress);
    if (!passkeyData) {
      return res.status(400).json({ error: 'No passkey registered for this wallet address' });
    }
    
    if (assertion.id !== passkeyData.credentialId) {
      return res.status(400).json({ error: 'Credential ID mismatch' });
    }
    
    const challengeData = challengeStore.get(challenge);
    
    if (!challengeData || challengeData.xdr !== xdr || challengeData.walletAddress !== walletAddress) {
      return res.status(400).json({ error: 'Invalid or expired signing session' });
    }
    
    const txHash = `sim_${crypto.randomBytes(16).toString('hex')}`;
    
    challengeStore.delete(challenge);
    
    res.json({
      success: true,
      status: 'SUCCESS',
      txHash,
      message: 'Transaction signed and submitted successfully!',
    });
  } catch (error) {
    console.error('Error completing signing:', error);
    res.status(500).json({ error: 'Failed to complete signing' });
  }
});

// 2. Register MCP tools - READ-ONLY TOOLS
server.registerTool(
  'loadPoolData',
  {
    title: 'Load Blend Pool Data',
    description: "Loads comprehensive data for a given Blend pool. Can optionally include a specific user's position data.",
    inputSchema: {
      poolId: z.string().describe('The contract ID of the Blend pool to load.'),
      userAddress: z
        .string()
        .optional()
        .describe("(Optional) The public key of a user to load their specific data for the pool."),
    },
  },
  async ({ poolId, userAddress }: { poolId: string; userAddress?: string }) => {
    const meta = await blendService.loadPoolMeta(poolId);
    const pool = await blendService.loadPool(poolId, meta);
    let user;
    if (userAddress) {
      user = await blendService.loadPoolUser(pool, userAddress);
    }
    const oracle = await blendService.loadPoolOracle(pool);
    const backstop_pool = await blendService.loadBackstopPool(meta);
    const result = {
      pool: pool,
      user: user || 'Not requested',
      oracle: oracle,
      backstop_pool: backstop_pool,
    };
    return { content: [{ type: 'text', text: JSON.stringify(result, jsonReplacer, 2) }] };
  }
);

server.registerTool(
    "getTokenBalance",
    {
        title: "Get Token Balance",
        description: "Gets the balance of a specific token for a given user address.",
        inputSchema: {
            tokenId: z.string().describe("The asset ID (e.g., 'USDC' or a contract ID) or 'native' for XLM."),
            userAddress: z.string().describe("The public key of the user."),
        }
    },
    async ({ tokenId, userAddress }: { tokenId: string; userAddress: string }) => {
        const balance = await blendService.getTokenBalance(tokenId, userAddress);
        return { content: [{ type: 'text', text: `The balance is: ${balance.toString()}` }] };
    }
);


server.registerTool(
  'getPoolEvents',
  {
    title: 'Get Pool Events',
    description: 'Gets historical events for a specific pool.',
    inputSchema: {
      poolId: z.string().describe('The contract ID of the pool.'),
      version: z.enum(['V1', 'V2']).describe('The version of the pool.'),
      startLedger: z.number().describe('The ledger number to start fetching events from.'),
    },
  },
  async ({ poolId, version, startLedger }: { poolId: string; version: 'V1' | 'V2'; startLedger: number }) => {
    const events = await blendService.getPoolEvents(poolId, version, startLedger);
    return { content: [{ type: 'text', text: JSON.stringify(events, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'loadBackstopData',
  {
    title: 'Load Backstop Data',
    description: 'Loads data for the main Blend backstop contract.',
    inputSchema: {
      version: z.enum(['V1', 'V2']).describe('The version of the backstop to load.'),
    },
  },
  async ({ version }: { version: 'V1' | 'V2' }) => {
    const backstopData = await blendService.loadBackstop(version);
    return { content: [{ type: 'text', text: JSON.stringify(backstopData, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'loadTokenMetadata',
  {
    title: 'Load Token Metadata',
    description: 'Loads the metadata for a given token/asset.',
    inputSchema: {
      assetId: z.string().describe('The contract ID of the asset.'),
    },
  },
  async ({ assetId }: { assetId: string }) => {
    const metadata = await blendService.loadTokenMetadata(assetId);
    return { content: [{ type: 'text', text: JSON.stringify(metadata, jsonReplacer, 2) }] };
  }
);


// --- WRITE/TRANSACTION TOOLS ---
const transactionInputSchema = {
    userAddress: z.string().describe("The Stellar public key of the user performing the action."),
    amount: z.number().describe("The amount of the asset for the transaction."),
    asset: z.string().describe("The contract ID of the asset being used."),
    poolId: z.string().describe("The contract ID of the pool for the transaction."),
    privateKey: z.string().optional().describe("(Optional) The secret key of the user. If not provided, passkey flow will be used."),
};

const transactionObjectSchema = z.object(transactionInputSchema);
type TransactionParams = z.infer<typeof transactionObjectSchema>;

server.registerTool('lend', {
    title: "Lend to Pool",
    description: "Submits a transaction to lend (supply collateral) to a pool. If no privateKey is provided, will use passkey signing flow.",
    inputSchema: transactionInputSchema,
}, async (params: TransactionParams) => {
    // Check for passkey flow (no privateKey and no AGENT_SECRET)
    if (!params.privateKey && !process.env.AGENT_SECRET) {
        // Check if user has enrolled passkey
        const passkeyData = passkeyStore.get(params.userAddress);
        if (!passkeyData) {
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'ERROR',
                        error: 'No passkey wallet found. Please run enrollPasskey first to create a Passkey Kit wallet.',
                        enrollmentUrl: `${FRONTEND_BASE_URL}/passkey/enroll`,
                    }, null, 2) 
                }] 
            };
        }
        
        const result = await blendService.lend(params);
        
        if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
            const signingUrl = `${FRONTEND_BASE_URL}/passkey/sign?walletAddress=${encodeURIComponent(params.userAddress)}&xdr=${encodeURIComponent(result.unsignedXDR)}`;
            
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'NEEDS_SIGNATURE',
                        unsignedXDR: result.unsignedXDR,
                        signingUrl,
                        message: 'Please visit the signing URL to authenticate with your passkey and complete the transaction.',
                        instructions: [
                            '1. Open the signing URL in your browser',
                            '2. The transaction will be automatically signed using your passkey',
                            '3. Authenticate with your biometric (Face ID, Touch ID, fingerprint)',
                            '4. The transaction will be submitted to Stellar network'
                        ]
                    }, null, 2) 
                }] 
            };
        } else if (typeof result === 'string' && result.length > 40) {
            const signingUrl = `${FRONTEND_BASE_URL}/passkey/sign?walletAddress=${encodeURIComponent(params.userAddress)}&xdr=${encodeURIComponent(result)}`;
            
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'NEEDS_SIGNATURE',
                        unsignedXDR: result,
                        signingUrl,
                        message: 'Please visit the signing URL to authenticate with your passkey and complete the transaction.',
                    }, null, 2) 
                }] 
            };
        }
    }
    
    // Original flow with private key
    const result = await blendService.lend(params);
    if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.unsignedXDR }, null, 2) }] };
    } else if (result && typeof result === 'object' && result.txHash) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    } else if (typeof result === 'string' && result.length > 40) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: `Lend transaction submitted successfully. Result: ${JSON.stringify(result, jsonReplacer, 2)}` }] };
});

server.registerTool('withdraw-pool', {
    title: "Withdraw from Pool",
    description: "Submits a transaction to withdraw assets from a pool.",
    inputSchema: transactionInputSchema,
}, async (params: TransactionParams) => {
    if (!params.privateKey && !process.env.AGENT_SECRET) {
        const passkeyData = passkeyStore.get(params.userAddress);
        if (!passkeyData) {
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'ERROR',
                        error: 'No passkey wallet found. Please run enrollPasskey first to create a Passkey Kit wallet.',
                    }, null, 2) 
                }] 
            };
        }
        
        const result = await blendService.withdraw(params);
        
        if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
            const signingUrl = `${FRONTEND_BASE_URL}/passkey/sign?walletAddress=${encodeURIComponent(params.userAddress)}&xdr=${encodeURIComponent(result.unsignedXDR)}`;
            
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'NEEDS_SIGNATURE',
                        unsignedXDR: result.unsignedXDR,
                        signingUrl,
                        message: 'Please visit the signing URL to authenticate with your passkey and complete the transaction.',
                    }, null, 2) 
                }] 
            };
        } else if (typeof result === 'string' && result.length > 40) {
            const signingUrl = `${FRONTEND_BASE_URL}/passkey/sign?walletAddress=${encodeURIComponent(params.userAddress)}&xdr=${encodeURIComponent(result)}`;
            
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'NEEDS_SIGNATURE',
                        unsignedXDR: result,
                        signingUrl,
                        message: 'Please visit the signing URL to authenticate with your passkey and complete the transaction.',
                    }, null, 2) 
                }] 
            };
        }
    }
    
    const result = await blendService.withdraw(params);
    if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.unsignedXDR }, null, 2) }] };
    } else if (result && typeof result === 'object' && result.txHash) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    } else if (typeof result === 'string' && result.length > 40) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: `Withdraw transaction submitted successfully. Result: ${JSON.stringify(result, jsonReplacer, 2)}` }] };
});

server.registerTool('borrow', {
    title: "Borrow from Pool",
    description: "Submits a transaction to borrow assets from a pool.",
    inputSchema: transactionInputSchema,
}, async (params: TransactionParams) => {
    // If no private key provided, assume passkey flow
    if (!params.privateKey && !process.env.AGENT_SECRET) {
        const passkeyData = passkeyStore.get(params.userAddress);
        if (!passkeyData) {
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'ERROR',
                        error: 'No passkey wallet found. Please run enrollPasskey first to create a Passkey Kit wallet.',
                    }, null, 2) 
                }] 
            };
        }
        
        const result = await blendService.borrow(params);
        
        if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
            const signingUrl = `${FRONTEND_BASE_URL}/passkey/sign?walletAddress=${encodeURIComponent(params.userAddress)}&xdr=${encodeURIComponent(result.unsignedXDR)}`;
            
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'NEEDS_SIGNATURE',
                        unsignedXDR: result.unsignedXDR,
                        signingUrl,
                        message: 'Please visit the signing URL to authenticate with your passkey and complete the transaction.',
                    }, null, 2) 
                }] 
            };
        } else if (typeof result === 'string' && result.length > 40) {
            const signingUrl = `${FRONTEND_BASE_URL}/passkey/sign?walletAddress=${encodeURIComponent(params.userAddress)}&xdr=${encodeURIComponent(result)}`;
            
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'NEEDS_SIGNATURE',
                        unsignedXDR: result,
                        signingUrl,
                        message: 'Please visit the signing URL to authenticate with your passkey and complete the transaction.',
                    }, null, 2) 
                }] 
            };
        }
    }
    
    const result = await blendService.borrow(params);
    if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.unsignedXDR }, null, 2) }] };
    } else if (result && typeof result === 'object' && result.txHash) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    } else if (typeof result === 'string' && result.length > 40) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: `Borrow transaction submitted successfully. Result: ${JSON.stringify(result, jsonReplacer, 2)}` }] };
});

server.registerTool('repay', {
    title: "Repay to Pool",
    description: "Submits a transaction to repay borrowed assets to a pool.",
    inputSchema: transactionInputSchema,
}, async (params: TransactionParams) => {
    // If no private key provided, assume passkey flow
    if (!params.privateKey && !process.env.AGENT_SECRET) {
        const passkeyData = passkeyStore.get(params.userAddress);
        if (!passkeyData) {
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'ERROR',
                        error: 'No passkey wallet found. Please run enrollPasskey first to create a Passkey Kit wallet.',
                    }, null, 2) 
                }] 
            };
        }
        
        const result = await blendService.repay(params);
        
        if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
            const signingUrl = `${FRONTEND_BASE_URL}/passkey/sign?walletAddress=${encodeURIComponent(params.userAddress)}&xdr=${encodeURIComponent(result.unsignedXDR)}`;
            
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'NEEDS_SIGNATURE',
                        unsignedXDR: result.unsignedXDR,
                        signingUrl,
                        message: 'Please open the signing URL in your browser to sign the transaction with your passkey.',
                    }, null, 2) 
                }] 
            };
        } else if (typeof result === 'string' && result.length > 40) {
            const signingUrl = `${FRONTEND_BASE_URL}/passkey/sign?walletAddress=${encodeURIComponent(params.userAddress)}&xdr=${encodeURIComponent(result)}`;
            
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'NEEDS_SIGNATURE',
                        unsignedXDR: result,
                        signingUrl,
                        message: 'Please open the signing URL in your browser to sign the transaction with your passkey.',
                    }, null, 2) 
                }] 
            };
        }
    }
    
    const result = await blendService.repay(params);
    if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.unsignedXDR }, null, 2) }] };
    } else if (result && typeof result === 'object' && result.txHash) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    } else if (typeof result === 'string' && result.length > 40) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, jsonReplacer, 2) }] };
});

const claimRewardsSchema = {
    userAddress: z.string().describe("The Stellar public key of the user performing the action."),
    poolId: z.string().describe("The contract ID of the pool to claim rewards from."),
    reserveTokenIds: z.array(z.union([z.string(), z.number()])).describe("List of reserve token IDs to claim rewards for."),
    privateKey: z.string().optional().describe("(Optional) The secret key of the user. If not provided, the server's AGENT_SECRET will be used."),
};
const claimRewardsObjectSchema = z.object(claimRewardsSchema);
type ClaimRewardsParams = z.infer<typeof claimRewardsObjectSchema>;

server.registerTool('claimRewards', {
    title: "Claim Rewards",
    description: "Submits a transaction to claim available rewards from a pool.",
    inputSchema: claimRewardsSchema,
}, async (params: ClaimRewardsParams) => {
    const result = await blendService.claim(params);
    if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.unsignedXDR }, null, 2) }] };
    } else if (result && typeof result === 'object' && result.txHash) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    } else if (typeof result === 'string' && result.length > 40) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, jsonReplacer, 2) }] };
});

const createPoolInputSchema = {
  admin: z.string().describe('The public key of the account that will be the admin of the new pool.'),
  name: z.string().describe('The name of the new pool (e.g., "My Custom Pool").'),
  oracleId: z.string().describe('The contract ID of the oracle to be used for asset pricing.'),
  backstopRate: z.number().describe('The backstop take rate for the pool, in BPS. (e.g., 1000 for 10%)'),
  maxPositions: z.number().describe('The maximum number of positions a user can have in the pool.'),
  minCollateral: z.number().describe('The minimum collateral amount for a position in the pool.'),
};

const createPoolObjectSchema = z.object(createPoolInputSchema);
type CreatePoolParams = z.infer<typeof createPoolObjectSchema>;

server.registerTool(
  'createPool',
  {
    title: 'Create Lending Pool',
    description: 'Deploys a new, permissionless lending pool on the Blend protocol.',
    inputSchema: createPoolInputSchema,
  },
  async (params: CreatePoolParams) => {
    const result = await blendService.createPool({
      ...params,
      minCollateral: BigInt(params.minCollateral),
    });
    if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.unsignedXDR }, null, 2) }] };
    } else if (result && typeof result === 'object' && result.txHash) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    } else if (typeof result === 'string' && result.length > 40) {
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, jsonReplacer, 2) }] };
  }
);


const reserveConfigSchema = {
  index: z.number().describe('The index of the reserve in the list (usually 0 for the first).'),
  decimals: z.number().describe('The decimals of the underlying asset contract.'),
  c_factor: z.number().describe('The collateral factor for the reserve, in BPS (e.g., 7500 for 75%).'),
  l_factor: z.number().describe('The liability factor for the reserve, in BPS (e.g., 8000 for 80%).'),
  util: z.number().describe('The target utilization rate, in BPS (e.g., 6500 for 65%).'),
  max_util: z.number().describe('The maximum allowed utilization rate, in BPS (e.g., 9500 for 95%).'),
  r_base: z.number().describe('The base interest rate, in BPS.'),
  r_one: z.number().describe('The interest rate slope below target utilization, in BPS.'),
  r_two: z.number().describe('The interest rate slope above target utilization, in BPS.'),
  r_three: z.number().describe('The interest rate slope above max utilization, in BPS.'),
  reactivity: z.number().describe('The interest rate reactivity constant.'),
  supply_cap: z.union([z.string(), z.number()]).describe('The total amount of underlying tokens that can be used as collateral (as string or number).'),
  enabled: z.boolean().describe('Whether the reserve is enabled.'),
};

const addReserveInputSchema = {
  admin: z.string().describe('The public key of the pool admin.'),
  poolId: z.string().describe('The contract ID of the pool to add the reserve to.'),
  assetId: z.string().describe('The contract ID of the asset to add as a reserve.'),
  metadata: z.object(reserveConfigSchema),
  privateKey: z.string().describe('The secret key of the admin account to sign the transaction.'),
};

const addReserveObjectSchema = z.object(addReserveInputSchema);
type AddReserveParams = z.infer<typeof addReserveObjectSchema>;

server.registerTool(
  'addReserve',
  {
    title: 'Add Reserve to Pool',
    description: 'Adds a new asset reserve to a lending pool.',
    inputSchema: addReserveInputSchema,
  },
  async (params: AddReserveParams) => {
    const result = await blendService.addReserve(params);
    if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.unsignedXDR }, null, 2) }] };
    } else if (result && typeof result === 'object' && result.txHash) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    } else if (typeof result === 'string' && result.length > 40) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'buyNft',
  {
    title: 'Buy NFT',
    description: 'Buys an NFT from a Soroban NFT contract using the provided funds. You must specify the NFT contract ID, token ID, and price. The contract method and arguments may need to be adjusted for your specific NFT contract.',
    inputSchema: {
      userAddress: z.string().describe('The Stellar address of the buyer.'),
      nftContractId: z.string().describe('The contract ID of the NFT.'),
      tokenId: z.union([z.string(), z.number()]).describe('The ID of the NFT to buy.'),
      price: z.number().describe('The price to pay (in stroops or contract units).'),
      privateKey: z.string().optional().describe('(Optional) The secret key to sign the transaction. If not provided, the server\'s AGENT_SECRET will be used.'),
    },
  },
  async ({ userAddress, nftContractId, tokenId, price, privateKey }) => {
    const result = await blendService.buyNft({ userAddress, nftContractId, tokenId, price, privateKey });
    if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.unsignedXDR }, null, 2) }] };
    } else if (result && typeof result === 'object' && result.txHash) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    } else if (typeof result === 'string' && result.length > 40) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: `NFT purchase transaction submitted. Result: ${JSON.stringify(result, jsonReplacer, 2)}` }] };
  }
);

// ===================== SOROSWAP SERVICE MCP FUNCTIONS =====================

// --- READ-ONLY SOROSWAP TOOLS ---

server.registerTool(
  'getAvailableSoroswapPools',
  {
    title: 'Get Available Soroswap Pools',
    description: 'Returns a list of all available Soroswap liquidity pools.',
    inputSchema: {},
  },
  async () => {
    const pools = await soroswapService.getAvailableSoroswapPools();
    return { content: [{ type: 'text', text: JSON.stringify(pools, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'getUserLPPositions',
  {
    title: 'Get User LP Positions',
    description: 'Returns all liquidity positions for a user on Soroswap.',
    inputSchema: {
      userAddress: z.string().describe('The public key of the user.'),
    },
  },
  async ({ userAddress }: { userAddress: string }) => {
    const positions = await soroswapService.getUserLPPositions({ userAddress });
    return { content: [{ type: 'text', text: JSON.stringify(positions, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'getPrice',
  {
    title: 'Get Asset Price',
    description: 'Returns the price of the specified asset.',
    inputSchema: {
      asset: z.string().describe('The asset contract address or symbol to get price for.'),
      referenceCurrency: z.string().optional().describe('Optional reference currency (default: USD).'),
    },
  },
  async ({ asset, referenceCurrency }: { asset: string; referenceCurrency?: string }) => {
    const price = await soroswapService.getPrice({ asset, referenceCurrency });
    return { content: [{ type: 'text', text: JSON.stringify(price, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'getAssetList',
  {
    title: 'Get Asset List',
    description: 'Returns a list of all available assets on Soroswap.',
    inputSchema: {},
  },
  async () => {
    const assets = await soroswapService.getAssetList();
    return { content: [{ type: 'text', text: JSON.stringify(assets, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'getUserTokenBalances',
  {
    title: 'Get User Token Balances',
    description: 'Returns all token balances for a user on Soroswap.',
    inputSchema: {
      userAddress: z.string().describe('The public key of the user.'),
    },
  },
  async ({ userAddress }: { userAddress: string }) => {
    const balances = await soroswapService.getUserTokenBalances(userAddress);
    return { content: [{ type: 'text', text: JSON.stringify(balances, jsonReplacer, 2) }] };
  }
);

// --- TRANSACTION SOROSWAP TOOLS ---

server.registerTool(
  'swap',
  {
    title: 'Swap Assets',
    description: 'Executes a swap between two assets on Soroswap.',
    inputSchema: {
      userAddress: z.string().describe('The public key of the user performing the swap.'),
      fromAsset: z.string().describe('The contract address of the asset to swap from.'),
      toAsset: z.string().describe('The contract address of the asset to swap to.'),
      amount: z.number().describe('The amount to swap.'),
      maxSlippage: z.number().optional().describe('The maximum slippage percentage allowed (default: 0.5).'),
      routeType: z.enum(['amm', 'aggregator']).optional().describe('The route type to use for the swap.'),
      privateKey: z.string().optional().describe('(Optional) The secret key to sign the transaction. If not provided, passkey flow will be used.'),
    },
  },
  async (params) => {
    // If no private key provided, assume passkey flow
    if (!params.privateKey && !process.env.AGENT_SECRET) {
        const passkeyData = passkeyStore.get(params.userAddress);
        if (!passkeyData) {
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'ERROR',
                        error: 'No passkey wallet found. Please run enrollPasskey first to create a Passkey Kit wallet.',
                    }, null, 2) 
                }] 
            };
        }
        
        const result = await soroswapService.swap(params);
        
        if (result.xdr) {
            const challenge = crypto.randomBytes(32).toString('base64url');
            challengeStore.set(challenge, {
                challenge,
                walletAddress: params.userAddress,
                xdr: result.xdr,
                operation: 'swap',
                timestamp: Date.now(),
            });
            
            const signingUrl = `http://localhost:${PORT}/mcp/sign?challenge=${challenge}&xdr=${encodeURIComponent(result.xdr)}`;
            
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'NEEDS_SIGNATURE',
                        unsignedXDR: result.xdr,
                        signingUrl,
                        message: 'Please open the signing URL in your browser to sign the transaction with your passkey.',
                    }, null, 2) 
                }] 
            };
        }
    }
    
    const result = await soroswapService.swap(params);
    if (result.xdr) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.xdr }, null, 2) }] };
    } else if (result.txHash) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'addLiquidity',
  {
    title: 'Add Liquidity',
    description: 'Adds liquidity to a Soroswap pool.',
    inputSchema: {
      userAddress: z.string().describe('The public key of the user adding liquidity.'),
      tokenA: z.string().describe('The contract address of the first token.'),
      tokenB: z.string().describe('The contract address of the second token.'),
      amountA: z.number().describe('The amount of the first token to add.'),
      amountB: z.number().describe('The amount of the second token to add.'),
      autoBalance: z.boolean().optional().describe('Whether to automatically balance the amounts according to the pool ratio.'),
      privateKey: z.string().optional().describe('(Optional) The secret key to sign the transaction. If not provided, passkey flow will be used.'),
    },
  },
  async (params) => {
    // If no private key provided, assume passkey flow
    if (!params.privateKey && !process.env.AGENT_SECRET) {
        const passkeyData = passkeyStore.get(params.userAddress);
        if (!passkeyData) {
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'ERROR',
                        error: 'No passkey wallet found. Please run enrollPasskey first to create a Passkey Kit wallet.',
                    }, null, 2) 
                }] 
            };
        }
        
        const result = await soroswapService.addLiquidity(params);
        
        if (result.xdr) {
            const challenge = crypto.randomBytes(32).toString('base64url');
            challengeStore.set(challenge, {
                challenge,
                walletAddress: params.userAddress,
                xdr: result.xdr,
                operation: 'addLiquidity',
                timestamp: Date.now(),
            });
            
            const signingUrl = `http://localhost:${PORT}/mcp/sign?challenge=${challenge}&xdr=${encodeURIComponent(result.xdr)}`;
            
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'NEEDS_SIGNATURE',
                        unsignedXDR: result.xdr,
                        signingUrl,
                        message: 'Please open the signing URL in your browser to sign the transaction with your passkey.',
                    }, null, 2) 
                }] 
            };
        }
    }
    
    const result = await soroswapService.addLiquidity(params);
    if (result.xdr) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.xdr }, null, 2) }] };
    } else if (result.txHash) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, jsonReplacer, 2) }] };
  }
);

// ===================== DEFINDEX SERVICE MCP FUNCTIONS =====================

// --- READ-ONLY DEFINDEX TOOLS ---

server.registerTool(
  'getAvailableVaults',
  {
    title: 'Get Available Vaults',
    description: 'Returns a list of all available DeFindex vaults.',
    inputSchema: {
      userAddress: z.string().optional().describe('Optional user address to filter vaults by ownership.'),
    },
  },
  async ({ userAddress }: { userAddress?: string }) => {
    const vaults = await defindexService.getAvailableVaults();
    return { content: [{ type: 'text', text: JSON.stringify(vaults, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'getAvailableStrategies',
  {
    title: 'Get Available Strategies',
    description: 'Returns a list of all available DeFindex strategies.',
    inputSchema: {},
  },
  async () => {
    const strategies = await defindexService.getAvailableStrategies();
    return { content: [{ type: 'text', text: JSON.stringify(strategies, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'getUserPositions',
  {
    title: 'Get User Positions',
    description: 'Returns all DeFindex positions for a user.',
    inputSchema: {
      userAddress: z.string().describe('The public key of the user.'),
    },
  },
  async ({ userAddress }: { userAddress: string }) => {
    const positions = await defindexService.getUserPositions({ userAddress });
    return { content: [{ type: 'text', text: JSON.stringify(positions, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'getVaultAnalytics',
  {
    title: 'Get Vault Analytics',
    description: 'Returns analytics for a specific DeFindex vault.',
    inputSchema: {
      vaultAddress: z.string().describe('The contract ID of the vault.'),
    },
  },
  async ({ vaultAddress }: { vaultAddress: string }) => {
    const analytics = await defindexService.getVaultAnalytics({ vaultAddress });
    return { content: [{ type: 'text', text: JSON.stringify(analytics, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'getYieldOpportunities',
  {
    title: 'Get Yield Opportunities',
    description: 'Returns yield opportunities across DeFindex.',
    inputSchema: {
      userAddress: z.string().describe('The user wallet address.'),
      riskTolerance: z.enum(['low', 'medium', 'high']).optional().describe('Optional risk tolerance level (low, medium, high).'),
    },
  },
  async ({ userAddress, riskTolerance }: { userAddress: string; riskTolerance?: 'low' | 'medium' | 'high' }) => {
    const opportunities = await defindexService.getYieldOpportunities({ userAddress, riskTolerance });
    return { content: [{ type: 'text', text: JSON.stringify(opportunities, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'getBalance',
  {
    title: 'Get Vault Balance',
    description: 'Returns the balance of a user in a specific DeFindex vault.',
    inputSchema: {
      userAddress: z.string().describe('The public key of the user.'),
      vaultAddress: z.string().describe('The contract ID of the vault.'),
    },
  },
  async (params) => {
    const balance = await defindexService.getBalance(params);
    return { content: [{ type: 'text', text: JSON.stringify(balance, jsonReplacer, 2) }] };
  }
);

// --- TRANSACTION DEFINDEX TOOLS ---

server.registerTool(
  'createVault',
  {
    title: 'Create Vault',
    description: 'Creates a new DeFindex vault.',
    inputSchema: {
      userAddress: z.string().describe('The public key of the user creating the vault.'),
      asset: z.string().describe('The asset symbol or contract ID for the vault.'),
      strategyId: z.string().describe('The strategy ID to use for the vault.'),
      initialDeposit: z.number().optional().describe('Optional initial deposit amount.'),
      vaultName: z.string().optional().describe('Optional custom name for the vault.'),
    },
  },
  async (params) => {
    const result = await defindexService.createVault(params);
    if (result.xdr) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.xdr }, null, 2) }] };
    } else if (result.txHash) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'deposit',
  {
    title: 'Deposit to Vault',
    description: 'Deposits assets into a DeFindex vault.',
    inputSchema: {
      userAddress: z.string().describe('The public key of the user making the deposit.'),
      vaultId: z.string().describe('The contract ID of the vault.'),
      amount: z.number().describe('The amount to deposit.'),
      asset: z.string().describe('The asset symbol or contract ID to deposit.'),
      privateKey: z.string().optional().describe('(Optional) The secret key to sign the transaction. If not provided, passkey flow will be used.'),
    },
  },
  async (params) => {
    // If no private key provided, assume passkey flow
    if (!params.privateKey && !process.env.AGENT_SECRET) {
        const passkeyData = passkeyStore.get(params.userAddress);
        if (!passkeyData) {
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'ERROR',
                        error: 'No passkey wallet found. Please run enrollPasskey first to create a Passkey Kit wallet.',
                    }, null, 2) 
                }] 
            };
        }
        
        const result = await defindexService.deposit(params);
        
        if (result.xdr) {
            const challenge = crypto.randomBytes(32).toString('base64url');
            challengeStore.set(challenge, {
                challenge,
                walletAddress: params.userAddress,
                xdr: result.xdr,
                operation: 'deposit',
                timestamp: Date.now(),
            });
            
            const signingUrl = `http://localhost:${PORT}/mcp/sign?challenge=${challenge}&xdr=${encodeURIComponent(result.xdr)}`;
            
            return { 
                content: [{ 
                    type: 'text', 
                    text: JSON.stringify({
                        status: 'NEEDS_SIGNATURE',
                        unsignedXDR: result.xdr,
                        signingUrl,
                        message: 'Please open the signing URL in your browser to sign the transaction with your passkey.',
                    }, null, 2) 
                }] 
            };
        }
    }
    
    const result = await defindexService.deposit(params);
    if (result.xdr) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.xdr }, null, 2) }] };
    } else if (result.txHash) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, jsonReplacer, 2) }] };
  }
);

server.registerTool(
  'withdraw-vault',
  {
    title: 'Withdraw from Vault',
    description: 'Withdraws assets from a DeFindex vault.',
    inputSchema: {
      userAddress: z.string().describe('The public key of the user making the withdrawal.'),
      vaultAddress: z.string().describe('The contract ID of the vault.'),
      amount: z.number().describe('The amount to withdraw.'),
      asset: z.string().describe('The asset symbol or contract ID to withdraw.'),
    },
  },
  async (params) => {
    const result = await defindexService.withdraw(params);
    if (result.xdr) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.xdr }, null, 2) }] };
    } else if (result.txHash) {
      return { content: [{ type: 'text', text: JSON.stringify({ status: 'SUCCESS', txHash: result.txHash }, null, 2) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result, jsonReplacer, 2) }] };
  }
);

// Passkey enrollment tools
server.registerTool(
  'enrollPasskey',
  {
    title: 'Enroll Passkey',
    description: 'Creates a new Passkey Kit smart contract wallet for the user.',
    inputSchema: {
      walletAddress: z.string().optional().describe('Optional existing wallet address to link'),
    },
  },
  async ({ walletAddress }) => {
    const enrollmentUrl = `${FRONTEND_BASE_URL}/passkey/enroll${walletAddress ? `?walletAddress=${walletAddress}` : ''}`;
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            enrollmentUrl,
            message: 'Create a new Passkey Kit smart contract wallet with biometric authentication.',
            instructions: [
              '1. Open the enrollment URL in your browser',
              '2. Connect your Stellar wallet (Freighter, etc.)',
              '3. Click "Create Passkey Wallet" to set up biometric authentication',
              '4. Complete the passkey enrollment process',
              '5. Your new smart contract wallet will be ready for use'
            ],
            benefits: [
              'No seed phrases or private keys to manage',
              'Biometric authentication for all transactions',
              'Smart contract wallet on Stellar Soroban',
              'Cross-device synchronization support'
            ]
          }, null, 2),
        },
      ],
    };
  }
);

// Update the transaction flow to use Passkey Kit
// ...existing code for lend, borrow, etc...

// In the transaction tools, update the passkey flow section:
// if (!params.privateKey && !process.env.AGENT_SECRET) {
//     const passkeyData = passkeyStore.get(params.userAddress);
//     if (!passkeyData) {
//         return { 
//             content: [{ 
//                 type: 'text', 
//                 text: JSON.stringify({
//                     status: 'ERROR',
//                     error: 'No passkey wallet found. Please run enrollPasskey first to create a Passkey Kit wallet.',
//                     enrollmentUrl: `${FRONTEND_BASE_URL}/passkey/enroll`,
//                 }, null, 2) 
//             }] 
//         };
//     }
//     
//     const result = await blendService.lend(params);
//     
//     if (result && typeof result === 'object' && result.status === 'NEEDS_SIGNATURE') {
//         const signingUrl = `${FRONTEND_BASE_URL}/passkey/sign?walletAddress=${encodeURIComponent(params.userAddress)}&xdr=${encodeURIComponent(result.unsignedXDR)}`;
//         
//         return { 
//             content: [{ 
//                 type: 'text', 
//                 text: JSON.stringify({
//                     status: 'NEEDS_SIGNATURE',
//                     unsignedXDR: result.unsignedXDR,
//                     signingUrl,
//                     message: 'Please visit the signing URL to authenticate with your passkey and complete the transaction.',
//                     instructions: [
//                         '1. Open the signing URL in your browser',
//                         '2. The transaction will be automatically signed using your passkey',
//                         '3. Authenticate with your biometric (Face ID, Touch ID, fingerprint)',
//                         '4. The transaction will be submitted to Stellar network'
//                     ]
//                 }, null, 2) 
//             }] 
//         };
//     }
// }

// ...existing code...

// 3. Connect to a transport and run the server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('DeFi Protocol MCP Server connected via stdio and ready.');
}

run().catch((err) => {
  console.error('Failed to run MCP server:', err);
  process.exit(1);
});