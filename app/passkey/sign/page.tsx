"use client"
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Shield, Zap, Fingerprint, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  connect as kitConnect,
  disconnect as kitDisconnect,
  getPublicKey as kitGetPublicKey,
  signTransaction as kitSignTransaction,
} from '@/lib/stellar-wallets-kit';
import { Transaction, Networks } from '@stellar/stellar-sdk'; // Add stellar-sdk for debugging
import {Suspense} from 'react';

function PasskeySignInner() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  // Wallet state
  const [walletConnected, setWalletConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string>('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string>('');
  
  // Transaction state
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [transactionDebug, setTransactionDebug] = useState<string>(''); // For debugging
  
  // Transaction parameters
  const xdr = searchParams.get('xdr');
  const action = searchParams.get('action');
  const userAddress = searchParams.get('userAddress');
  const poolId = searchParams.get('poolId');
  const amount = searchParams.get('amount');
  const asset = searchParams.get('asset');
  console.log(xdr);
  console.log(action);
  console.log(userAddress);
  console.log(poolId);
  console.log(amount);
  console.log(asset);

  // Check wallet connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      setWalletLoading(true);
      try {
        const pk = await kitGetPublicKey();
        if (pk) {
          setPublicKey(pk);
          setWalletConnected(true);
          console.log('[Wallet] Already connected:', pk);
        }
      } catch (error: any) {
        setWalletError(error.message || 'Failed to check wallet connection');
      } finally {
        setWalletLoading(false);
      }
    };
    
    checkConnection();
  }, []);

  // Debug transaction XDR
  useEffect(() => {
    if (xdr) {
      try {
        // Attempt to parse the XDR to see if it's valid
        const transaction = new Transaction(xdr, Networks.TESTNET);
        const debugInfo = `
          Source: ${transaction.source}
          Sequence: ${transaction.sequence}
          Fee: ${transaction.fee} stroops
          Operations: ${transaction.operations.length}
          TimeBounds: ${transaction.timeBounds ? 
            `${transaction.timeBounds.minTime}-${transaction.timeBounds.maxTime}` : 'None'}
        `;
        setTransactionDebug(debugInfo);
      } catch (e) {
        setTransactionDebug('⚠️ Failed to parse transaction XDR');
      }
    }
  }, [xdr]);

  // Connect to wallet
  const handleConnectWallet = async () => {
    setWalletLoading(true);
    setWalletError('');
    
    try {
      await kitConnect(async () => {
        const pk = await kitGetPublicKey();
        if (pk) {
          setPublicKey(pk);
          setWalletConnected(true);
          toast({
            title: "Wallet Connected",
            description: `Connected to wallet: ${pk.slice(0, 8)}...`
          });
        } else {
          throw new Error('Failed to get public key after connection');
        }
      });
    } catch (error: any) {
      setWalletError(error.message || 'Failed to connect wallet');
      toast({
        title: "Connection Failed",
        description: error.message || 'Could not connect to wallet',
        variant: 'destructive'
      });
    } finally {
      setWalletLoading(false);
    }
  };

  // Disconnect wallet
  const handleDisconnectWallet = async () => {
    setWalletLoading(true);
    try {
      await kitDisconnect(async () => {
        setWalletConnected(false);
        setPublicKey('');
        toast({
          title: "Wallet Disconnected",
          description: "You've disconnected your wallet",
        });
      });
    } catch (error: any) {
      setWalletError(error.message || 'Failed to disconnect');
    } finally {
      setWalletLoading(false);
    }
  };

  // Sign and submit transaction
  const signTransactionWithWallet = async () => {
    if (!walletConnected || !publicKey || !xdr) {
      setError('Please connect your wallet and ensure transaction data is available');
      return;
    }

    setSigning(true);
    setError('');

    try {
      console.log('[Wallet] Starting transaction signing for:', publicKey);
      
      // Debug: Log transaction details
      try {
        const transaction = new Transaction(xdr, Networks.TESTNET);
        console.debug('[Wallet] Transaction details:', {
          source: transaction.source,
          sequence: transaction.sequence,
          fee: transaction.fee,
          operations: transaction.operations.map(op => op.type),
          timeBounds: transaction.timeBounds
        });
      } catch (e) {
        console.warn('[Wallet] Could not parse transaction for debugging');
      }

      // Sign the transaction with the connected wallet
      const passphrase = 'Test SDF Network ; September 2015'; // TESTNET
      console.log('[Wallet] Signing with passphrase:', passphrase);
      
      const signed = await kitSignTransaction(xdr, { networkPassphrase: passphrase });
      
      let signedXdrString = '';
      if (typeof signed === 'string' && signed) {
        signedXdrString = signed;
      } else if (signed && typeof signed === 'object' && 'signedTxXdr' in signed && signed.signedTxXdr) {
        signedXdrString = signed.signedTxXdr;
      }
      
      if (!signedXdrString) {
        throw new Error("Signing failed. Please check your wallet connection and try again.");
      }
      
      console.log('[Wallet] Transaction signed successfully');
      
      // Submit the signed transaction to backend
      console.log('[Wallet] Submitting transaction to backend...');
      
      const response = await fetch('/api/stellar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          signedXdr: signedXdrString
        }),
      });
      
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to submit transaction to backend');
      }
      
      const result = await response.json();
      console.log('[Wallet] Stellar submit response:', result);
      
      if (result.success && result.hash) {
        setTxHash(result.hash);
        setSigned(true);
        
        toast({ 
          title: "🎉 Transaction Successful!", 
          description: `Hash: ${result.hash.slice(0, 16)}...` 
        });

        // Notify parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'SIGNED_TRANSACTION',
            signedXdr: signedXdrString,
            txHash: result.hash,
            action: action,
            userAddress: userAddress,
            poolId: poolId,
            amount: amount,
            asset: asset
          }, '*');
        }

        // Send to MCP helper
        try {
          await fetch('/api/mcp-helper', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              signedXdr: signedXdrString,
              txHash: result.hash,
              action: action,
              userAddress: userAddress,
              poolId: poolId,
              amount: amount,
              asset: asset
            }),
          });
        } catch (error) {
          console.error('[Wallet] Failed to send result to MCP helper:', error);
        }

      } else {
        throw new Error(result.error || 'Transaction failed on network');
      }

    } catch (error: any) {
      console.error('[Wallet] Error signing transaction:', error);
      
      // Enhanced error messages with specific handling for Freighter
      let errorMessage = error.message || 'Failed to sign transaction';
      
      if (errorMessage.includes('internal error')) {
        errorMessage = 'Freighter encountered an internal error. Please try the following:\n' +
                       '1. Ensure you have the latest version of Freighter\n' +
                       '2. Check your network connection\n' +
                       '3. Try signing again in a few minutes\n' +
                       'If the problem persists, contact Freighter support.';
      } else if (errorMessage.includes('User declined')) {
        errorMessage = 'You declined the transaction in your wallet';
      } else if (errorMessage.includes('cancelled')) {
        errorMessage = 'Transaction signing was cancelled';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Transaction signing timed out. Please try again.';
      }
      
      setError(errorMessage);
      
      toast({ 
        title: "❌ Transaction Failed", 
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSigning(false);
    }
  };

  // Get action description
  const getActionDescription = () => {
    switch (action) {
      case 'lend':
        return `Lend ${amount} ${asset} to pool ${poolId}`;
      case 'withdraw':
        return `Withdraw ${amount} ${asset} from pool ${poolId}`;
      case 'borrow':
        return `Borrow ${amount} ${asset} from pool ${poolId}`;
      case 'repay':
        return `Repay ${amount} ${asset} to pool ${poolId}`;
      case 'claimRewards':
        return `Claim rewards from pool ${poolId}`;
      case 'createPool':
        return `Create new lending pool`;
      case 'addReserve':
        return `Add reserve to pool ${poolId}`;
      case 'buyNft':
        return `Buy NFT`;
      case 'swap':
        return `Swap ${amount} ${asset} on Soroswap`;
      case 'addLiquidity':
        return `Add liquidity to Soroswap pool`;
      case 'removeLiquidity':
        return `Remove liquidity from Soroswap pool`;
      case 'createVault':
        return `Create DeFindex vault`;
      case 'deposit':
        return `Deposit to vault`;
      case 'withdraw-vault':
        return `Withdraw from vault`;
      default:
        return 'Sign transaction';
    }
  };

  // Render transaction details
  const renderTransactionDetails = () => (
    <div className="space-y-2 text-sm">
      <div className="grid grid-cols-3 gap-2">
        <span className="font-medium text-gray-500">Action:</span>
        <span className="col-span-2 font-mono">{action || 'N/A'}</span>
        
        <span className="font-medium text-gray-500">User:</span>
        <span className="col-span-2 font-mono truncate">
          {userAddress || publicKey || 'N/A'}
        </span>
        
        {poolId && (
          <>
            <span className="font-medium text-gray-500">Pool ID:</span>
            <span className="col-span-2 font-mono truncate">{poolId}</span>
          </>
        )}
        
        {amount && asset && (
          <>
            <span className="font-medium text-gray-500">Amount:</span>
            <span className="col-span-2 font-mono">{amount} {asset}</span>
          </>
        )}
      </div>
      
      {xdr && (
        <div className="mt-4 space-y-2">
          <p className="font-medium text-gray-500 mb-1">Transaction XDR:</p>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto font-mono">
            {xdr.slice(0, 80)}...{xdr.slice(-20)}
          </div>
          
          {transactionDebug && (
            <div className="mt-2">
              <p className="font-medium text-gray-500 mb-1">Debug Info:</p>
              <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded text-xs overflow-x-auto">
                <pre>{transactionDebug}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            {getActionDescription()}
          </CardTitle>
          <CardDescription>
            Review and sign this transaction with your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!xdr ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No transaction data found. Please ensure you have a valid transaction to sign.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Wallet Connection */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Wallet Connection
                </h3>
                
                {walletLoading ? (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : walletConnected ? (
                  <div className="flex justify-between items-center">
                    <div className="truncate">
                      <p className="text-sm font-medium">Connected Wallet</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {publicKey}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDisconnectWallet}
                      disabled={walletLoading}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {walletError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{walletError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      onClick={handleConnectWallet}
                      className="w-full"
                      disabled={walletLoading}
                    >
                      {walletLoading ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Transaction Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Transaction Details
                </h3>
                {renderTransactionDetails()}
              </div>
              
              {/* Signing Section */}
              <div className="flex flex-col gap-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
                  </Alert>
                )}
                
                {signing ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Signing transaction with wallet...</span>
                    </div>
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Your wallet should open to sign this transaction. Please approve the transaction.
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : signed ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Transaction signed successfully!</span>
                    </div>
                    {txHash && (
                      <Alert>
                        <Zap className="h-4 w-4" />
                        <AlertDescription>
                          Transaction Hash: 
                          <span className="font-mono ml-2">
                            {txHash.slice(0, 16)}...{txHash.slice(-16)}
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}
                    <div className="text-sm text-gray-600">
                      <p>The signed transaction has been submitted to the Stellar network.</p>
                    </div>
                    <Button 
                      onClick={() => window.close()} 
                      className="w-full"
                      variant="outline"
                    >
                      Close Window
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      onClick={signTransactionWithWallet} 
                      disabled={!walletConnected || signing || walletLoading}
                      className="w-full"
                    >
                      {signing ? 'Signing...' : 'Sign Transaction'}
                    </Button>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        If you encounter issues, try these troubleshooting steps:
                        <ol className="list-decimal pl-5 mt-2 space-y-1">
                          <li>Ensure you have the latest version of Freighter installed</li>
                          <li>Check that your wallet is unlocked</li>
                          <li>Try disconnecting and reconnecting your wallet</li>
                          <li>Verify your network connection</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PasskeySignPage() {
  return (
    <Suspense fallback={<div>...</div>}>
      <PasskeySignInner />
    </Suspense>
  );
}