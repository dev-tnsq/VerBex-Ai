import axios from "axios";
import BigNumber from "bignumber.js";
import stellarSdk from '@stellar/stellar-sdk';

const SOROSWAP_FACTORY = "CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2";
const SOROSWAP_ROUTER = "CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH";
// Soroswap staging API base URL and API key for hackathon
const SOROSWAP_API_BASE = 'https://soroswap-api-staging-436722401508.us-central1.run.app';
const SOROSWAP_API_KEY = 'sk_e2acb3e0b5248f286023ef7ce9a5cde7e087c12579ae85fb3e9e318aeb11c6ce';

// Token decimals map (extend as needed)
const TOKEN_DECIMALS: Record<string, number> = {
  "XLM": 7,
  "USDC": 7,
  "BTC": 7,
  "ETH": 7
};

// Use this axios instance for all Soroswap API calls
const axiosInstance = axios.create({
  baseURL: SOROSWAP_API_BASE,
  headers: {
    'Authorization': `Bearer ${SOROSWAP_API_KEY}`,
  },
});

const TESTNET_PROTOCOLS = ["soroswap"];
const TESTNET_NETWORK = "testnet";

const rpcUrl = 'https://soroban-testnet.stellar.org';
const networkPassphrase = 'Test SDF Network ; September 2015';

export class SoroswapService {
  constructor() {}

  // Convert amount to stroops based on token decimals
  private toStroops(amount: number, asset: string): string {
    const decimals = TOKEN_DECIMALS[asset] || 7;
    return new BigNumber(amount).times(10 ** decimals).toFixed(0);
  }

  // Convert stroops to human-readable amount
  private fromStroops(amount: string, asset: string): number {
    const decimals = TOKEN_DECIMALS[asset] || 7;
    return new BigNumber(amount).dividedBy(10 ** decimals).toNumber();
  }

  // 1. Swap (Best Route, real XDR, no simulation)
  async swap({ userAddress, fromAsset, toAsset, amount, maxSlippage = 0.5, routeType = "aggregator" }: {
    userAddress: string;
    fromAsset: string;
    toAsset: string;
    amount: number;
    maxSlippage?: number;
    routeType?: "amm" | "aggregator";
  }): Promise<any> {
    console.log('[SoroswapService] swap called with:', { userAddress, fromAsset, toAsset, amount, maxSlippage, routeType });
    try {
      const amountInStroops = this.toStroops(amount, fromAsset);
      const quoteRes = await axiosInstance.post('/quote?network=testnet', {
        assetIn: fromAsset,
        assetOut: toAsset,
        amount: amountInStroops,
        tradeType: "EXACT_IN",
        protocols:TESTNET_PROTOCOLS,
        slippageBps: maxSlippage * 1000,
        parts: 10,
        maxHops: 3
      });
      const quote = quoteRes.data;
      if (!quote) throw new Error("No quote found");
      const buildRes = await axiosInstance.post(`/quote/build?network=${TESTNET_NETWORK}`, {
        quote,
        from: userAddress,
        to: userAddress
      });
      console.log('[SoroswapService] swap buildRes:', buildRes.data);
      const xdr = buildRes.data?.xdr;
      if (!xdr) throw new Error("Failed to build XDR");
      return {
        status: "READY",
        xdr,
        quote,
      
      };
    } catch (error: any) {
      console.error('[SoroswapService] swap error:', error?.message, error?.response?.data);
      return {
        status: "ERROR",
        message: error?.message || "Swap failed",
        error: error?.response?.data || null
      };
    }
  }

