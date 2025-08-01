"use client"

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useFreighter } from '@/hooks/useFreighter';
import { useToast } from '@/hooks/use-toast';

export default function PasskeyEnrollPage() {
  const { publicKey, connected, connect } = useFreighter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [credential, setCredential] = useState<any>(null);
  
  const challenge = searchParams.get('challenge');
  const walletAddress = searchParams.get('walletAddress');

  const copyCredential = () => {
    if (credential) {
      navigator.clipboard.writeText(JSON.stringify(credential, null, 2));
      toast({
        title: "Copied!",
        description: "Credential copied to clipboard"
      });
    }
  };

  const startEnrollment = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    setEnrolling(true);
    try {
      console.log('[Passkey Enrollment] Starting enrollment for:', publicKey);
      
      // Use the Next.js API route (not direct MCP server)
      const response = await fetch('/api/passkey/start-enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: publicKey })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start enrollment');
      }

      console.log('[Passkey Enrollment] Enrollment data received:', data);

      // Create WebAuthn credential
      const credentialCreationOptions = {
        publicKey: {
          challenge: new Uint8Array(data.publicKeyCredentialCreationOptions.challenge.data || data.publicKeyCredentialCreationOptions.challenge),
          rp: data.publicKeyCredentialCreationOptions.rp,
          user: {
            id: new Uint8Array(data.publicKeyCredentialCreationOptions.user.id.data || data.publicKeyCredentialCreationOptions.user.id),
            name: data.publicKeyCredentialCreationOptions.user.name,
            displayName: data.publicKeyCredentialCreationOptions.user.displayName,
          },
          pubKeyCredParams: data.publicKeyCredentialCreationOptions.pubKeyCredParams,
          authenticatorSelection: data.publicKeyCredentialCreationOptions.authenticatorSelection,
          timeout: data.publicKeyCredentialCreationOptions.timeout,
          attestation: data.publicKeyCredentialCreationOptions.attestation,
        }
      };

      console.log('[Passkey Enrollment] Creating WebAuthn credential...');
      const credential = await navigator.credentials.create(credentialCreationOptions) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Passkey creation was cancelled');
      }

      console.log('[Passkey Enrollment] Passkey created:', credential);

      // Complete enrollment with the Next.js API route
      const completeResponse = await fetch('/api/passkey/complete-enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey,
          challenge: data.challenge,
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              attestationObject: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
            },
            type: credential.type,
          }
        })
      });

      const completeData = await completeResponse.json();
      
      if (!completeData.success) {
        throw new Error(completeData.error || 'Failed to complete enrollment');
      }

      setCredential({ keyId: credential.id, credential });
      setEnrolled(true);
      setStatus('success');
      
      toast({
        title: "Success!",
        description: "Passkey enrolled successfully. You can now use biometric authentication for transactions.",
      });

    } catch (error: any) {
      console.error('Enrollment error:', error);
      setError(error.message || 'Failed to enroll passkey');
      setStatus('error');
      
      toast({
        title: "Enrollment Failed",
        description: error.message || 'Failed to enroll passkey',
        variant: "destructive"
      });
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🔐 Passkey Enrollment</CardTitle>
          <CardDescription>
            Set up biometric authentication for secure DeFi transactions using WebAuthn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!connected ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                First, connect your Stellar wallet to continue
              </p>
              <Button onClick={connect} className="w-full">
                Connect Wallet
              </Button>
            </div>
          ) : enrolled ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-4xl">✅</div>
              <h3 className="text-lg font-semibold">Enrollment Complete!</h3>
              <p className="text-sm text-gray-600">
                Your passkey has been successfully enrolled using WebAuthn. You can now use biometric authentication for all your DeFi transactions.
              </p>
              <Button 
                onClick={() => window.close()} 
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Wallet connected: <span className="font-mono text-xs">{publicKey?.substring(0, 8)}...{publicKey?.substring(-8)}</span>
                </p>
                <div className="space-y-2 text-left text-sm text-gray-600">
                  <p>✨ <strong>WebAuthn Passkey Benefits:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Secure biometric authentication (Face ID, Touch ID, fingerprint)</li>
                    <li>No seed phrases or private keys to manage</li>
                    <li>Browser-native security standards</li>
                    <li>Works across devices with sync</li>
                  </ul>
                </div>
                <Button 
                  onClick={startEnrollment} 
                  disabled={enrolling}
                  className="w-full mt-4"
                >
                  {enrolling ? "Creating passkey..." : "Create Passkey"}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Your device will prompt you to set up biometric authentication
                </p>
              </div>
            </div>
          )}

          {status === 'success' && credential && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription className="text-green-800">
                  Passkey created successfully! Your wallet is now secured with biometric authentication.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="font-semibold">Wallet Details:</h3>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <p><strong>Wallet Address:</strong> {publicKey}</p>
                  <p><strong>Key ID:</strong> {credential.keyId}</p>
                  <p><strong>Provider:</strong> WebAuthn Native</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Next Steps:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>Your passkey is ready to use</li>
                  <li>Return to your MCP session</li>
                  <li>Try any DeFi operation - it will prompt for biometric authentication</li>
                </ol>
              </div>
            </div>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Error:</strong> {error}</p>
                  <p className="text-sm">Please try again or check that your device supports passkeys.</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              This creates a secure passkey using WebAuthn standards for biometric authentication.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
