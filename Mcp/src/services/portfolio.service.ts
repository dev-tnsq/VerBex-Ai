import { SoroswapService } from './soroswap.service.js';
import { DeFindexService } from './defindex.service.js';
import { BlendService } from './blend.service.js';

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
export class UnifiedPortfolioService {
  private soroswap: SoroswapService;
  private defindex: DeFindexService;
  private blend: BlendService;

  constructor() {
    console.log('[UnifiedPortfolioService] Initializing UnifiedPortfolioService...');
    this.soroswap = new SoroswapService();
    this.defindex = new DeFindexService();
    this.blend = new BlendService();
    console.log('[UnifiedPortfolioService] Service initialized with SoroswapService, DeFindexService, and BlendService');
  }

  /**
   * Get a comprehensive portfolio overview for a user across all protocols.
   * Includes Soroswap LP positions, DeFindex vaults, Blend positions, and token balances.
   * @param userAddress The user's Stellar wallet address
   */
  async getUnifiedPortfolioOverview(userAddress: string) {
    console.log('[UnifiedPortfolioService] getUnifiedPortfolioOverview called for:', userAddress);
    
    // 1. Get DeFindex positions
    console.log('[UnifiedPortfolioService] Fetching DeFindex positions...');
    const defindexRes = await this.defindex.getUserPositions({ userAddress });
    const defindexPositions = defindexRes.status === 'OK' ? defindexRes.positions : [];
    console.log('[UnifiedPortfolioService] Retrieved DeFindex positions:', defindexPositions.length);
    
    if (defindexRes.status !== 'OK') {
      console.warn('[UnifiedPortfolioService] DeFindex getUserPositions failed:', defindexRes.message);
    }
    
    // 2. Get Blend positions
    console.log('[UnifiedPortfolioService] Fetching Blend positions...');
    let blendPositions: any[] = [];
    try {
      const blendRes = await this.blend.getUserPositions({ userAddress });
      blendPositions = blendRes.status === 'OK' ? blendRes.positions : [];
      console.log('[UnifiedPortfolioService] Retrieved Blend positions:', blendPositions.length);
      
      if (blendRes.status !== 'OK') {
        console.warn('[UnifiedPortfolioService] Blend getUserPositions failed:', blendRes.message);
      }
    } catch (e) {
      console.error('[UnifiedPortfolioService] Error fetching Blend positions:', e);
      blendPositions = [];
    }

    // 3. Get Soroswap positions
    console.log('[UnifiedPortfolioService] Fetching Soroswap portfolio...');
    const soroswapOverview = await this.getSoroswapPortfolioOverview(userAddress);
    console.log('[UnifiedPortfolioService] Retrieved Soroswap portfolio:', {
      assetCount: soroswapOverview.assets.length,
      lpCount: soroswapOverview.lps.length,
      totalValue: soroswapOverview.totalValue
    });
    
    // 4. Calculate total values across all protocols
    console.log('[UnifiedPortfolioService] Calculating total portfolio values...');
    const defindexValue = defindexPositions.reduce((sum: number, pos: any) => sum + (pos.balance || 0), 0);
    const blendValue = blendPositions.reduce((sum: number, pos: any) => sum + (pos.totalValue || 0), 0);
    const soroswapValue = soroswapOverview.totalValue;
    
    const totalPortfolioValue = defindexValue + blendValue + soroswapValue;
    console.log('[UnifiedPortfolioService] Portfolio value breakdown:', {
      defindexValue,
      blendValue,
      soroswapValue,
      totalPortfolioValue
    });
    
    // 5. Create unified portfolio structure with assets and lps at top level
    console.log('[UnifiedPortfolioService] Building unified portfolio structure...');
    const portfolio = {
      totalValue: totalPortfolioValue,
      totalAssetValue: soroswapOverview.totalAssetValue,
      totalLPValue: soroswapOverview.totalLPValue,
      assets: soroswapOverview.assets,
      lps: soroswapOverview.lps,
      protocols: {
        defindex: {
          value: defindexValue,
          percentage: totalPortfolioValue > 0 ? (defindexValue / totalPortfolioValue) * 100 : 0,
          positions: defindexPositions,
          count: defindexPositions.length
        },
        blend: {
          value: blendValue,
          percentage: totalPortfolioValue > 0 ? (blendValue / totalPortfolioValue) * 100 : 0,
          positions: blendPositions,
          count: blendPositions.length
        },
        soroswap: {
          value: soroswapValue,
          percentage: totalPortfolioValue > 0 ? (soroswapValue / totalPortfolioValue) * 100 : 0,
          assets: soroswapOverview.assets,
          lps: soroswapOverview.lps,
          assetCount: soroswapOverview.assets.length,
          lpCount: soroswapOverview.lps.length
        }
      },
      diversification: {
        protocolCount: [defindexPositions.length > 0, blendPositions.length > 0, soroswapOverview.assets.length > 0 || soroswapOverview.lps.length > 0].filter(Boolean).length,
        totalPositions: defindexPositions.length + blendPositions.length + soroswapOverview.assets.length + soroswapOverview.lps.length,
        riskDistribution: this.calculateRiskDistribution(defindexPositions, blendPositions, soroswapOverview)
      }
    };
    
    console.log('[UnifiedPortfolioService] Portfolio overview generated successfully with:', {
      protocols: Object.keys(portfolio.protocols),
      defindexCount: portfolio.protocols.defindex.count,
      blendCount: portfolio.protocols.blend.count,
      soroswapAssetsCount: portfolio.protocols.soroswap.assetCount,
      soroswapLPCount: portfolio.protocols.soroswap.lpCount,
      totalPositions: portfolio.diversification.totalPositions,
      protocolCount: portfolio.diversification.protocolCount
    });
    
    return portfolio;
  }

