# Passkey Kit Smart Wallet Implementation

## Overview

This document describes the implementation of Passkey Kit smart contract wallets in the Verbex AI MCP server, enabling secure DeFi transactions without exposing private keys.

## Architecture

### Passkey Kit Smart Wallet System

The MCP server implements a Passkey Kit smart contract wallet system that:

1. **Deploys Smart Contracts**: Creates Soroban smart contracts for each user
2. **WebAuthn Integration**: Uses biometric authentication via WebAuthn
3. **On-Chain Signing**: Signs transactions through smart contracts
4. **No Private Keys**: Eliminates the need for seed phrases or private keys

### Security Model

```
User → WebAuthn Biometric → Smart Contract → Stellar Network
```

1. **Biometric Authentication**: User authenticates with Face ID/Touch ID/fingerprint
2. **Smart Contract Verification**: Smart contract verifies the WebAuthn signature
3. **Transaction Signing**: Smart contract signs the transaction on-chain
4. **Network Submission**: Signed transaction is submitted to Stellar network

## Implementation Details

### PasskeyKitWallet Class

```typescript
class PasskeyKitWallet {
  private userAddress: string;
  private credentialId: string;
  private publicKey: string;
  private contractId?: string;

  async deploySmartWallet(): Promise<string>
  async signTransaction(xdr: string): Promise<string>
  getContractId(): string | undefined
}
```

### Smart Contract Deployment

When a user enrolls a passkey:

1. **WebAuthn Registration**: User creates a WebAuthn credential
2. **Smart Contract Deployment**: A Soroban smart contract is deployed
3. **Public Key Storage**: The WebAuthn public key is stored in the contract
4. **Wallet Linking**: The smart contract is linked to the user's wallet address

### Transaction Signing Flow

1. **Transaction Creation**: MCP creates unsigned XDR transaction
2. **Biometric Challenge**: User is prompted for biometric authentication
3. **WebAuthn Assertion**: User provides biometric authentication
4. **Smart Contract Verification**: Smart contract verifies the assertion
5. **Transaction Signing**: Smart contract signs the transaction
6. **Network Submission**: Signed transaction is submitted to Stellar

## MCP Tools

### Enrollment Tools

#### `enrollPasskey`
Creates a new Passkey Kit smart contract wallet.

```json
{
  "enrollmentUrl": "http://localhost:3000/passkey/enroll",
  "sessionId": "abc123...",
  "message": "Create a new Passkey Kit smart contract wallet with biometric authentication.",
  "instructions": [
    "1. Open the enrollment URL in your browser",
    "2. Connect your Stellar wallet (Freighter, etc.)",
    "3. Click 'Create Passkey' to set up biometric authentication",
    "4. Complete the passkey enrollment process",
    "5. A smart contract wallet will be deployed automatically",
    "6. Return here and run getEnrolledWallets to confirm your enrollment"
  ],
  "benefits": [
    "Smart contract wallet with no private keys",
    "Biometric authentication for all transactions",
    "Cross-device synchronization support",
    "Enhanced security with on-chain verification"
  ],
  "features": [
    "WebAuthn biometric authentication",
    "Soroban smart contract wallet",
    "On-chain transaction signing",
    "No seed phrases or private keys"
  ]
}
```

#### `getEnrolledWallets`
Returns all enrolled Passkey Kit smart wallets.

```json
{
  "enrolledWallets": [
    {
      "walletAddress": "GABC...",
      "credentialId": "credential_id_123",
      "contractId": "smart_contract_456",
      "registeredAt": 1703123456789,
      "userIdentifier": "user_GABC1234",
      "type": "Passkey Kit Smart Wallet"
    }
  ],
  "totalEnrolled": 1,
  "message": "Found 1 Passkey Kit smart wallet(s). You can use any of these addresses for transactions.",
  "features": [
    "Smart contract wallets with no private keys",
    "Biometric authentication via WebAuthn",
    "On-chain transaction signing",
    "Enhanced security and convenience"
  ]
}
```

#### `getSmartWalletInfo`
Returns detailed information about a specific smart wallet.

```json
{
  "status": "SUCCESS",
  "walletAddress": "GABC...",
  "contractId": "smart_contract_456",
  "credentialId": "credential_id_123",
  "registeredAt": 1703123456789,
  "userIdentifier": "user_GABC1234",
  "type": "Passkey Kit Smart Wallet",
  "features": [
    "WebAuthn biometric authentication",
    "Soroban smart contract wallet",
    "On-chain transaction signing",
    "No private keys stored"
  ],
  "capabilities": [
    "Sign transactions with biometrics",
    "Execute DeFi operations",
    "Cross-device synchronization",
    "Enhanced security"
  ]
}
```

