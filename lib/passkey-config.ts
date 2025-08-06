import { Networks } from '@stellar/stellar-sdk/minimal'

const launchtubeUrl = 'https://testnet.launchtube.xyz'
const launchtubeJwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4YTA5NDMwMTA5MjE4OGQ3YmNkOTBiNTllNzA1ZmI5ZmE1ZjRjNzgyZTI3NTMyNTQxYzVhZGJmMTQyNzBjNTMyIiwiZXhwIjoxNzUwMzUwNzUyLCJjcmVkaXRzIjoxMDAwMDAwMDAwLCJpYXQiOjE3NDMwOTMxNTJ9.dbx3vhtVu4HIwJBWNFbEFZb50no7Sus8QIDWtfI3dHc'

// For now, let's use a simpler approach without the passkey-kit library
// We'll implement basic passkey functionality using WebAuthn API directly

export const passkeyConfig = {
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: Networks.TESTNET,
  walletWasmHash: 'ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90',
  launchtubeUrl,
  launchtubeJwt,
};

// Helper functions for passkey operations
export const createPasskeyCredential = async (userAddress: string) => {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  
  const credentialCreationOptions: CredentialCreationOptions = {
    publicKey: {
      challenge,
      rp: {
        name: "VerbexAI DeFi",
        id: typeof window !== 'undefined' ? window.location.hostname : "localhost",
      },
      user: {
        id: new TextEncoder().encode(userAddress),
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
    },
  };

  return await navigator.credentials.create(credentialCreationOptions);
};

export const signWithPasskey = async (credentialId: string, challenge: Uint8Array) => {
  const credentialRequestOptions: CredentialRequestOptions = {
    publicKey: {
      challenge,
      allowCredentials: [{
        id: new TextEncoder().encode(credentialId),
        type: 'public-key',
        transports: ['internal'],
      }],
      userVerification: 'required',
      timeout: 60000,
    },
  };

  return await navigator.credentials.get(credentialRequestOptions);
};
