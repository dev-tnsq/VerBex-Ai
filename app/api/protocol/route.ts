import { NextRequest, NextResponse } from 'next/server';
import { parseConversationalIntent, formatResultWithGemini } from '@/lib/gemini-intent';
import { BlendService } from '../../../Mcp/src/services/blend.service';
import { SoroswapService } from '../../../Mcp/src/services/soroswap.service';
import { DeFindexService } from '../../../Mcp/src/services/defindex.service';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Asset symbol to contract address mapping
const ASSET_ADDRESSES: Record<string, string> = {
  'XLM': 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  'XTAR': 'CDYZ6I4FTABFDVWIH2RSVDVIFSJF7FMA2CTUBFHWCLPSLIGO55K4HNSN',
  'USDC': 'CBBHRKEP5M3NUDRISGLJKGHDHX3DA2CN2AZBQY6WLVUJ7VNLGSKBDUCM',
  'XRP': 'CCPOB5HBFV2MGDFHR2QOFW3Y2JS7DQVJMWL7YESGSGH4AGQWVCJIPCKE',
  'ARST': 'CAVCOKZ5XZ5GONIP2M7QJARHZMELBVPZXVTZU5AJEJTOLNWAT5R43LPO',
  'AQUA': 'CCXQWO33QBEUDVTWDDOYLD2SYEJSWUM6DIJUX6NDAOSXNCGK3PSIWQJG',
  'EURC': 'CA34FYW2SL7VZW5E6WIPA2NOTLGG7TNAOKQLEO5YZHVUGNRFHM4HJ7WD',
  'BTC': 'CAD23PIPKXXRLZ54VKAW7IGOOM4FFW6WFZZM2XPD5VC6Q4BA3FN4F32F',
  'BRL': 'CCS2TOJEO7QIWJOM7C6PZ2AKLNDP2UJQIVKGUE6KFS5ULRCN6G7GHITY',
  'WUNP': 'CBSC4KEC3ZFSV33LLDUBISDIO6AWWOETQOFXFVUNESZJIL47N6SDFBQP',
  'WUNT': 'CC5BEKXQJRY7TUD5TBQT7UBOAXU7DKCKXR7BSPFO23OHFABNJCE27UZ4',
  'PYRZ': 'CA34VPNNRRVH5FMFVXWMQVEDMTOMLZESEZ5LE4724OSBHFB5HIRRHQ7G',
  'NYLF': 'CDHNUGDN5ODFN25ADDSDQIOJPQSHFLH3IBFEVMMPYNQKG5Y2UZ5MV4ZW',
};

// Helper function to convert asset symbols to addresses
function resolveAssetAddress(asset: string): string {
  // If it's already a contract address (starts with C and 56 chars), return as-is
  if (asset.startsWith('C') && asset.length === 56) {
    return asset;
  }
  // If it's a symbol, convert to address
  const address = ASSET_ADDRESSES[asset.toUpperCase()];
  if (address) {
    return address;
  }
  // If not found, return original (might be a valid address we don't know)
  return asset;
}

// Helper to check if a string is a contract address
function isContractAddress(str: string) {
  return typeof str === 'string' && str.length === 56 && str.startsWith('C');
}