  /**
   * Get a Soroswap-specific portfolio overview for a user.
   * Aggregates token balances, LP positions, and calculates USD values.
   * @param userAddress The user's Stellar wallet address
   */
  async getSoroswapPortfolioOverview(userAddress: string) {
    console.log('[UnifiedPortfolioService] getSoroswapPortfolioOverview called for:', userAddress);
    
    // 1. Get all LP positions (includes underlying tokens and USD value)
    console.log('[UnifiedPortfolioService] Fetching Soroswap LP positions...');
    const lpRes = await this.soroswap.getUserLPPositions({ userAddress });
    const lpPositions = lpRes.status === 'OK' ? lpRes.positions : [];
    console.log(`[UnifiedPortfolioService] Retrieved ${lpPositions.length} Soroswap LP positions`);
    
    if (lpRes.status !== 'OK') {
      console.warn('[UnifiedPortfolioService] Soroswap getUserLPPositions failed:', lpRes.message);
    }

    // 2. Get all Soroswap testnet token balances using the new method
    console.log('[UnifiedPortfolioService] Fetching Soroswap token balances...');
    const tokenBalances = await this.soroswap.getUserTokenBalances(userAddress);
    console.log(`[UnifiedPortfolioService] Retrieved ${tokenBalances.length} token balances`);

    // 3. Fetch current prices for all assets in the portfolio
    const assetSymbols = [
      ...new Set([
        ...lpPositions.flatMap((p: any) => [p.tokenA, p.tokenB]),
        ...tokenBalances.map((t: any) => t.code),
      ]),
    ];
    console.log(`[UnifiedPortfolioService] Fetching prices for ${assetSymbols.length} unique assets:`, assetSymbols);
    
    const prices: Record<string, number> = {};
    for (const symbol of assetSymbols) {
      try {
        console.log(`[UnifiedPortfolioService] Fetching price for ${symbol}...`);
        const priceRes = await this.soroswap.getPrice({ asset: ASSET_ADDRESSES[symbol], referenceCurrency: 'USD' });
        if (priceRes.status === 'OK' && priceRes.prices && priceRes.prices[symbol]) {
          prices[symbol] = priceRes.prices[symbol];
          console.log(`[UnifiedPortfolioService] Price for ${symbol}: $${prices[symbol]}`);
        } else {
          console.warn(`[UnifiedPortfolioService] Could not get price for ${symbol}:`, priceRes);
        }
      } catch (e) {
        console.error(`[UnifiedPortfolioService] Error fetching price for ${symbol}:`, e);
        // skip asset if price fetch fails
      }
    }

    // 4. Calculate total USD value for each asset and LP position
    console.log('[UnifiedPortfolioService] Calculating asset values...');
    const assets = tokenBalances.map((t: any) => ({
      symbol: t.code,
      balance: t.balance,
      usdValue: prices[t.code] ? Number(t.balance) * prices[t.code] : null,
      contract: t.contract,
      decimals: t.decimals,
    }));
    
    console.log('[UnifiedPortfolioService] Calculating LP values...');
    const lps = lpPositions.map((p: any) => ({
      pool: `${p.tokenA}/${p.tokenB}`,
      lpAmount: p.lpAmount,
      tokenAAmount: p.tokenAAmount,
      tokenBAmount: p.tokenBAmount,
      valueUSD: p.valueUSD,
    }));

    // 5. Aggregate total portfolio value
    console.log('[UnifiedPortfolioService] Calculating total portfolio value...');
    const totalAssetValue = assets.reduce((sum: number, a: any) => sum + (a.usdValue || 0), 0);
    const totalLPValue = lps.reduce((sum: number, lp: any) => sum + (lp.valueUSD || 0), 0);
    const totalValue = totalAssetValue + totalLPValue;
    
    console.log('[UnifiedPortfolioService] Soroswap portfolio summary:', {
      assets: assets.length,
      lps: lps.length,
      totalAssetValue,
      totalLPValue,
      totalValue
    });

    return {
      assets,
      lps,
      totalAssetValue,
      totalLPValue,
      totalValue,
    };
  }

