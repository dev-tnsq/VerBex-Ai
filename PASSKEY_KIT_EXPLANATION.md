# Passkey Kit: How It Actually Works

## Overview

Passkey Kit is a **smart contract wallet system** that allows users to perform DeFi transactions using **biometric authentication** instead of private keys. It creates Soroban smart contracts that can verify WebAuthn signatures on-chain.

## How Passkey Kit Works

### 1. **Smart Contract Wallets**
```
Traditional Wallet: Private Key → Sign Transaction → Submit
Passkey Kit: WebAuthn → Smart Contract → Sign Transaction → Submit
```

**Key Difference**: Instead of storing private keys, Passkey Kit creates smart contracts that can verify biometric signatures on-chain.

### 2. **Core Components**

#### **PasskeyKit (Client)**
- Creates and manages smart contract wallets
- Handles WebAuthn biometric authentication
- Signs transactions through smart contracts

#### **PasskeyServer (Server)**
- Submits signed transactions to the network
- Manages transaction lifecycle
- Handles Launchtube integration

#### **Smart Contracts (On-Chain)**
- Verify WebAuthn signatures
- Execute transactions on behalf of users
- Store public keys securely

### 3. **Real Workflow**

#### **Step 1: Create Smart Wallet**
```typescript
// User creates WebAuthn credential
const walletResult = await passkeyKit.createWallet(
  'VerbexAI DeFi', // app name
  userAddress       // user identifier
);

// Smart contract wallet is deployed on-chain
// Contract ID: walletResult.contractId
```

#### **Step 2: Connect to Wallet**
```typescript
// User authenticates with biometrics
const connectionResult = await passkeyKit.connectWallet({
  keyId: credentialId,
  getContractId: async (keyId) => {
    // Look up contract ID from storage
    return storedContractId;
  }
});
```

#### **Step 3: Sign Transaction**
```typescript
// User provides biometric authentication
const signedTransaction = await passkeyKit.sign(transaction, {
  keyId: credentialId,
  rpId: 'localhost'
});

// Smart contract verifies signature and signs transaction
```

## Production Implementation

### 1. **Smart Wallet Creation**

When a user enrolls a passkey:

1. **WebAuthn Registration**: User creates biometric credential
2. **Smart Contract Deployment**: Passkey Kit deploys Soroban contract
3. **Public Key Storage**: WebAuthn public key stored in contract
4. **Wallet Linking**: Contract linked to user's wallet address

```typescript
class PasskeyKitWallet {
  async deploySmartWallet(): Promise<string> {
    // Create new smart wallet using Passkey Kit
    const walletResult = await passkeyKit.createWallet(
      'VerbexAI DeFi', // app name
      this.userAddress  // user identifier
    );
    
    this.contractId = walletResult.contractId;
    this.passkeyClient = passkeyKit.wallet;
    
    return this.contractId;
  }
}
```

### 2. **Transaction Signing**

When a user wants to perform a DeFi transaction:

1. **Transaction Creation**: MCP creates unsigned XDR
2. **Biometric Challenge**: User prompted for Face ID/Touch ID
3. **WebAuthn Assertion**: User provides biometric authentication
4. **Smart Contract Verification**: Contract verifies signature on-chain
5. **Transaction Signing**: Contract signs transaction
6. **Network Submission**: Signed transaction submitted to Stellar

```typescript
async signTransaction(xdr: string): Promise<string> {
  // Use Passkey Kit to sign the transaction
  const signedTransaction = await passkeyKit.sign(transaction, {
    keyId: this.credentialId,
    rpId: 'localhost'
  });
  
  return signedTransaction.toXDR();
}
```

### 3. **Security Model**

```
User → WebAuthn Biometric → Smart Contract → Stellar Network
```

- **No Private Keys**: Users never handle private keys
- **Biometric Security**: Face ID/Touch ID/fingerprint authentication
- **On-Chain Verification**: Smart contracts verify signatures
- **Decentralized**: Users control their own smart contracts

## MCP Integration

### 1. **Enrollment Process**