### Transaction Tools

All existing transaction tools (lend, borrow, swap, etc.) automatically use the Passkey Kit system when:

1. No `privateKey` is provided
2. No `AGENT_SECRET` environment variable is set
3. User has enrolled a Passkey Kit smart wallet

#### Example Transaction Flow

```json
{
  "status": "NEEDS_SIGNATURE",
  "unsignedXDR": "AAAAA...",
  "signingUrl": "http://localhost:3000/passkey/sign?walletAddress=GABC...&xdr=AAAAA...",
  "message": "Please visit the signing URL to authenticate with your passkey and complete the transaction.",
  "instructions": [
    "1. Open the signing URL in your browser",
    "2. The transaction will be automatically signed using your passkey",
    "3. Authenticate with your biometric (Face ID, Touch ID, fingerprint)",
    "4. The transaction will be submitted to Stellar network"
  ]
}
```

## API Endpoints

### Enrollment Endpoints

#### `POST /api/passkey/start-enrollment`
Initiates the passkey enrollment process.

#### `POST /api/passkey/complete-enrollment`
Completes the passkey enrollment and deploys the smart contract.

### Signing Endpoints

#### `POST /api/passkey/start-signing`
Initiates the transaction signing process.

#### `POST /api/passkey/complete-signing`
Completes the transaction signing using the smart contract.

### Information Endpoints

#### `GET /api/passkey/enrolled-wallets`
Returns all enrolled smart wallets.

## Security Features

### Challenge-Response Authentication
- Cryptographically secure random challenges
- Time-bounded (5 minute expiry)
- Single-use (deleted after verification)

### Smart Contract Security
- Public key stored on-chain in smart wallet
- Credential ID stored in MCP for verification
- No private keys stored anywhere

### Transaction Security
- Each transaction requires fresh passkey signature
- XDR integrity verified before signing
- User must explicitly authorize each action

## User Journey

### 1. Enrollment (One-time setup)
```
Cursor/Claude: > call enrollPasskey
MCP: Returns enrollment URL and instructions
User: Opens URL in browser, completes WebAuthn setup
Frontend: Deploys smart contract, stores passkey
MCP: Confirms enrollment, smart wallet ready
```

### 2. Transaction Signing (Every transaction)
```
Cursor/Claude: > call lend { userAddress: "GABC...", amount: 100, asset: "XLM", poolId: "..." }
MCP: Returns signing URL with unsigned XDR
User: Opens URL in browser, authenticates with biometrics
Frontend: Smart contract signs transaction, submits to network
MCP: Returns transaction hash and confirmation
```

## Benefits

### For Users
- **No Seed Phrases**: No need to manage private keys or seed phrases
- **Biometric Security**: Secure authentication with Face ID/Touch ID/fingerprint
- **Cross-Device**: Works across devices with WebAuthn sync
- **User-Friendly**: Simple, intuitive transaction signing

### For Developers
- **Headless Environment**: Works in MCP without wallet access
- **Smart Contract Security**: On-chain verification and signing
- **WebAuthn Standards**: Uses industry-standard biometric authentication
- **Enhanced Security**: No private keys exposed in the system

## Technical Implementation

### Smart Contract Architecture
```rust
// Soroban smart contract for Passkey Kit wallet
pub struct PasskeyWallet {
    pub owner: Address,
    pub credential_id: Bytes,
    pub public_key: Bytes,
}

impl PasskeyWallet {
    pub fn verify_signature(&self, signature: Bytes, challenge: Bytes) -> bool;
    pub fn sign_transaction(&self, transaction: Bytes) -> Bytes;
}
```

### WebAuthn Integration
```typescript
// WebAuthn credential creation
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: new Uint8Array(challenge),
    rp: { name: "VerbexAI DeFi", id: "localhost" },
    user: { id: new TextEncoder().encode(userAddress) },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
    },
  },
});
```

## Future Enhancements

### Planned Features
1. **Multi-Signature Support**: Multiple passkeys for enhanced security
2. **Recovery Mechanisms**: Backup and recovery options
3. **Advanced Smart Contracts**: More sophisticated wallet contracts
4. **Mobile Optimization**: Enhanced mobile device support

### Production Considerations
1. **Database Storage**: Replace in-memory storage with persistent database
2. **Redis Caching**: Add Redis for challenge and session management
3. **Security Audit**: Comprehensive security audit of smart contracts
4. **Performance Optimization**: Optimize transaction signing performance

## Conclusion

The Passkey Kit smart wallet implementation provides a secure, user-friendly way to perform DeFi transactions without exposing private keys. The system leverages WebAuthn biometric authentication and Soroban smart contracts to create a seamless experience for users while maintaining the highest security standards. 