  /**
   * Analyze yield for each Soroswap LP position for a user, with recommendations and historical trends.
   * Returns an array of { pool, tokenA, tokenB, lpAmount, valueUSD, apy, recommendation, historicalApy }
   */
  async yieldAnalysis(userAddress: string) {
    console.log('[UnifiedPortfolioService] yieldAnalysis called for:', userAddress);
    
    // 1. Get all LP positions
    console.log('[UnifiedPortfolioService] Fetching LP positions...');
    const lpRes = await this.soroswap.getUserLPPositions({ userAddress });
    const lpPositions = lpRes.status === 'OK' ? lpRes.positions : [];
    console.log(`[UnifiedPortfolioService] Retrieved ${lpPositions.length} LP positions`);
    
    if (lpRes.status !== 'OK') {
      console.warn('[UnifiedPortfolioService] LP positions fetch failed:', lpRes.message);
    }

    // 2. Get all available pools (to look up APY/yield)
    console.log('[UnifiedPortfolioService] Fetching available Soroswap pools...');
    const poolsRes = await this.soroswap.getAvailableSoroswapPools();
    const pools = poolsRes.status === 'OK' ? poolsRes.pools : [];
    console.log(`[UnifiedPortfolioService] Retrieved ${pools.length} Soroswap pools`);
    
    if (poolsRes.status !== 'OK') {
      console.warn('[UnifiedPortfolioService] Available pools fetch failed:', poolsRes.message);
    }

    // 3. For each LP, find the matching pool and get APY/yield using decoded events
    console.log('[UnifiedPortfolioService] Analyzing yields for each LP position...');
    const yieldSummary = await Promise.all(lpPositions.map(async (lp: any, index: number) => {
      console.log(`[UnifiedPortfolioService] Analyzing position ${index + 1}/${lpPositions.length}: ${lp.tokenA}/${lp.tokenB}`);
      
      const pool = pools.find((p: any) =>
        (p.tokenA === lp.tokenA && p.tokenB === lp.tokenB) ||
        (p.tokenA === lp.tokenB && p.tokenB === lp.tokenA)
      );
      
      let poolId = pool && pool.address ? pool.address : null;
      if (!poolId) {
        console.warn(`[UnifiedPortfolioService] No matching pool found for ${lp.tokenA}/${lp.tokenB}`);
      }
      
      let historicalApy: number[] = [];
      let trend = 'stable';
      
      if (poolId) {
        try {
          // Fetch decoded events for the pool
          console.log(`[UnifiedPortfolioService] Fetching events for pool ${poolId}...`);
          const events = await this.soroswap.getDecodedPoolEvents(poolId, 0, 1000);
          console.log(`[UnifiedPortfolioService] Retrieved ${events.length} events for pool ${poolId}`);
          
          // Parse swap events by day
          console.log(`[UnifiedPortfolioService] Parsing events for daily APY calculations...`);
          const dayBuckets: Record<string, { fees: number, tvl: number[] }> = {};
          for (const ev of events) {
            const ts = ev.ledgerCloseTime ? new Date(ev.ledgerCloseTime * 1000) : new Date();
            const day = ts.toISOString().slice(0, 10);
            if (ev.eventType === 'swap') {
              let fee = 0;
              let tvl = 0;
              if (ev.value && typeof ev.value === 'object') {
                if (ev.value.fee) fee = Number(ev.value.fee);
                if (ev.value.tvl) tvl = Number(ev.value.tvl);
              }
              if (!dayBuckets[day]) dayBuckets[day] = { fees: 0, tvl: [] };
              dayBuckets[day].fees += fee;
              if (tvl > 0) dayBuckets[day].tvl.push(tvl);
            }
          }
          // Compute daily APY for last 7 days
          const days = Object.keys(dayBuckets).sort();
          for (let i = Math.max(0, days.length - 7); i < days.length; i++) {
            const d = days[i];
            const { fees, tvl } = dayBuckets[d];
            const avgTvl = tvl.length ? tvl.reduce((a, b) => a + b, 0) / tvl.length : 0;
            let apy = 0;
            if (avgTvl > 0) apy = (fees / avgTvl) * 365 * 100;
            historicalApy.push(Number(apy.toFixed(2)));
          }
          if (historicalApy.length >= 2) {
            if (historicalApy[historicalApy.length - 1] > historicalApy[historicalApy.length - 2]) trend = 'up';
            else if (historicalApy[historicalApy.length - 1] < historicalApy[historicalApy.length - 2]) trend = 'down';
          }
        } catch (e) {
          // fallback to previous logic if event fetch/parse fails
          historicalApy = pool && pool.historicalApy
            ? pool.historicalApy
            : [pool && pool.apy ? pool.apy - 1 : 0, pool && pool.apy ? pool.apy : 0];
        }
      } else {
        // fallback if no poolId
        historicalApy = pool && pool.historicalApy
          ? pool.historicalApy
          : [pool && pool.apy ? pool.apy - 1 : 0, pool && pool.apy ? pool.apy : 0];
      }
      // --- Recommendation logic ---
      let bestPool = null;
      let bestApy = pool && pool.apy !== undefined ? pool.apy : 0;
      for (const p of pools) {
        if ((p.tokenA === lp.tokenA || p.tokenB === lp.tokenA || p.tokenA === lp.tokenB || p.tokenB === lp.tokenB) && p.apy !== undefined && p.apy > bestApy) {
          bestApy = p.apy;
          bestPool = p;
        }
      }
      let recommendation = null;
      if (bestPool && bestApy > (pool && pool.apy !== undefined ? pool.apy : 0)) {
        recommendation = `Consider moving to pool ${bestPool.tokenA}/${bestPool.tokenB} for a higher APY of ${bestApy}%`;
      }
      return {
        pool: `${lp.tokenA}/${lp.tokenB}`,
        tokenA: lp.tokenA,
        tokenB: lp.tokenB,
        lpAmount: lp.lpAmount,
        valueUSD: lp.valueUSD,
        apy: pool && pool.apy !== undefined ? pool.apy : 'N/A',
        recommendation,
        historicalApy,
        trend,
      };
    }));

    return yieldSummary;
  }

  /**
   * Deep analytics: allocation by asset, LP vs. tokens, concentration, diversification, PnL, and performance over time.
   * Uses decoded pool events for real PnL and historical value.
   */
  async analyzePortfolio(userAddress: string) {
    const overview = await this.getUnifiedPortfolioOverview(userAddress);
    // Allocation by asset
    const assetAlloc = overview.assets.map((a:any) => ({
      symbol: a.symbol,
      usdValue: a.usdValue || 0,
      percent: overview.totalValue > 0 ? ((a.usdValue || 0) / overview.totalValue) * 100 : 0
    }));
    // LP vs. tokens
    const lpPercent = overview.totalValue > 0 ? (overview.totalLPValue / overview.totalValue) * 100 : 0;
    const tokenPercent = 100 - lpPercent;
    // Concentration (largest asset %)
    const maxAsset = assetAlloc.reduce((max:any, a:any) => a.percent > max.percent ? a : max, { percent: 0 });
    // Diversification (Herfindahl-Hirschman Index)
    const hhi = assetAlloc.reduce((sum:any, a:any) => sum + Math.pow(a.percent / 100, 2), 0);
    // --- Deep PnL and historical value using decoded events ---
    let pnl: any = 'PnL calculation requires transaction history';
    let performance: any = 'Performance over time requires historical data';
    try {
      // For each LP, fetch decoded events and reconstruct entry/exit, swaps, and value
      const poolsRes = await this.soroswap.getAvailableSoroswapPools();
      const pools = poolsRes.status === 'OK' ? poolsRes.pools : [];
      let totalRealizedPnL = 0;
      let timeSeries: Record<string, number> = {};
      for (const lp of overview.lps) {
        const pool = pools.find((p: any) => `${p.tokenA}/${p.tokenB}` === lp.pool);
        if (pool && pool.address) {
          const events = await this.soroswap.getDecodedPoolEvents(pool.address, 0, 1000, userAddress);
          // Track adds/removes, swaps, and value over time
          let entryValue = 0;
          let exitValue = 0;
          let lastValue = 0;
          let lastDay = '';
          for (const ev of events) {
            const ts = ev.ledgerCloseTime ? new Date(ev.ledgerCloseTime * 1000) : new Date();
            const day = ts.toISOString().slice(0, 10);
            if (ev.eventType === 'add_liquidity') {
              entryValue += ev.value && ev.value.amount ? Number(ev.value.amount) : 0;
            }
            if (ev.eventType === 'remove_liquidity') {
              exitValue += ev.value && ev.value.amount ? Number(ev.value.amount) : 0;
            }
            // Track value by day
            if (ev.value && ev.value.amount) {
              lastValue = Number(ev.value.amount);
              lastDay = day;
              timeSeries[day] = lastValue;
            }
          }
          // Realized PnL = exit - entry
          totalRealizedPnL += exitValue - entryValue;
        }
      }
      pnl = totalRealizedPnL;
      performance = timeSeries;
    } catch (e) {
      // fallback to stub if event fetch/parse fails
    }
    return {
      totalValue: overview.totalValue,
      assetAllocation: assetAlloc,
      lpPercent,
      tokenPercent,
      concentration: maxAsset,
      diversificationIndex: hhi,
      pnl,
      performance,
    };
  }