  // 2. Add Liquidity (with auto-balance)
  async addLiquidity({ userAddress, tokenA, tokenB, amountA, amountB, autoBalance = true }: {
    userAddress: string;
    tokenA: string;
    tokenB: string;
    amountA: number;
    amountB: number;
    autoBalance?: boolean;
  }): Promise<any> {
    console.log('[SoroswapService] addLiquidity called with:', { userAddress, tokenA, tokenB, amountA, amountB, autoBalance });
    try {
      let adjustedAmountA = amountA;
      let adjustedAmountB = amountB;
      if (autoBalance) {
        const poolRes = await axiosInstance.get(`/pools/${tokenA}/${tokenB}?network=testnet&protocol=soroswap`);
        console.log('[SoroswapService] addLiquidity poolRes:', poolRes.data);
        const pool = Array.isArray(poolRes.data) ? poolRes.data[0] : poolRes.data;
        if (pool) {
          const reserveA = this.fromStroops(pool.reserveA, tokenA);
          const reserveB = this.fromStroops(pool.reserveB, tokenB);
          const ratio = reserveA / reserveB;
          const optimalAmountB = amountA / ratio;
          if (optimalAmountB < amountB) {
            adjustedAmountB = optimalAmountB;
          } else {
            adjustedAmountA = amountB * ratio;
          }
          // Use pool address as 'to' per user request
          var poolAddress = pool.address;
        }
      }
      const res = await axiosInstance.post(`/liquidity/add?network=testnet`, {
        assetA: tokenA,
        assetB: tokenB,
        amountA: this.toStroops(adjustedAmountA, tokenA),
        amountB: this.toStroops(adjustedAmountB, tokenB),
        to: userAddress,
        slippageBps: "1000"
      });
      console.log('[SoroswapService] addLiquidity res:', res.data);
      const xdr = res.data?.xdr;
      if (!xdr) throw new Error("Failed to build add liquidity XDR");
      return {
        status: "READY",
        xdr,
        details: {
          tokenA: adjustedAmountA,
          tokenB: adjustedAmountB,
          poolShare: res.data?.sharePercentage
        }
      };
    } catch (error: any) {
      console.error('[SoroswapService] addLiquidity error:', error?.message, error?.response?.data);
      return {
        status: "ERROR",
        message: error?.message || "Add liquidity failed",
        error: error?.response?.data || null
      };
    }
  }

  // 3. Remove Liquidity
  async removeLiquidity({ userAddress, poolId, lpAmount }: {
    userAddress: string;
    poolId: string;
    lpAmount: number;
  }): Promise<any> {
    console.log('[SoroswapService] removeLiquidity called with:', { userAddress, poolId, lpAmount });
    try {
      const lpDecimals = 7;
      const lpAmountStroops = new BigNumber(lpAmount).times(10 ** lpDecimals).toFixed(0);
      const res = await axiosInstance.post(`/liquidity/remove?network=testnet`, {
        poolId,
        liquidity: lpAmountStroops,
        to: userAddress
      });
      console.log('[SoroswapService] removeLiquidity res:', res.data);
      const xdr = res.data?.xdr;
      if (!xdr) throw new Error("Failed to build remove liquidity XDR");
      return {
        status: "READY",
        xdr,
        details: {
          estimatedTokenA: res.data?.amountA,
          estimatedTokenB: res.data?.amountB
        }
      };
    } catch (error: any) {
      console.error('[SoroswapService] removeLiquidity error:', error?.message, error?.response?.data);
      return {
        status: "ERROR",
        message: error?.message || "Remove liquidity failed",
        error: error?.response?.data || null
      };
    }
  }

  // 18. Get Available Soroswap Pools (testnet)
  async getAvailableSoroswapPools(): Promise<any> {
    try {
      const res = await axiosInstance.get(`/pools?network=testnet&protocol=soroswap`);
      return {
        status: 'OK',
        pools: res.data
      };
    } catch (error: any) {
      console.error('[SoroswapService] getAvailablePools error:', error?.message, error?.response?.data);
      return {
        status: 'ERROR',
        message: error?.message || 'Failed to fetch Soroswap pools',
        error: error?.response?.data || null
      };
    }
  }

  // 6. User LP Positions
  async getUserLPPositions({ userAddress }: { userAddress: string }): Promise<any> {
    console.log('[SoroswapService] getUserLPPositions called with:', { userAddress });
    try {
      const res = await axiosInstance.get(`/liquidity/positions/${userAddress}?network=testnet`);
      console.log('[SoroswapService] getUserLPPositions res:', res.data);
      const positions = res.data.map((p: any) => ({
        ...p,
        lpAmount: this.fromStroops(p.lpAmount, "LP"),
        tokenAAmount: this.fromStroops(p.tokenAAmount, p.tokenA),
        tokenBAmount: this.fromStroops(p.tokenBAmount, p.tokenB),
        valueUSD: p.valueUSD
      }));
      return {
        status: "OK",
        positions
      };
    } catch (error: any) {
      console.error('[SoroswapService] getUserLPPositions error:', error?.message, error?.response?.data);
      return {
        status: "ERROR",
        message: error?.message || "Failed to get LP positions",
        error: error?.response?.data || null
      };
    }
  }

  // 7. Price Data
  async getPrice({ asset, referenceCurrency = "USD" }: { asset: string; referenceCurrency?: string; }): Promise<any> {
    console.log('[SoroswapService] getPrice called with:', { asset, referenceCurrency });
    try {
      // asset can be a single contract address or comma-separated list
      const url = `/price?network=${TESTNET_NETWORK}&asset=${asset}&referenceCurrency=${encodeURIComponent(referenceCurrency)}`;
      const res = await axiosInstance.get(url);
      console.log('[SoroswapService] getPrice res:', res.data);
      return {
        status: "OK",
        prices: res.data
      };
    } catch (error: any) {
      console.error('[SoroswapService] getPrice error:', error?.message, error?.response?.data);
      return {
        status: "ERROR",
        message: error?.message || "Failed to get price",
        error: error?.response?.data || null
      };
    }
  }

