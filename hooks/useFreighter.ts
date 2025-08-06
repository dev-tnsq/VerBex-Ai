import { useState, useCallback, useEffect } from 'react';
import {
  connect as kitConnect,
  disconnect as kitDisconnect,
  getPublicKey as kitGetPublicKey,
  signTransaction as kitSignTransaction,
} from '../lib/stellar-wallets-kit';

export function useFreighter() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // On mount, check if already connected
  useEffect(() => {
    kitGetPublicKey().then(pk => {
      if (pk) {
        setConnected(true);
        setPublicKey(pk);
      }
    });
  }, []);

  // Connect to wallet (opens modal)
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await kitConnect(async () => {
        const pk = await kitGetPublicKey();
        setPublicKey(pk);
        setConnected(!!pk);
      });
    } catch (e: any) {
      setError(e.message || 'Failed to connect to wallet.');
      setConnected(false);
      setPublicKey(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await kitDisconnect(async () => {
        setConnected(false);
        setPublicKey(null);
      });
    } catch (e: any) {
      setError(e.message || 'Failed to disconnect.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign a transaction XDR
  const signXDR = useCallback(
    async (xdr: string, network: 'TESTNET' | 'PUBLIC' = 'TESTNET') => {
      setError(null);
      try {
        if (!connected || !publicKey) {
          throw new Error('Wallet not connected.');
        }
        // StellarWalletsKit expects networkPassphrase, not 'network'/'PUBLIC'
        const passphrase = network === 'PUBLIC'
          ? 'Public Global Stellar Network ; September 2015'
          : 'Test SDF Network ; September 2015';
        const signedXDR = await kitSignTransaction(xdr, { networkPassphrase: passphrase });
        console.log('[useFreighter] signedXDR:', signedXDR);
        return signedXDR;
      } catch (e: any) {
        setError(e.message || 'Failed to sign transaction.');
        return null;
      }
    },
    [connected, publicKey]
  );

  return {
    connected,
    publicKey,
    error,
    loading,
    connect,
    disconnect,
    signXDR,
  };
} 