  /**
   * Suggest swaps/add/removes to reach a target allocation, minimizing slippage and fees.
   * targetAlloc: { symbol: percent, ... }
   *
   * Upgraded: Actually builds and returns Soroswap XDRs for each required swap action.
   */
  async suggestRebalance(userAddress: string, targetAlloc: Record<string, number>) {
    const overview = await this.getUnifiedPortfolioOverview(userAddress);
    const currentAlloc: Record<string, number> = {};
    for (const a of overview.assets) {
      currentAlloc[a.symbol] = overview.totalValue > 0 ? ((a.usdValue || 0) / overview.totalValue) * 100 : 0;
    }
    // Calculate difference from target
    const actions: any[] = [];
    for (const symbol in targetAlloc) {
      const target = targetAlloc[symbol];
      const current = currentAlloc[symbol] || 0;
      if (current < target - 1) {
        // Need to buy more
        actions.push({
          action: 'buy',
          symbol,
          amountUSD: ((target - current) / 100) * overview.totalValue,
          reason: `Increase ${symbol} to reach ${target}% allocation.`
        });
      } else if (current > target + 1) {
        // Need to sell
        actions.push({
          action: 'sell',
          symbol,
          amountUSD: ((current - target) / 100) * overview.totalValue,
          reason: `Reduce ${symbol} to reach ${target}% allocation.`
        });
      }
    }

    // --- UPGRADE: Build XDRs for each action ---
    const xdrResults: any[] = [];
    for (const act of actions) {
      let xdrResult = null;
      let summary = '';
      try {
        // For simplicity, use USDC as the base asset for swaps (can be improved)
        const baseAsset = 'USDC';
        if (act.action === 'buy') {
          // Swap USDC -> target asset
          if (act.symbol === baseAsset) {
            summary = `Already in ${baseAsset}, no swap needed.`;
            xdrResult = null;
          } else {
            // Convert USD to token amount using price
            const assetObj = overview.assets.find((a: any) => a.symbol === act.symbol);
            const baseAssetObj = overview.assets.find((a: any) => a.symbol === baseAsset);
            const price = assetObj && assetObj.balance && assetObj.usdValue ? assetObj.usdValue / assetObj.balance : 1;
            const amountToBuy = act.amountUSD / price;
            const baseAssetPrice = baseAssetObj && baseAssetObj.balance && baseAssetObj.usdValue ? baseAssetObj.usdValue / baseAssetObj.balance : 1;
            const amountToSwap = act.amountUSD / baseAssetPrice;
            const swapRes = await this.soroswap.swap({
              userAddress,
              fromAsset: baseAsset,
              toAsset: act.symbol,
              amount: amountToSwap,
              maxSlippage: 0.5
            });
            if (swapRes.status === 'READY' || swapRes.xdr) {
              xdrResult = swapRes.xdr;
              summary = `Swap ${act.amountUSD.toFixed(2)} USD worth of ${baseAsset} for ${amountToBuy.toFixed(4)} ${act.symbol} to rebalance.`;
            } else {
              summary = `Failed to build swap XDR for buying ${act.symbol}: ${swapRes.message || 'Unknown error'}`;
            }
          }
        } else if (act.action === 'sell') {
          // Swap token -> USDC
          if (act.symbol === baseAsset) {
            summary = `Already in ${baseAsset}, no swap needed.`;
            xdrResult = null;
          } else {
            const assetObj = overview.assets.find((a: any) => a.symbol === act.symbol);
            const price = assetObj && assetObj.balance && assetObj.usdValue ? assetObj.usdValue / assetObj.balance : 1;
            const amountToSell = act.amountUSD / price;
            const swapRes = await this.soroswap.swap({
              userAddress,
              fromAsset: act.symbol,
              toAsset: baseAsset,
              amount: amountToSell,
              maxSlippage: 0.5
            });
            if (swapRes.status === 'READY' || swapRes.xdr) {
              xdrResult = swapRes.xdr;
              summary = `Swap ${amountToSell.toFixed(4)} ${act.symbol} for ${act.amountUSD.toFixed(2)} USD worth of ${baseAsset} to rebalance.`;
            } else {
              summary = `Failed to build swap XDR for selling ${act.symbol}: ${swapRes.message || 'Unknown error'}`;
            }
          }
        }
      } catch (e: any) {
        summary = `Error building XDR for ${act.action} ${act.symbol}: ${e.message}`;
        xdrResult = null;
      }
      xdrResults.push({
        action: act.action,
        symbol: act.symbol,
        amountUSD: act.amountUSD,
        xdr: xdrResult,
        summary,
        status: xdrResult ? 'READY' : 'ERROR'
      });
    }

    return {
      status: xdrResults.some(x => x.xdr) ? 'READY' : 'OK',
      currentAllocation: currentAlloc,
      targetAllocation: targetAlloc,
      suggestedActions: actions,
      xdrActions: xdrResults,
      xdrs: xdrResults.filter(x => x.xdr).map(x => x.xdr), // Array of XDRs for execution
      message: xdrResults.some(x => x.xdr) ? 
        `Portfolio rebalancing XDRs ready for signing. ${xdrResults.filter(x => x.xdr).length} transactions to execute.` :
        'Portfolio analysis complete. No rebalancing transactions needed.',
      note: 'Review each transaction and sign in your wallet to execute the rebalancing.'
    };
  }