  // 15. Search Tokens
  async searchTokens({ query, limit = 100, sortBy = "createdAt", sortOrder = "desc" }: { query: string; limit?: number; sortBy?: string; sortOrder?: string }): Promise<any> {
    console.log('[SoroswapService] searchTokens called with:', { query, limit, sortBy, sortOrder });
    try {
      const res = await axiosInstance.get(`/search?query=${encodeURIComponent(query)}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      console.log('[SoroswapService] searchTokens res:', res.data);
      return {
        status: "OK",
        tokens: res.data.data
      };
    } catch (error: any) {
      console.error('[SoroswapService] searchTokens error:', error?.message, error?.response?.data);
      return {
        status: "ERROR",
        message: error?.message || "Failed to search tokens",
        error: error?.response?.data || null
      };
    }
  }

  // 17. Get Asset List
  async getAssetList(): Promise<any> {
    console.log('[SoroswapService] getAssetList called');
    try {
      const res = await axiosInstance.get(`/asset-list`);
      console.log('[SoroswapService] getAssetList res:', res.data);
      return {
        status: "OK",
        assets: res.data
      };
    } catch (error: any) {
      console.error('[SoroswapService] getAssetList error:', error?.message, error?.response?.data);
      return {
        status: "ERROR",
        message: error?.message || "Failed to get asset list",
        error: error?.response?.data || null
      };
    }
  }

  /**
   * Get all Soroswap token balances for a user by calling each token contract's balance method.
   * Uses Soroban JS SDK Client for contract calls.
   * @param userAddress The user's Stellar wallet address
   * @returns Array of token balances with contract, code, issuer, balance, decimals
   */
  async getUserTokenBalances(userAddress: string) {
    console.log('[getUserTokenBalances] Called for user:', userAddress);
    // 1. Get all Soroswap testnet tokens from /api/tokens endpoint
    const res = await axios.get('https://soroswap-api-staging-436722401508.us-central1.run.app/api/tokens');
    const tokens = res.data.find((n: any) => n.network === 'testnet')?.assets || [];
    console.log('[getUserTokenBalances] Tokens to check:', tokens.map((t: any) => t.code));
    if (!tokens.length) throw new Error('No testnet tokens found');

    // 2. Helper for contractInvoke using Soroban JS SDK
    async function _contractInvoke({ contractAddress, method, args = [], publicKey }: {
      contractAddress: string,
      method: string,
      args?: any[],
      publicKey: string
    }) {
      try {
        const { Server, TransactionBuilder, Operation, Networks, Address } = stellarSdk;
        const server = new stellarSdk.rpc.Server(rpcUrl, { allowHttp: true });

        let scArgs: any[] = [];
        if (method === 'balance') {
          const userArg = args[0]?.user;
          scArgs = [Address.fromString(userArg).toScVal()];
        } else if (method === 'decimals') {
          scArgs = [];
        } else {
          throw new Error('Unsupported method for _contractInvoke');
        }

        console.log(`[getUserTokenBalances] Invoking contract ${contractAddress} method ${method} for user ${publicKey}`);

        const op = Operation.invokeContractFunction({
          contract: contractAddress,
          function: method,
          args: scArgs,
        });

        const account = await server.getAccount(publicKey);
        const tx = new TransactionBuilder(account, {
          fee: '100',
          networkPassphrase,
        })
          .addOperation(op)
          .setTimeout(30)
          .build();

        const simResult = await server.simulateTransaction(tx);
        if (simResult.result) {
          if (!isNaN(Number(simResult.result))) {
            return Number(simResult.result);
          }
          return simResult.result;
        }
        return null;
      } catch (e: any) {
        console.error(`[getUserTokenBalances] Error invoking contract ${contractAddress} method ${method}:`, e.message);
        return e.message;
      }
    }

    async function getTokenBalance(token: any, userAddress: string) {
      if (!token.contract) return null;
      try {
        const result = await _contractInvoke({
          contractAddress: token.contract,
          method: 'balance',
          args: [{ user: userAddress }],
          publicKey: userAddress,
        });
        console.log(`[getUserTokenBalances] Balance for ${token.code}:`, result);
        return result;
      } catch {
        return null;
      }
    }
    async function getTokenDecimals(token: any, userAddress: string) {
      if (!token.contract) return 7;
      try {
        const result = await _contractInvoke({
          contractAddress: token.contract,
          method: 'decimals',
          args: [],
          publicKey: userAddress,
        });
        console.log(`[getUserTokenBalances] Decimals for ${token.code}:`, result);
        return result ?? 7;
      } catch {
        return 7;
      }
    }

    // 3. For each token, fetch balance and decimals
    const balances = await Promise.all(tokens.map(async (token: any) => {
      const balance = await getTokenBalance(token, userAddress);
      const decimals = await getTokenDecimals(token, userAddress);
      let formattedBalance = balance;
      if (balance !== null && decimals !== undefined && !isNaN(Number(balance))) {
        formattedBalance = (Number(balance) / Math.pow(10, decimals)).toLocaleString(undefined, { maximumFractionDigits: 7 });
      }
      return {
        contract: token.contract,
        code: token.code,
        issuer: token.issuer,
        name: token.name,
        domain: token.domain,
        balance,
        decimals,
        formattedBalance,
      };
    }));

    console.log('[getUserTokenBalances] Final formatted balances:', balances);
    return balances;
  }

  /**
   * Fetch and decode all events for a pool (optionally filter by user address).
   * Decodes topics and data for swap, add_liquidity, remove_liquidity, transfer, rewards, etc.
   * @param poolId The pool contract address
   * @param startLedger The starting ledger number
   * @param limit Max number of events to fetch (default 1000)
   * @param userAddress (optional) Only return events involving this user
   * @returns Array of decoded events
   */
  async getDecodedPoolEvents(poolId: string, startLedger: number, limit: number = 1000, userAddress?: string) {
    const { xdr } = stellarSdk;
    const server = new stellarSdk.rpc.Server(rpcUrl, { allowHttp: true });
    // Topics for all relevant events
    const topics = [
      [xdr.ScVal.scvSymbol('swap').toXDR('base64'), '*', '*'],
      [xdr.ScVal.scvSymbol('add_liquidity').toXDR('base64'), '*', '*'],
      [xdr.ScVal.scvSymbol('remove_liquidity').toXDR('base64'), '*', '*'],
      [xdr.ScVal.scvSymbol('transfer').toXDR('base64'), '*', '*'],
      [xdr.ScVal.scvSymbol('reward').toXDR('base64'), '*', '*'],
    ];
    const resp = await server._getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [poolId],
          topics,
        },
      ],
      limit,
    });
    // Decode events
    const decoded = resp.events.map((ev: any) => {
      // Decode event type from topics[0]
      let eventType = '';
      if (ev.topics && ev.topics[0]) {
        const topicBuf = Buffer.from(ev.topics[0], 'base64');
        eventType = topicBuf.toString('utf8').replace(/\0+$/, '');
      }
      // Try to decode user address from topics[1] or data
      let involvedUser = null;
      if (ev.topics && ev.topics[1]) {
        try {
          const addrBuf = Buffer.from(ev.topics[1], 'base64');
          // Try to decode as Stellar address (may be in XDR format)
          if (addrBuf.length === 32) {
            involvedUser = stellarSdk.StrKey.encodeEd25519PublicKey(addrBuf);
          } else {
            involvedUser = addrBuf.toString('utf8').replace(/\0+$/, '');
          }
        } catch {}
      }
      // Try to decode value/data
      let value = ev.value;
      if (ev.value && typeof ev.value === 'string') {
        try {
          value = JSON.parse(ev.value);
        } catch {}
      }
      return {
        ...ev,
        eventType,
        involvedUser,
        value,
      };
    });
    // Optionally filter by user address
    if (userAddress) {
      return decoded.filter((ev:any) => ev.involvedUser === userAddress || (ev.value && (ev.value.user === userAddress || ev.value.to === userAddress || ev.value.from === userAddress)));
    }
    return decoded;
  }

  /**
   * Fetch pool events (swap, add_liquidity, remove_liquidity) from Soroban RPC for a given pool contract.
   * @param poolId The pool contract address
   * @param startLedger The starting ledger number
   * @param limit Max number of events to fetch (default 1000)
   * @returns Array of events
   */
  async getPoolEvents(poolId: string, startLedger: number, limit: number = 1000) {
    const { xdr } = stellarSdk;
    const server = new stellarSdk.rpc.Server(rpcUrl, { allowHttp: true });
    // Soroswap AMM event topics (as symbols)
    const topics = [
      [xdr.ScVal.scvSymbol('swap').toXDR('base64'), '*', '*'],
      [xdr.ScVal.scvSymbol('add_liquidity').toXDR('base64'), '*', '*'],
      [xdr.ScVal.scvSymbol('remove_liquidity').toXDR('base64'), '*', '*'],
    ];
    const resp = await server._getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [poolId],
          topics,
        },
      ],
      limit,
    });
    // Return raw events for now; parsing/aggregation will be handled by the caller
    return resp.events;
  }
} 