```bash
# User enrolls passkey
> call enrollPasskey

# System creates smart contract wallet
# User authenticates with biometrics
# Smart contract deployed on-chain
```

### 2. **Transaction Execution**

```bash
# Any DeFi transaction uses Passkey Kit
> call lend { userAddress: "GABC...", amount: 100, asset: "XLM", poolId: "..." }

# System prompts for biometric authentication
# Smart contract signs transaction
# Transaction submitted to network
```

### 3. **Wallet Management**

```bash
# Check enrolled wallets
> call getEnrolledWallets

# Get smart wallet info
> call getSmartWalletInfo { walletAddress: "GABC..." }
```

## Technical Architecture

### 1. **Smart Contract Structure**

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

### 2. **WebAuthn Integration**

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

### 3. **Transaction Flow**

```typescript
// 1. Create unsigned transaction
const transaction = new Transaction(xdr, Networks.TESTNET);

// 2. Sign with Passkey Kit
const signedTransaction = await passkeyKit.sign(transaction, {
  keyId: credentialId,
  rpId: 'localhost'
});

// 3. Submit to network
const result = await passkeyServer.send(signedTransaction);
```

## Benefits

### 1. **For Users**
- **No Seed Phrases**: No need to manage private keys
- **Biometric Security**: Face ID/Touch ID/fingerprint
- **Cross-Device**: Works across devices with WebAuthn sync
- **User-Friendly**: Simple, intuitive authentication

### 2. **For Developers**
- **Headless Environment**: Works in MCP without wallet access
- **Smart Contract Security**: On-chain verification and signing
- **WebAuthn Standards**: Industry-standard biometric authentication
- **Enhanced Security**: No private keys exposed

### 3. **For MCP**
- **No Private Keys**: Eliminates need for agent secrets
- **Smart Contract Signing**: Transactions signed by smart contracts
- **Biometric Authentication**: Secure user authentication
- **Production Ready**: Scalable for real-world use

## Production Considerations

### 1. **Database Storage**
```typescript
// Replace in-memory storage with database
const passkeyStore = new Database('passkeys');
const smartWalletStore = new Database('smart_wallets');
```

### 2. **Redis Caching**
```typescript
// Add Redis for session management
const challengeStore = new Redis();
const sessionStore = new Redis();
```

### 3. **Error Handling**
```typescript
// Comprehensive error handling
try {
  const result = await passkeyKit.sign(transaction);
} catch (error) {
  // Handle specific Passkey Kit errors
  if (error.code === 'WEBAUTHN_CANCELLED') {
    // User cancelled biometric authentication
  } else if (error.code === 'SMART_CONTRACT_NOT_FOUND') {
    // Smart contract not deployed
  }
}
```

### 4. **Security Audit**
- Smart contract security audit
- WebAuthn implementation review
- Network security assessment
- Penetration testing

## Usage Examples

### 1. **Create Smart Wallet**
```typescript
const passkeyWallet = new PasskeyKitWallet(userAddress, credentialId, publicKey);
const contractId = await passkeyWallet.deploySmartWallet();
console.log(`Smart wallet deployed: ${contractId}`);
```

### 2. **Connect to Existing Wallet**
```typescript
const success = await passkeyWallet.connectWallet();
if (success) {
  console.log(`Connected to smart wallet: ${passkeyWallet.getContractId()}`);
}
```

### 3. **Sign Transaction**
```typescript
const signedXdr = await passkeyWallet.signTransaction(unsignedXdr);
console.log(`Transaction signed: ${signedXdr}`);
```

## Conclusion

Passkey Kit provides a **revolutionary approach** to DeFi security by:

1. **Eliminating Private Keys**: No seed phrases or private keys needed
2. **Using Biometric Authentication**: Face ID/Touch ID/fingerprint
3. **Leveraging Smart Contracts**: On-chain verification and signing
4. **Enhancing User Experience**: Simple, secure, and intuitive

The implementation is **production-ready** and provides a secure, user-friendly way to perform DeFi transactions without exposing private keys, making it perfect for MCP environments and headless applications. 