  /**
   * Scan all pools, recommend moving funds to maximize yield (APY), considering risk and liquidity.
   *
   * Upgraded: Actually builds and returns XDRs for moving funds to the best-yielding pools.
   */
  async optimizeYield(userAddress: string) {
    const overview = await this.getUnifiedPortfolioOverview(userAddress);
    const poolsRes = await this.soroswap.getAvailableSoroswapPools();
    const pools = poolsRes.status === 'OK' ? poolsRes.pools : [];
    const actions: any[] = [];
    const xdrActions: any[] = [];

    // For each LP position, check if a better pool exists
    for (const lp of overview.lps) {
      const currentPool = pools.find((p: any) => `${p.tokenA}/${p.tokenB}` === lp.pool);
      const currentApy = currentPool && currentPool.apy !== undefined ? currentPool.apy : 0;
      // Find best pool for these tokens
      let bestPool = currentPool;
      let bestApy = currentApy;
      for (const p of pools) {
        if ((p.tokenA === currentPool?.tokenA || p.tokenB === currentPool?.tokenA || p.tokenA === currentPool?.tokenB || p.tokenB === currentPool?.tokenB) && p.apy !== undefined && p.apy > bestApy) {
          bestApy = p.apy;
          bestPool = p;
        }
      }
      if (bestPool && bestApy > currentApy && bestPool.address !== currentPool?.address) {
        // Suggest moving to bestPool
        actions.push({
          type: 'move_liquidity',
          asset: lp.pool,
          fromPool: lp.pool,
          toPool: `${bestPool.tokenA}/${bestPool.tokenB}`,
          fromPoolId: currentPool?.address,
          toPoolId: bestPool.address,
          currentAPY: currentApy,
          targetAPY: bestApy,
          potentialGain: (lp.valueUSD || 0) * (bestApy - currentApy) / 100,
          action: `Move liquidity from ${lp.pool} to ${bestPool.tokenA}/${bestPool.tokenB} for higher APY.`
        });
        
        // --- Build XDRs ---
        // 1. Remove liquidity from current pool
        try {
          const removeRes = await this.soroswap.removeLiquidity({
            userAddress,
            poolId: currentPool?.address,
            lpAmount: lp.lpAmount
          });
          if (removeRes.status === 'READY' || removeRes.xdr) {
            xdrActions.push({
              step: 'remove_liquidity',
              fromPool: lp.pool,
              toPool: `${bestPool.tokenA}/${bestPool.tokenB}`,
              xdr: removeRes.xdr,
              status: 'READY',
              summary: `Remove ${lp.lpAmount} LP tokens from ${lp.pool}`
            });
          }
        } catch (e: any) {
          xdrActions.push({
            step: 'remove_liquidity',
            fromPool: lp.pool,
            toPool: `${bestPool.tokenA}/${bestPool.tokenB}`,
            xdr: null,
            status: 'ERROR',
            summary: `Error removing liquidity: ${e.message}`
          });
        }

        // 2. Add liquidity to best pool
        try {
          const amountA = lp.tokenAAmount;
          const amountB = lp.tokenBAmount;
          const addRes = await this.soroswap.addLiquidity({
            userAddress,
            tokenA: bestPool.tokenA,
            tokenB: bestPool.tokenB,
            amountA,
            amountB,
            autoBalance: true
          });
          if (addRes.status === 'READY' || addRes.xdr) {
            xdrActions.push({
              step: 'add_liquidity',
              fromPool: lp.pool,
              toPool: `${bestPool.tokenA}/${bestPool.tokenB}`,
              xdr: addRes.xdr,
              status: 'READY',
              summary: `Add liquidity to ${bestPool.tokenA}/${bestPool.tokenB} with ${amountA} ${bestPool.tokenA} and ${amountB} ${bestPool.tokenB}`
            });
          }
        } catch (e: any) {
          xdrActions.push({
            step: 'add_liquidity',
            fromPool: lp.pool,
            toPool: `${bestPool.tokenA}/${bestPool.tokenB}`,
            xdr: null,
            status: 'ERROR',
            summary: `Error adding liquidity: ${e.message}`
          });
        }
      }
    }

    // For idle assets (not in LP), suggest adding to best pool
    for (const asset of overview.assets) {
      if (asset.balance && asset.balance > 0) {
        // Find best pool for this asset
        let bestPool = null;
        let bestApy = 0;
        for (const p of pools) {
          if ((p.tokenA === asset.symbol || p.tokenB === asset.symbol) && p.apy !== undefined && p.apy > bestApy) {
            bestApy = p.apy;
            bestPool = p;
          }
        }
        if (bestPool && bestApy > 0) {
          actions.push({
            type: 'add_idle_to_pool',
            asset: asset.symbol,
            toPool: `${bestPool.tokenA}/${bestPool.tokenB}`,
            currentAPY: 0,
            targetAPY: bestApy,
            potentialGain: (asset.usdValue || 0) * bestApy / 100,
            action: `Provide liquidity to ${bestPool.tokenA}/${bestPool.tokenB} for ${bestApy}% APY`
          });
          
          // Build add liquidity XDR
          try {
            const amountA = bestPool.tokenA === asset.symbol ? asset.balance : 0;
            const amountB = bestPool.tokenB === asset.symbol ? asset.balance : 0;
            const addRes = await this.soroswap.addLiquidity({
              userAddress,
              tokenA: bestPool.tokenA,
              tokenB: bestPool.tokenB,
              amountA,
              amountB,
              autoBalance: true
            });
            if (addRes.status === 'READY' || addRes.xdr) {
              xdrActions.push({
                step: 'add_liquidity',
                asset: asset.symbol,
                toPool: `${bestPool.tokenA}/${bestPool.tokenB}`,
                xdr: addRes.xdr,
                status: 'READY',
                summary: `Add ${asset.balance} ${asset.symbol} to ${bestPool.tokenA}/${bestPool.tokenB} pool`
              });
            }
          } catch (e: any) {
            xdrActions.push({
              step: 'add_liquidity',
              asset: asset.symbol,
              toPool: `${bestPool.tokenA}/${bestPool.tokenB}`,
              xdr: null,
              status: 'ERROR',
              summary: `Error adding liquidity: ${e.message}`
            });
          }
        }
      }
    }

    const totalPotentialGain = actions.reduce((sum, a) => sum + (a.potentialGain || 0), 0);
    const readyXdrs = xdrActions.filter(x => x.xdr);

    return {
      status: readyXdrs.length > 0 ? 'READY' : 'OK',
      suggestions: actions,
      xdrActions,
      xdrs: readyXdrs.map(x => x.xdr), // Array of XDRs for execution
      summary: {
        totalOpportunities: actions.length,
        totalPotentialGain: totalPotentialGain,
        readyTransactions: readyXdrs.length,
        avgAPYIncrease: actions.length > 0 ? 
          actions.reduce((sum, a) => sum + (a.targetAPY - a.currentAPY), 0) / actions.length : 0
      },
      message: readyXdrs.length > 0 ?
        `Yield optimization ready! ${readyXdrs.length} transactions to increase earnings by $${totalPotentialGain.toFixed(2)}/year` :
        'Portfolio already optimized. No yield improvements available.',
      note: 'Review each transaction and sign in your wallet to optimize your yield.'
    };
  }