export async function POST(req: NextRequest) {
  const { command, context, history, threadId } = await req.json();
  
  console.log('[Protocol API] Received request:', { command, context, threadId });

  // --- PRISMA USER UPSERT ---
  const userWallet = context?.wallet;
  if (userWallet) {
    await prisma.user.upsert({
      where: { id: userWallet },
      update: {},
      create: { id: userWallet },
    });
  }

  // --- PRISMA: CHAT THREAD MANAGEMENT ---
  
  // Handle new chat thread creation
  if (command === 'newChat' && userWallet) {
    const newThread = await prisma.chatThread.create({
      data: {
        userId: userWallet,
        title: 'New Chat',
      },
    });
    return NextResponse.json({ 
      success: true, 
      threadId: newThread.id,
      message: 'New chat thread created' 
    });
  }

  // Handle get all chat threads for user
  if (command === 'getChatThreads' && userWallet) {
    const threads = await prisma.chatThread.findMany({
      where: { userId: userWallet },
      orderBy: { createdAt: 'desc' },
      include: {
        chats: {
          orderBy: { timestamp: 'asc' },
          take: 1, // Get first message for preview
        },
      },
    });
    return NextResponse.json({ threads });
  }

  // Handle get chat history for specific thread
  if (command === 'getChatHistory' && userWallet && threadId) {
    const chatHistory = await prisma.chat.findMany({
      where: { 
        threadId: threadId,
        thread: { userId: userWallet } // Ensure user owns the thread
      },
      orderBy: { timestamp: 'asc' },
    });
    return NextResponse.json({ chatHistory });
  }

  // Handle delete chat thread
  if (command === 'deleteChatThread' && userWallet && threadId) {
    await prisma.chat.deleteMany({
      where: { 
        threadId: threadId,
        thread: { userId: userWallet }
      },
    });
    await prisma.chatThread.delete({
      where: { 
        id: threadId,
        userId: userWallet
      },
    });
    return NextResponse.json({ 
      success: true, 
      message: 'Chat thread deleted' 
    });
  }

  // --- PRISMA: STORE USER MESSAGE IN THREAD ---
  let currentThreadId = threadId;
  if (userWallet && command && command.trim() !== '' && !command.startsWith('get') && !command.startsWith('new') && !command.startsWith('delete')) {
    // If no threadId provided, create a new thread
    if (!currentThreadId) {
      const newThread = await prisma.chatThread.create({
        data: {
          userId: userWallet,
          title: command.substring(0, 50) + (command.length > 50 ? '...' : ''), // Use first 50 chars as title
        },
      });
      currentThreadId = newThread.id;
    }

    // Store user message
    await prisma.chat.create({
      data: {
        threadId: currentThreadId,
        message: command,
        role: 'user',
      },
    });
  }

  // 🤖 CONVERSATIONAL AI: Natural conversation with function calling
  const intent = await parseConversationalIntent(command, userWallet, history);

  // Gemini response log
  console.log('[Gemini Intent]', JSON.stringify(intent, null, 2));

  // Filter out empty intents (no operations and empty confirmation_text)
  const isEmptyIntent =
    (!intent.operations || intent.operations.length === 0) &&
    (!intent.confirmation_text || intent.confirmation_text.trim() === '');

  if (isEmptyIntent) {
    return NextResponse.json({
      error: 'No actionable intent. Please provide more details or try a different command.',
      intent,
    });
  }

  // --- Multi-step intent execution ---
  let results: any[] = [];
  let xdrs: string[] = [];
  let txHashes: string[] = [];
  let summaries: string[] = [];
  // Shared context for dynamic parameter chaining
  let dynamicContext: Record<string, any> = { ...context };

  if (intent.operations.length > 1) {
    for (const op of intent.operations) {
      let result: any = {};
      let xdr: string | null = null;
      let txHash: string | null = null;
      let summary: string | null = null;
      // --- Dynamic parameter filling from context/results ---
      let params = { ...op.parameters };
      // For each missing param, try to fill from dynamicContext
      for (const key of Object.keys(params)) {
        if ((params[key] === undefined || params[key] === null || params[key] === "") && dynamicContext[key] !== undefined) {
          params[key] = dynamicContext[key];
        }
      }
      // Also, for common keys (assetId, poolId, backstopId, assetIds, etc), fill if missing
      const commonKeys = ["assetId", "poolId", "backstopId", "assetIds", "tokenId", "contractId", "userAddress"];
      for (const key of commonKeys) {
        if (params[key] === undefined && dynamicContext[key] !== undefined) {
          params[key] = dynamicContext[key];
        }
      }
      if (op.protocol === 'Blend') {
        try {
          const blend = new BlendService();
          const blendActions: Record<string, (params: any) => Promise<any>> = {
            lend: (params: any) => { if (params.asset) params.asset = resolveAssetAddress(params.asset); return blend.lend(params); },
            withdraw: (params: any) => { if (params.asset) params.asset = resolveAssetAddress(params.asset); return blend.withdraw(params); },
            borrow: (params: any) => { if (params.asset) params.asset = resolveAssetAddress(params.asset); return blend.borrow(params); },
            repay: (params: any) => { if (params.asset) params.asset = resolveAssetAddress(params.asset); return blend.repay(params); },
            claimRewards: blend.claim.bind(blend),
            loadPoolData: ({ poolId, userAddress }) => blend.loadPoolMeta(poolId),
            getTokenBalance: ({ tokenId, userAddress }) => blend.getTokenBalance(resolveAssetAddress(tokenId), userAddress),
            getFeeStats: blend.getFeeStats.bind(blend),
            getPoolEvents: ({ poolId, version, startLedger }) => blend.getPoolEvents(poolId, version, startLedger),
            getAvailableBlendPools: blend.getAvailableBlendPools.bind(blend),
            loadTokenMetadata: ({ assetId }) => blend.loadTokenMetadata(resolveAssetAddress(assetId)),
            simulateOperation: ({ operationXdr, userAddress }) => blend.simulateOperation(operationXdr, userAddress),
            loadPool: async ({ poolId }) => { const meta = await blend.loadPoolMeta(poolId); return await blend.loadPool(poolId, meta); },
            loadPoolUser: async ({ poolId, userAddress }) => { const meta = await blend.loadPoolMeta(poolId); const pool = await blend.loadPool(poolId, meta); return await blend.loadPoolUser(pool, userAddress); },
            loadPoolOracle: async ({ poolId }) => { const meta = await blend.loadPoolMeta(poolId); const pool = await blend.loadPool(poolId, meta); return await blend.loadPoolOracle(pool); },
            loadBackstop: ({ version }) => blend.loadBackstop(version),
            loadBackstopPool: async ({ poolId, version }) => { const poolMeta = { id: poolId, version }; return await blend.loadBackstopPool(poolMeta); },
            loadBackstopPoolUser: async ({ poolId, version, userAddress }) => { const poolMeta = { id: poolId, version }; return await blend.loadBackstopPoolUser(poolMeta, userAddress); },
            createPool: blend.createPool.bind(blend),
            addReserve: blend.addReserve.bind(blend),
            buyNft: blend.buyNft.bind(blend),
          };
          const fn = blendActions[op.action];
          if (fn) {
            if (params.privateKey) delete params.privateKey;
            const blendResult = await fn(params);
            if (blendResult && blendResult.status === 'NEEDS_SIGNATURE') {
              xdr = blendResult.unsignedXDR;
              summary = blendResult.message;
            } else if (blendResult && blendResult.status === 'SUCCESS') {
              txHash = blendResult.txHash;
              summary = intent.confirmation_text;
            } else if (typeof blendResult === 'string' && blendResult.length > 40) {
              xdr = blendResult;
              summary = intent.confirmation_text;
            } else if (blendResult && typeof blendResult === 'object') {
              if (blendResult.xdr) xdr = blendResult.xdr;
              if (blendResult.txHash) txHash = blendResult.txHash;
              if (blendResult.summary) summary = blendResult.summary;
            }
            result = blendResult;
            // --- Update dynamic context with new keys from result ---
            if (result && typeof result === 'object') {
              for (const key of Object.keys(result)) {
                if (result[key] !== undefined && result[key] !== null) {
                  dynamicContext[key] = result[key];
                }
              }
            }
          } else {
            result = { error: `BlendService has no action '${op.action}'` };
          }
        } catch (e: any) {
          result = { error: e.message || 'Blend MCP error', stack: e.stack };
        }
      } else if (op.protocol === 'Soroswap') {
        try {
          const soroswap = new SoroswapService();
          // Only keep Soroswap actions and mappings for: swap, addLiquidity, removeLiquidity, getAvailableSoroswapPools, getUserLPPositions, getPrice, getAssetList.
          const soroswapActions: Record<string, (params: any) => Promise<any>> = {
            swap: (params: any) => { 
              if (params.fromAsset) params.fromAsset = resolveAssetAddress(params.fromAsset); 
              if (params.toAsset) params.toAsset = resolveAssetAddress(params.toAsset); 
              return soroswap.swap(params); 
            },
            addLiquidity: (params: any) => {
              if (params.tokenA) params.tokenA = resolveAssetAddress(params.tokenA);
              if (params.tokenB) params.tokenB = resolveAssetAddress(params.tokenB);
              return soroswap.addLiquidity(params);
            },
            removeLiquidity: soroswap.removeLiquidity.bind(soroswap),
            getAvailableSoroswapPools: soroswap.getAvailableSoroswapPools.bind(soroswap),
            getUserLPPositions: soroswap.getUserLPPositions.bind(soroswap),
            getPrice: (params: any) => {
              if (params.asset) params.asset = resolveAssetAddress(params.asset);
              return soroswap.getPrice(params);
            },
            getAssetList: soroswap.getAssetList.bind(soroswap),
            getUserTokenBalances: (params: any) => soroswap.getUserTokenBalances(params.userAddress),
          };
          const fn = soroswapActions[op.action];
          if (fn) {
            const soroswapResult = await fn(params);
            if (soroswapResult && soroswapResult.xdr) xdr = soroswapResult.xdr;
            if (soroswapResult && soroswapResult.txHash) txHash = soroswapResult.txHash;
            if (soroswapResult && soroswapResult.summary) summary = soroswapResult.summary;
            result = soroswapResult;
            // --- Update dynamic context with new keys from result ---
            if (result && typeof result === 'object') {
              for (const key of Object.keys(result)) {
                if (result[key] !== undefined && result[key] !== null) {
                  dynamicContext[key] = result[key];
                }
              }
            }
          } else {
            result = { error: `SoroswapService has no action '${op.action}'` };
          }
        } catch (e: any) {
          result = { error: e.message || 'Soroswap error', stack: e.stack };
        }
      } else if (op.protocol === 'DeFindex') {
        // Fallback logic for createVault
        if (op.action === 'createVault') {
          const XLM_STRATEGY = 'CBO77JLVAT54YBRHBY4PSITLILWAAXX5JHPXGBFRW2XUFQKXZ3ZLJ7MJ';
          const USDC_STRATEGY = 'CA57GWLEGS2N5GLSKHQGAA4LKVKFL3MROF2SPFY6CVNDYWH3BUU5VKK7';
          let { asset, strategyId, vaultName } = params;
          if (!asset && strategyId) {
            if (strategyId === XLM_STRATEGY) params.asset = 'XLM';
            if (strategyId === USDC_STRATEGY) params.asset = 'USDC';
          }
          if (params.asset) {
            const upper = params.asset.toUpperCase();
            if ((upper === 'XLM' || upper === ASSET_ADDRESSES.XLM) && (!strategyId || !isContractAddress(strategyId))) {
              params.strategyId = XLM_STRATEGY;
            }
            if ((upper === 'USDC' || upper === ASSET_ADDRESSES.USDC) && (!strategyId || !isContractAddress(strategyId))) {
              params.strategyId = USDC_STRATEGY;
            }
            params.asset = ASSET_ADDRESSES[upper] || params.asset;
          }
          if (!params.vaultName && params.asset) {
            params.vaultName = `${params.asset} Vault`;
          }
        }
        try {
          const defindex = new DeFindexService();
          const defindexActions: Record<string, (params: any) => Promise<any>> = {
            // Vault operations
            deposit: (params: any) => {
              if (params.asset) params.asset = resolveAssetAddress(params.asset);
              return defindex.deposit(params);
            },
            withdraw: (params: any) => {
              if (params.asset) params.asset = resolveAssetAddress(params.asset);
              return defindex.withdraw(params);
            },
            createVault: defindex.createVault.bind(defindex),
            
            // Query operations
            getBalance: defindex.getBalance.bind(defindex),
            getAvailableVaults: defindex.getAvailableVaults.bind(defindex),
            getAvailableStrategies: defindex.getAvailableStrategies.bind(defindex),
            getUserPositions: defindex.getUserPositions.bind(defindex),
            getVaultAnalytics: defindex.getVaultAnalytics.bind(defindex),
            getYieldOpportunities: defindex.getYieldOpportunities.bind(defindex),
            
            // Transaction operations
            sendTransaction: defindex.sendTransaction.bind(defindex),
          };
          const fn = defindexActions[op.action];
          if (fn) {
            const defindexResult = await fn(params);
            if (defindexResult && defindexResult.xdr) xdr = defindexResult.xdr;
            if (defindexResult && defindexResult.txHash) txHash = defindexResult.txHash;
            if (defindexResult && defindexResult.summary) summary = defindexResult.summary;
            result = defindexResult;
            // --- Update dynamic context with new keys from result ---
            if (result && typeof result === 'object') {
              for (const key of Object.keys(result)) {
                if (result[key] !== undefined && result[key] !== null) {
                  dynamicContext[key] = result[key];
                }
              }
            }
          } else {
            result = { error: `DeFindexService has no action '${op.action}'` };
          }
        } catch (e: any) {
          result = { error: e.message || 'DeFindex error', stack: e.stack };
        }
      } else {
        result = { status: 'Unsupported protocol', op };
      }
      results.push(result);
      if (xdr) xdrs.push(xdr);
      if (txHash) txHashes.push(txHash);
      if (summary) summaries.push(summary);
    }
    // Optionally, format the full results array with Gemini if no XDRs
    let finalSummary = null;
    if (xdrs.length === 0 && results.length > 0) {
      finalSummary = await formatResultWithGemini(command, results, userWallet);
    }
    
    // --- PRISMA: STORE ASSISTANT RESPONSE IN THREAD ---
    if (userWallet && currentThreadId && finalSummary) {
      await prisma.chat.create({
        data: {
          threadId: currentThreadId,
          message: finalSummary,
          role: 'assistant',
        },
      });
    }
    
    return NextResponse.json({
      intent,
      results,
      xdrs: xdrs.length > 0 ? xdrs : undefined,
      txHashes: txHashes.length > 0 ? txHashes : undefined,
      summaries: summaries.length > 0 ? summaries : undefined,
      summary: finalSummary,
      threadId: currentThreadId,
    });
  }

  // --- Single-operation fallback (legacy, for compatibility) ---
  let result: any = {};
  let xdr: string | null = null;
  let txHash: string | null = null;
  let summary: string | null = null;

  if (intent.operations.length > 0) {
    const op = intent.operations[0];
    if (op.protocol === 'Blend') {
      try {
        const blend = new BlendService();
        // Map Gemini action name to BlendService method
        const blendActions: Record<string, (params: any) => Promise<any>> = {
          lend: (params: any) => {
            console.log('[Asset Resolution] Original params:', params);
            if (params.asset) {
              const originalAsset = params.asset;
              params.asset = resolveAssetAddress(params.asset);
              console.log('[Asset Resolution] Converted:', originalAsset, '→', params.asset);
            }
            return blend.lend(params);
          },
          withdraw: (params: any) => {
            if (params.asset) params.asset = resolveAssetAddress(params.asset);
            return blend.withdraw(params);
          },
          borrow: (params: any) => {
            if (params.asset) params.asset = resolveAssetAddress(params.asset);
            return blend.borrow(params);
          },
          repay: (params: any) => {
            if (params.asset) params.asset = resolveAssetAddress(params.asset);
            return blend.repay(params);
          },
          claimRewards: blend.claim.bind(blend),
          loadPoolData: ({ poolId, userAddress }) => blend.loadPoolMeta(poolId),
          getTokenBalance: ({ tokenId, userAddress }) => blend.getTokenBalance(resolveAssetAddress(tokenId), userAddress),
          getFeeStats: blend.getFeeStats.bind(blend),
          getPoolEvents: ({ poolId, version, startLedger }) => blend.getPoolEvents(poolId, version, startLedger),
          getAvailableBlendPools: blend.getAvailableBlendPools.bind(blend),
          loadTokenMetadata: ({ assetId }) => blend.loadTokenMetadata(resolveAssetAddress(assetId)),
          simulateOperation: ({ operationXdr, userAddress }) => blend.simulateOperation(operationXdr, userAddress),
          // Complex functions with dependency handling
          loadPool: async ({ poolId }) => {
            const meta = await blend.loadPoolMeta(poolId);
            return await blend.loadPool(poolId, meta);
          },
          loadPoolUser: async ({ poolId, userAddress }) => {
            const meta = await blend.loadPoolMeta(poolId);
            const pool = await blend.loadPool(poolId, meta);
            return await blend.loadPoolUser(pool, userAddress);
          },
          loadPoolOracle: async ({ poolId }) => {
            const meta = await blend.loadPoolMeta(poolId);
            const pool = await blend.loadPool(poolId, meta);
            return await blend.loadPoolOracle(pool);
          },
          // Backstop functions
          loadBackstop: ({ version }) => blend.loadBackstop(version),
          loadBackstopPool: async ({ poolId, version }) => {
            const poolMeta = { id: poolId, version };
            return await blend.loadBackstopPool(poolMeta);
          },
          loadBackstopPoolUser: async ({ poolId, version, userAddress }) => {
            const poolMeta = { id: poolId, version };
            return await blend.loadBackstopPoolUser(poolMeta, userAddress);
          },
          // Admin functions
          createPool: blend.createPool.bind(blend),
          addReserve: blend.addReserve.bind(blend),
          buyNft: blend.buyNft.bind(blend),
        };
        const fn = blendActions[op.action];
        if (fn) {
          if (op.parameters.privateKey) delete op.parameters.privateKey;
          const blendResult = await fn(op.parameters);
          // Blend MCP response log
          console.log('[Blend MCP Result]', JSON.stringify(blendResult, null, 2));
          if (blendResult && blendResult.status === 'NEEDS_SIGNATURE') {
            xdr = blendResult.unsignedXDR;
            summary = blendResult.message;
          } else if (blendResult && blendResult.status === 'SUCCESS') {
            txHash = blendResult.txHash;
            summary = intent.confirmation_text;
          } else if (typeof blendResult === 'string' && blendResult.length > 40) {
            xdr = blendResult;
            summary = intent.confirmation_text;
          } else if (blendResult && typeof blendResult === 'object') {
            if (blendResult.xdr) xdr = blendResult.xdr;
            if (blendResult.txHash) txHash = blendResult.txHash;
            if (blendResult.summary) summary = blendResult.summary;
          }
          result = blendResult;
          
          // 🤖 GEMINI FORMATS RESULTS: For query operations (no XDR), send back to Gemini to format
          if (!xdr && result && intent.operations?.length > 0) {
            console.log('[Sending result to Gemini for formatting]');
            const formattedResponse = await formatResultWithGemini(command, result, userWallet);
            intent.confirmation_text = formattedResponse;
          }
          
        } else {
          result = { error: `BlendService has no action '${op.action}'` };
        }
      } catch (e: any) {
        result = { error: e.message || 'Blend MCP error', stack: e.stack };
      }
    } 
    // --- DeFindex Integration ---
    else if (op.protocol === 'DeFindex') {
      try {
        const defindex = new DeFindexService();
        // Map Gemini action name to DeFindexService method
        const defindexActions: Record<string, (params: any) => Promise<any>> = {
          // Vault operations
          deposit: (params: any) => {
            if (params.asset) params.asset = resolveAssetAddress(params.asset);
            return defindex.deposit(params);
          },
          withdraw: (params: any) => {
            if (params.asset) params.asset = resolveAssetAddress(params.asset);
            return defindex.withdraw(params);
          },
          createVault: defindex.createVault.bind(defindex),
          
          // Query operations
          getBalance: defindex.getBalance.bind(defindex),
          getAvailableVaults: defindex.getAvailableVaults.bind(defindex),
          getAvailableStrategies: defindex.getAvailableStrategies.bind(defindex),
          getUserPositions: defindex.getUserPositions.bind(defindex),
          getVaultAnalytics: defindex.getVaultAnalytics.bind(defindex),
          getYieldOpportunities: defindex.getYieldOpportunities.bind(defindex),
          
          // Transaction operations
          sendTransaction: defindex.sendTransaction.bind(defindex),
        };
        console.log('[Protocol API] DeFindex action requested:', op.action, op.parameters);
        const fn = defindexActions[op.action];
        if (fn) {
          console.log('[Protocol API] About to call DeFindex function:', op.action, op.parameters);
          const defindexResult = await fn(op.parameters);
          console.log('[Protocol API] DeFindex function result:', defindexResult);
          result = defindexResult;
          if (defindexResult && defindexResult.xdr) xdr = defindexResult.xdr;
          if (defindexResult && defindexResult.txHash) txHash = defindexResult.txHash;
          if (defindexResult && defindexResult.summary) summary = defindexResult.summary;
          // Always format the result for the user using Gemini
          if (result && intent.operations?.length > 0) {
            const formattedResponse = await formatResultWithGemini(command, result, userWallet);
            intent.confirmation_text = formattedResponse;
          }
        } else {
          console.error('[Protocol API] DeFindex action not found in mapping:', op.action);
          result = { error: `DeFindexService has no action '${op.action}'` };
        }
      } catch (e: any) {
        result = { error: e.message || 'DeFindex error', stack: e.stack };
      }
    }
    // --- Soroswap Integration ---
    else if (op.protocol === 'Soroswap') {
      try {
        const soroswap = new SoroswapService();
        // Map Gemini action name to SoroswapService method
        const soroswapActions: Record<string, (params: any) => Promise<any>> = {
          // Trading Operations
          swap: (params: any) => {
            if (params.fromAsset) params.fromAsset = resolveAssetAddress(params.fromAsset);
            if (params.toAsset) params.toAsset = resolveAssetAddress(params.toAsset);
            return soroswap.swap(params);
          },
          addLiquidity: (params: any) => {
            if (params.tokenA) params.tokenA = resolveAssetAddress(params.tokenA);
            if (params.tokenB) params.tokenB = resolveAssetAddress(params.tokenB);
            return soroswap.addLiquidity(params);
          },
          removeLiquidity: soroswap.removeLiquidity.bind(soroswap),
          getAvailableSoroswapPools: soroswap.getAvailableSoroswapPools.bind(soroswap),
          getUserLPPositions: soroswap.getUserLPPositions.bind(soroswap),
          getPrice: (params: any) => {
            if (params.asset) params.asset = resolveAssetAddress(params.asset);
            return soroswap.getPrice(params);
          },
          getAssetList: soroswap.getAssetList.bind(soroswap),
          getUserTokenBalances: (params: any) => soroswap.getUserTokenBalances(params.userAddress),
        };
        console.log('[Protocol API] Soroswap action requested:', op.action, op.parameters);
        const fn = soroswapActions[op.action];
        if (fn) {
          console.log('[Protocol API] About to call Soroswap function:', op.action, op.parameters);
          const soroswapResult = await fn(op.parameters);
          console.log('[Protocol API] Soroswap function result:', soroswapResult);
          result = soroswapResult;
          if (soroswapResult && soroswapResult.xdr) xdr = soroswapResult.xdr;
          if (soroswapResult && soroswapResult.txHash) txHash = soroswapResult.txHash;
          if (soroswapResult && soroswapResult.summary) summary = soroswapResult.summary;
          // Always format the result for the user using Gemini
          if (result && intent.operations?.length > 0) {
            const formattedResponse = await formatResultWithGemini(command, result, userWallet);
            intent.confirmation_text = formattedResponse;
          }
        } else {
          console.error('[Protocol API] Soroswap action not found in mapping:', op.action);
          result = { error: `SoroswapService has no action '${op.action}'` };
        }
      } catch (e: any) {
        result = { error: e.message || 'Soroswap error', stack: e.stack };
      }
    }
    else {
      result = { status: 'Unsupported protocol', op };
    }
  } else {
    result = { status: 'No actionable intent', intent };
  }

  // --- PRISMA: STORE ASSISTANT RESPONSE IN THREAD ---
  if (userWallet && currentThreadId && intent.confirmation_text) {
    await prisma.chat.create({
      data: {
        threadId: currentThreadId,
        message: intent.confirmation_text,
        role: 'assistant',
      },
    });
  }

  return NextResponse.json({
    intent,
    result,
    xdr,
    txHash,
    summary,
    threadId: currentThreadId,
  });
} 