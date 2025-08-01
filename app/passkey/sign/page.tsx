"use client"

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PasskeySignPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  
  const walletAddress = searchParams.get('walletAddress');
  const xdr = searchParams.get('xdr');

  const signTransaction = async () => {
    if (!walletAddress || !xdr) {
      setError('Missing wallet address or transaction data');
      setStatus('error');
      return;
    }

    setSigning(true);
    try {
      console.log('[Passkey Signing] Starting transaction signing for:', walletAddress);
      console.log('[Passkey Signing] XDR:', xdr.substring(0, 50) + '...');
      
      // Start signing process using Next.js API route
      const startResponse = await fetch('/api/passkey/start-signing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, xdr })
      });

      const startData = await startResponse.json();
      
      if (!startData.success) {
        throw new Error(startData.error || 'Failed to start signing process');
      }

      console.log('[Passkey Signing] Starting WebAuthn assertion...');

      // Create WebAuthn assertion
      const assertionOptions = {
        publicKey: {
          challenge: new Uint8Array(startData.publicKeyCredentialRequestOptions.challenge.data || startData.publicKeyCredentialRequestOptions.challenge),
          allowCredentials: startData.publicKeyCredentialRequestOptions.allowCredentials.map((cred: any) => ({
            id: new Uint8Array(cred.id.data || cred.id),
            type: cred.type,
            transports: cred.transports,
          })),
          userVerification: startData.publicKeyCredentialRequestOptions.userVerification,
          timeout: startData.publicKeyCredentialRequestOptions.timeout,
        }
      };
      
      const assertion = await navigator.credentials.get(assertionOptions) as PublicKeyCredential;
      
      if (!assertion) {
        throw new Error('Signing was cancelled');
      }

      console.log('[Passkey Signing] WebAuthn assertion created');
      
      // Complete signing process using Next.js API route
      const completeResponse = await fetch('/api/passkey/complete-signing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          xdr,
          challenge: startData.challenge,
          assertion: {
            id: assertion.id,
            rawId: Array.from(new Uint8Array(assertion.rawId)),
            response: {
              authenticatorData: Array.from(new Uint8Array((assertion.response as AuthenticatorAssertionResponse).authenticatorData)),
              clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
              signature: Array.from(new Uint8Array((assertion.response as AuthenticatorAssertionResponse).signature)),
            },
            type: assertion.type,
          }
        })
      });

      const completeData = await completeResponse.json();
      
      if (!completeData.success) {
        throw new Error(completeData.error || 'Failed to complete signing');
      }

      setTxHash(completeData.txHash);
      setSigned(true);
      setStatus('success');
      
      toast({
        title: "Success!",
        description: "Transaction signed and submitted successfully!",
      });

    } catch (error: any) {
      console.error('Signing error:', error);
      setError(error.message || 'Failed to sign transaction');
      setStatus('error');
      
      toast({
        title: "Signing Failed",
        description: error.message || 'Failed to sign transaction',
        variant: "destructive"
      });
    } finally {
      setSigning(false);
    }
  };

  // Auto-start signing when page loads
  useEffect(() => {
    if (walletAddress && xdr && status === 'idle') {
      signTransaction();
    }
  }, [walletAddress, xdr, status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🔐 Transaction Signing</CardTitle>
          <CardDescription>
            Sign your DeFi transaction using biometric authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'idle' || signing ? (
            <div className="text-center space-y-4">
              <div className="animate-spin text-4xl">🔄</div>
              <h3 className="text-lg font-semibold">
                {signing ? 'Signing Transaction...' : 'Preparing...'}
              </h3>
              <p className="text-sm text-gray-600">
                {signing 
                  ? 'Please authenticate with your biometric to sign the transaction'
                  : 'Loading transaction details...'
                }
              </p>
              {walletAddress && (
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <p><strong>Wallet:</strong> {walletAddress.substring(0, 8)}...{walletAddress.substring(-8)}</p>
                </div>
              )}
            </div>
          ) : status === 'success' ? (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto text-green-600 w-16 h-16" />
              <h3 className="text-lg font-semibold text-green-800">Transaction Successful!</h3>
              <p className="text-sm text-gray-600">
                Your transaction has been signed and submitted to the Stellar network.
              </p>
              
              {txHash && (
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm font-semibold text-green-800 mb-2">Transaction Hash:</p>
                  <p className="text-xs font-mono bg-white p-2 rounded break-all">{txHash}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(txHash);
                      toast({ title: "Copied!", description: "Transaction hash copied to clipboard" });
                    }}
                  >
                    Copy Hash
                  </Button>
                </div>
              )}
              
              <Button 
                onClick={() => window.close()} 
                className="w-full"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <AlertCircle className="mx-auto text-red-600 w-16 h-16" />
              <h3 className="text-lg font-semibold text-red-800">Signing Failed</h3>
              
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Error:</strong> {error}</p>
                    <p className="text-sm">Please try again or check your connection.</p>
                  </div>
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={signTransaction}
                disabled={signing}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Secured by WebAuthn biometric authentication on Stellar
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