  /**
   * Assess portfolio risk: pool volatility, impermanent loss, asset risk, diversification, and exposure.
   */
  async riskAnalysis(userAddress: string) {
    const overview = await this.getUnifiedPortfolioOverview(userAddress);
    const poolsRes = await this.soroswap.getAvailableSoroswapPools();
    const pools = poolsRes.status === 'OK' ? poolsRes.pools : [];
    // Simple risk metrics: concentration, exposure to volatile assets, LP impermanent loss risk
    const volatileAssets = ['XLM', 'BTC', 'ETH', 'DOGE']; // Example: treat these as more volatile
    const assetRisks = overview.assets.map((a:any) => ({
      symbol: a.symbol,
      usdValue: a.usdValue || 0,
      volatile: volatileAssets.includes(a.symbol),
      percent: overview.totalValue > 0 ? ((a.usdValue || 0) / overview.totalValue) * 100 : 0
    }));
    // LP risk: if pool contains volatile asset, higher impermanent loss risk
    const lpRisks = overview.lps.map((lp: any) => {
      const pool = pools.find((p: any) => `${p.tokenA}/${p.tokenB}` === lp.pool);
      const containsVolatile = volatileAssets.includes(lp.pool.split('/')[0]) || volatileAssets.includes(lp.pool.split('/')[1]);
      return {
        pool: lp.pool,
        valueUSD: lp.valueUSD,
        impermanentLossRisk: containsVolatile ? 'high' : 'low',
        apy: pool && pool.apy !== undefined ? pool.apy : 'N/A',
      };
    });
    // Diversification
    const hhi = assetRisks.reduce((sum:any, a:any) => sum + Math.pow(a.percent / 100, 2), 0);
    return {
      assetRisks,
      lpRisks,
      diversificationIndex: hhi,
      note: 'Lower diversification index (closer to 0) means more diversified. High impermanent loss risk for LPs with volatile assets.'
    };
  }

  /**
   * Calculate risk distribution across all protocols
   */
  private calculateRiskDistribution(defindexPositions: any[], blendPositions: any[], soroswapOverview: any) {
    console.log('[UnifiedPortfolioService] Calculating risk distribution across protocols...');
    
    const riskLevels = { Low: 0, Medium: 0, High: 0 };
    
    // DeFindex risk levels
    console.log(`[UnifiedPortfolioService] Processing ${defindexPositions.length} DeFindex positions for risk analysis`);
    defindexPositions.forEach((pos, index) => {
      const risk = pos.strategy?.riskLevel || 'Medium';
      if (riskLevels[risk as keyof typeof riskLevels] !== undefined) {
        riskLevels[risk as keyof typeof riskLevels] += pos.balance || 0;
        console.log(`[UnifiedPortfolioService] DeFindex position ${index + 1}: ${pos.vaultName || 'Unknown'}, risk: ${risk}, value: ${pos.balance || 0}`);
      }
    });
    
    // Blend positions (generally low risk)
    console.log(`[UnifiedPortfolioService] Processing ${blendPositions.length} Blend positions for risk analysis`);
    blendPositions.forEach((pos, index) => {
      riskLevels.Low += pos.totalValue || 0;
      console.log(`[UnifiedPortfolioService] Blend position ${index + 1}: value: ${pos.totalValue || 0} (classified as Low risk)`);
    });
    
    // Soroswap LP positions (medium-high risk)
    console.log(`[UnifiedPortfolioService] Processing ${soroswapOverview.lps.length} Soroswap LP positions for risk analysis`);
    soroswapOverview.lps.forEach((lp: any, index: number) => {
      riskLevels.Medium += lp.valueUSD || 0;
      console.log(`[UnifiedPortfolioService] Soroswap LP ${index + 1}: ${lp.pool}, value: ${lp.valueUSD || 0} (classified as Medium risk)`);
    });
    
    // Soroswap token holdings (low-medium risk)
    console.log(`[UnifiedPortfolioService] Processing ${soroswapOverview.assets.length} Soroswap token assets for risk analysis`);
    soroswapOverview.assets.forEach((asset: any, index: number) => {
      riskLevels.Low += asset.usdValue || 0;
      console.log(`[UnifiedPortfolioService] Soroswap asset ${index + 1}: ${asset.symbol}, value: ${asset.usdValue || 0} (classified as Low risk)`);
    });
    
    const total = riskLevels.Low + riskLevels.Medium + riskLevels.High;
    
    const result = {
      low: total > 0 ? (riskLevels.Low / total) * 100 : 0,
      medium: total > 0 ? (riskLevels.Medium / total) * 100 : 0,
      high: total > 0 ? (riskLevels.High / total) * 100 : 0
    };
    
    console.log('[UnifiedPortfolioService] Risk distribution calculated:', result);
    return result;
  }

  /**
   * Get comprehensive yield analysis across all protocols
   */
  async getUnifiedYieldAnalysis(userAddress: string) {
    // 1. DeFindex yield analysis
    const defindexRes = await this.defindex.getUserPositions({ userAddress });
    const defindexYields = defindexRes.status === 'OK' ? defindexRes.positions.map((pos: any) => ({
      protocol: 'DeFindex',
      position: pos.vaultName,
      asset: pos.strategy?.asset || 'Unknown',
      currentAPY: pos.strategy?.currentAPY || 0,
      balance: pos.balance || 0,
      earnings: pos.breakdown?.earnings || 0,
      riskLevel: pos.strategy?.riskLevel || 'Medium',
      autoCompound: pos.strategy?.autoCompound || false,
      projectedYearlyEarnings: (pos.balance || 0) * (pos.strategy?.currentAPY || 0) / 100
    })) : [];

    // 2. Soroswap yield analysis
    const soroswapYields = await this.yieldAnalysis(userAddress);
    const soroswapFormatted = soroswapYields.map((yieldData: any) => ({
      protocol: 'Soroswap',
      position: yieldData.pool,
      asset: `${yieldData.tokenA}-${yieldData.tokenB}`,
      currentAPY: yieldData.apy !== 'N/A' ? yieldData.apy : 0,
      balance: yieldData.valueUSD || 0,
      earnings: 0, // Would need historical data
      riskLevel: 'Medium-High',
      autoCompound: false,
      projectedYearlyEarnings: (yieldData.valueUSD || 0) * (yieldData.apy !== 'N/A' ? yieldData.apy : 0) / 100,
      trend: yieldData.trend,
      recommendation: yieldData.recommendation
    }));

    // 3. Blend yield analysis (if available)
    let blendYields: any[] = [];
    try {
      const blendRes = await this.blend.getUserPositions({ userAddress });
      if (blendRes.status === 'OK') {
        blendYields = blendRes.positions.map((pos: any) => ({
          protocol: 'Blend',
          position: `${pos.asset} Lending`,
          asset: pos.asset,
          currentAPY: pos.apy || 0,
          balance: pos.totalValue || 0,
          earnings: pos.earnings || 0,
          riskLevel: 'Low',
          autoCompound: true,
          projectedYearlyEarnings: (pos.totalValue || 0) * (pos.apy || 0) / 100
        }));
      }
    } catch (e) {
      console.log('Blend yield analysis not available:', e);
    }

    // 4. Combine and analyze
    const allYields = [...defindexYields, ...soroswapFormatted, ...blendYields];
    const totalBalance = allYields.reduce((sum, y) => sum + y.balance, 0);
    const totalProjectedEarnings = allYields.reduce((sum, y) => sum + y.projectedYearlyEarnings, 0);
    const weightedAPY = totalBalance > 0 ? (totalProjectedEarnings / totalBalance) * 100 : 0;

    return {
      positions: allYields,
      summary: {
        totalBalance,
        totalProjectedEarnings,
        weightedAPY,
        bestPerformer: allYields.reduce((best, current) => 
          current.currentAPY > best.currentAPY ? current : best, { currentAPY: 0 }),
        protocolBreakdown: {
          defindex: defindexYields.length,
          soroswap: soroswapFormatted.length,
          blend: blendYields.length
        }
      }
    };
  }

  /**
   * Get DeFindex-specific portfolio insights and recommendations
   */
  async getDeFindexInsights(userAddress: string) {
    const defindexRes = await this.defindex.getUserPositions({ userAddress });
    if (defindexRes.status !== 'OK') {
      return { status: 'ERROR', message: 'Failed to get DeFindex positions' };
    }

    const positions = defindexRes.positions;
    const opportunities = await this.defindex.getYieldOpportunities({ userAddress, riskTolerance: 'medium' });
    
    // Analyze current DeFindex allocation
    const totalValue = positions.reduce((sum: number, pos: any) => sum + (pos.balance || 0), 0);
    const strategyBreakdown = positions.reduce((acc: any, pos: any) => {
      const strategy = pos.strategy?.type || 'Unknown';
      acc[strategy] = (acc[strategy] || 0) + (pos.balance || 0);
      return acc;
    }, {});

    // Risk analysis
    const riskBreakdown = positions.reduce((acc: any, pos: any) => {
      const risk = pos.strategy?.riskLevel || 'Medium';
      acc[risk] = (acc[risk] || 0) + (pos.balance || 0);
      return acc;
    }, {});

    // Performance analysis
    const totalEarnings = positions.reduce((sum: number, pos: any) => sum + (pos.breakdown?.earnings || 0), 0);
    const avgAPY = positions.length > 0 ? 
      positions.reduce((sum: number, pos: any) => sum + (pos.strategy?.currentAPY || 0), 0) / positions.length : 0;

    return {
      status: 'OK',
      insights: {
        totalValue,
        totalEarnings,
        avgAPY,
        positionCount: positions.length,
        strategyBreakdown,
        riskBreakdown,
        performance: {
          totalReturn: totalValue > 0 ? (totalEarnings / (totalValue - totalEarnings)) * 100 : 0,
          bestPerformer: positions.reduce((best: any, current: any) => 
            (current.performance?.totalReturnPercent || 0) > (best.performance?.totalReturnPercent || 0) ? current : best, {}),
          worstPerformer: positions.reduce((worst: any, current: any) =>
            (current.performance?.totalReturnPercent || 0) < (worst.performance?.totalReturnPercent || 0) ? current : worst, {})
        },
        opportunities: opportunities.status === 'OK' ? opportunities.opportunities.slice(0, 3) : [],
        recommendations: this.generateDeFindexRecommendations(positions, strategyBreakdown, riskBreakdown, totalValue)
      }
    };
  }

  /**
   * Generate DeFindex-specific recommendations
   */
  private generateDeFindexRecommendations(positions: any[], strategyBreakdown: any, riskBreakdown: any, totalValue: number) {
    const recommendations = [];

    // Diversification recommendations
    if (Object.keys(strategyBreakdown).length === 1) {
      recommendations.push({
        type: 'diversification',
        priority: 'high',
        message: 'Consider diversifying across different DeFindex strategies to reduce risk',
        action: 'Add positions in different strategy types (Blend, YieldBlox, LP)'
      });
    }

    // Risk balance recommendations
    const riskTotal = Object.values(riskBreakdown).reduce((sum: number, val: any) => sum + val, 0);
    const lowRiskPercent = riskTotal > 0 ? ((riskBreakdown.Low || 0) / riskTotal) * 100 : 0;
    const highRiskPercent = riskTotal > 0 ? ((riskBreakdown.High || 0) / riskTotal) * 100 : 0;

    if (lowRiskPercent > 80) {
      recommendations.push({
        type: 'yield_optimization',
        priority: 'medium',
        message: 'Your DeFindex portfolio is very conservative. Consider adding medium-risk strategies for higher yields',
        action: 'Explore YieldBlox strategies for enhanced returns'
      });
    }

    if (highRiskPercent > 60) {
      recommendations.push({
        type: 'risk_management',
        priority: 'high',
        message: 'High risk exposure in DeFindex positions. Consider rebalancing with lower-risk strategies',
        action: 'Add Blend fixed pool strategies for stability'
      });
    }

    // Performance-based recommendations
    const avgPerformance = positions.reduce((sum: number, pos: any) => 
      sum + (pos.performance?.totalReturnPercent || 0), 0) / positions.length;
    
    if (avgPerformance < 5) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'DeFindex positions showing below-average performance. Consider strategy optimization',
        action: 'Review and potentially switch to higher-performing strategies'
      });
    }

    // Size-based recommendations
    if (totalValue < 100) {
      recommendations.push({
        type: 'growth',
        priority: 'low',
        message: 'Small DeFindex allocation. Consider increasing position sizes for better returns',
        action: 'Gradually increase DeFindex investments as portfolio grows'
      });
    }

    return recommendations;
  }

  /**
   * Cross-protocol arbitrage and optimization opportunities
   */
  async getCrossProtocolOpportunities(userAddress: string) {
    const unifiedPortfolio = await this.getUnifiedPortfolioOverview(userAddress);
    const yieldAnalysis = await this.getUnifiedYieldAnalysis(userAddress);
    
    const opportunities = [];

    // 1. Yield arbitrage opportunities
    const yieldPositions = yieldAnalysis.positions.sort((a, b) => b.currentAPY - a.currentAPY);
    const bestYield = yieldPositions[0];
    const worstYield = yieldPositions[yieldPositions.length - 1];
    
    if (bestYield && worstYield && bestYield.currentAPY - worstYield.currentAPY > 3) {
      opportunities.push({
        type: 'yield_arbitrage',
        priority: 'high',
        message: `Move funds from ${worstYield.position} (${worstYield.currentAPY.toFixed(1)}% APY) to ${bestYield.position} (${bestYield.currentAPY.toFixed(1)}% APY)`,
        potentialGain: (worstYield.balance * (bestYield.currentAPY - worstYield.currentAPY) / 100),
        action: `Withdraw from ${worstYield.protocol} and deposit into ${bestYield.protocol}`
      });
    }

    // 2. Protocol diversification opportunities
    const protocolCount = Object.values(unifiedPortfolio.protocols).filter((p: any) => p.count > 0).length;
    if (protocolCount < 2) {
      opportunities.push({
        type: 'diversification',
        priority: 'medium',
        message: 'Portfolio concentrated in single protocol. Consider diversifying across DeFi protocols',
        action: 'Explore opportunities in other protocols (DeFindex, Blend, Soroswap)'
      });
    }

    // 3. Risk optimization opportunities
    const riskDist = unifiedPortfolio.diversification.riskDistribution;
    if (riskDist.high > 70) {
      opportunities.push({
        type: 'risk_reduction',
        priority: 'high',
        message: 'High risk concentration. Consider rebalancing to lower-risk positions',
        action: 'Move some funds to Blend lending or DeFindex Blend strategies'
      });
    }

    return {
      opportunities,
      summary: {
        totalOpportunities: opportunities.length,
        highPriority: opportunities.filter(o => o.priority === 'high').length,
        potentialGains: opportunities.reduce((sum, o) => sum + (o.potentialGain || 0), 0)
      }
    };
  }

  /**
   * Get unified portfolio data across all protocols
   */
  async getUnifiedPortfolio(userAddress: string) {
    return {
      totalValue: 0,
      positions: [],
      protocols: {
        blend: [],
        soroswap: [],
        defindex: []
      }
    };
  }

  /**
   * Get portfolio analytics
   */
  async getPortfolioAnalytics(userAddress: string) {
    return {
      performance: {
        dailyChange: 0,
        weeklyChange: 0,
        monthlyChange: 0
      },
      allocation: {},
      riskMetrics: {}
    };
  }
}