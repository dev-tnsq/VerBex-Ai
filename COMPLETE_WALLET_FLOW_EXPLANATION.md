# Complete Wallet Flow Explanation

## Overview

This document explains the complete wallet flow in our MCP system, how Passkey Kit creates smart contract wallets, and whether enrollment routes are still needed.

## How Passkey Kit Creates Wallets

### 1. **Passkey Kit Wallet Creation Process**

Passkey Kit **automatically creates smart contract wallets** when users enroll. Here's how it works:

#### **Step 1: User Enrollment**
```typescript
// When user calls enrollPasskey
const walletResult = await passkeyKit.createWallet(
  'VerbexAI DeFi', // app name
  userAddress       // user identifier
);
```

#### **Step 2: Smart Contract Deployment**
```typescript
// Passkey Kit automatically:
// 1. Creates WebAuthn credential
// 2. Deploys Soroban smart contract
// 3. Links credential to smart contract
// 4. Returns contract ID
const contractId = walletResult.contractId; // e.g., "CCXA7FAXWNUEAGMJCLXICBJTRAVYFYWQ4TICHKDVWSXMGOXDC3VQV52K"
```

#### **Step 3: Wallet Storage**
```typescript
// Store wallet information
passkeyStore.set(userAddress, {
  credentialId: credential.id,
  contractId: contractId,
  walletAddress: userAddress,
  // ... other data
});
```

## Complete Wallet Flow

### **Phase 1: Wallet Creation (One-time)**

#### **1. User Initiates Enrollment**
```bash
# In Cursor/Claude MCP
> call enrollPasskey { walletAddress: "GABC123456789012345678901234567890123456789012345678901234567890" }
```

#### **2. MCP Response**
```json
{
  "enrollmentUrl": "http://localhost:3000/passkey/enroll?walletAddress=GABC...",
  "sessionId": "abc123...",
  "message": "Create a new Passkey Kit smart contract wallet with biometric authentication.",
  "instructions": [
    "1. Open the enrollment URL in your browser",
    "2. Connect your Stellar wallet (Freighter, etc.)",
    "3. Click 'Create Passkey' to set up biometric authentication",
    "4. Complete the passkey enrollment process",
    "5. A Passkey Kit smart contract wallet will be deployed automatically",
    "6. Return here and run getEnrolledWallets to confirm your enrollment"
  ]
}
```

#### **3. Frontend Enrollment Process**
```typescript
// User opens enrollment URL
// Frontend calls WebAuthn API
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

#### **4. Smart Contract Deployment**
```typescript
// Passkey Kit automatically deploys smart contract
const walletResult = await passkeyKit.createWallet(
  'VerbexAI DeFi',
  userAddress
);

// Smart contract is now deployed on-chain
// Contract ID: walletResult.contractId
// User can now use this smart contract for transactions
```

### **Phase 2: Transaction Execution (Every Transaction)**

#### **1. User Initiates DeFi Action**
```bash
# User wants to lend assets
> call lend { userAddress: "GABC...", amount: 100, asset: "XLM", poolId: "..." }
```

#### **2. MCP Checks for Passkey Kit Wallet**
```typescript
// MCP checks if user has enrolled Passkey Kit wallet
const passkeyData = passkeyStore.get(userAddress);
if (!passkeyData) {
  return {
    status: 'ERROR',
    error: 'No Passkey Kit wallet found. Please run enrollPasskey first.',
    enrollmentUrl: `${FRONTEND_BASE_URL}/passkey/enroll?walletAddress=${userAddress}`
  };
}
```

#### **3. Transaction Creation**
```typescript
// MCP creates unsigned transaction
const result = await blendService.lend(params);
// Returns unsigned XDR transaction
```

#### **4. Biometric Authentication**
```typescript
// MCP returns signing URL
return {
  status: 'NEEDS_SIGNATURE',
  unsignedXDR: result.unsignedXDR,
  signingUrl: `${FRONTEND_BASE_URL}/passkey/sign?walletAddress=${userAddress}&xdr=${result.unsignedXDR}`,
  message: 'Please authenticate with your Passkey Kit smart wallet'
};
```

#### **5. Smart Contract Signing**
```typescript
// User authenticates with biometrics
// Passkey Kit signs transaction through smart contract
const signedTransaction = await passkeyKit.sign(transaction, {
  keyId: credentialId,
  rpId: 'localhost'
});

// Smart contract verifies WebAuthn signature and signs transaction
```

#### **6. Transaction Submission**
```typescript
// Submit signed transaction to network
const result = await passkeyServer.send(signedTransaction);
// Transaction is now on-chain
```

## Are Enrollment Routes Still Needed?

### **YES, Enrollment Routes Are Still Needed**

Here's why:

#### **1. WebAuthn Credential Creation**
```typescript
// Enrollment route is needed for WebAuthn credential creation
app.post('/api/passkey/start-enrollment', (req, res) => {
  // Creates WebAuthn challenge
  // Returns credential creation options
});

app.post('/api/passkey/complete-enrollment', async (req, res) => {
  // Receives WebAuthn credential
  // Calls Passkey Kit to create smart wallet
  const walletResult = await passkeyKit.createWallet(
    'VerbexAI DeFi',
    userAddress
  );
});
```

#### **2. Smart Contract Deployment**
```typescript
// Passkey Kit needs the WebAuthn credential to deploy smart contract
const passkeyWallet = new PasskeyKitWallet(
  userAddress,
  credential.id,        // From WebAuthn
  credential.response.attestationObject
);

// Deploy smart wallet contract
const contractId = await passkeyWallet.deploySmartWallet();
```

#### **3. User Experience**
- **Frontend Interface**: Users need a way to create WebAuthn credentials
- **Biometric Setup**: Users need to set up Face ID/Touch ID/fingerprint
- **Wallet Linking**: Connect existing Stellar wallet to Passkey Kit

## Complete MCP Workflow

### **1. Initial Setup (One-time per user)**

```bash
# User connects their Stellar wallet (Freighter, etc.)
# Gets wallet address: GABC123456789012345678901234567890123456789012345678901234567890

# User enrolls Passkey Kit wallet
> call enrollPasskey { walletAddress: "GABC123456789012345678901234567890123456789012345678901234567890" }

# MCP returns enrollment URL
# User opens URL in browser
# User creates WebAuthn credential (Face ID/Touch ID/fingerprint)
# Passkey Kit deploys smart contract wallet
# User's wallet is now ready for biometric transactions
```

### **2. DeFi Operations (Every transaction)**

```bash
# User wants to lend assets
> call lend { userAddress: "GABC...", amount: 100, asset: "XLM", poolId: "..." }

# MCP checks for Passkey Kit wallet
# MCP creates unsigned transaction
# MCP returns signing URL

# User opens signing URL
# User authenticates with biometrics
# Passkey Kit smart contract signs transaction
# Transaction submitted to network
# User gets transaction hash
```

### **3. Other DeFi Operations**

```bash
# Borrow assets
> call borrow { userAddress: "GABC...", amount: 50, asset: "USDC", poolId: "..." }

# Swap assets
> call swap { userAddress: "GABC...", fromAsset: "XLM", toAsset: "USDC", amount: 100 }

# Add liquidity
> call addLiquidity { userAddress: "GABC...", tokenA: "XLM", tokenB: "USDC", amountA: 100, amountB: 200 }
```

## Technical Architecture

### **1. Smart Contract Wallet Structure**

```rust
// Soroban smart contract deployed by Passkey Kit
pub struct PasskeyWallet {
    pub owner: Address,           // User's wallet address
    pub credential_id: Bytes,     // WebAuthn credential ID
    pub public_key: Bytes,        // WebAuthn public key
}

impl PasskeyWallet {
    // Verify WebAuthn signature
    pub fn verify_signature(&self, signature: Bytes, challenge: Bytes) -> bool;
    
    // Sign transaction if signature is valid
    pub fn sign_transaction(&self, transaction: Bytes) -> Bytes;
}
```

### **2. Data Flow**

```
User Action → MCP → Passkey Kit → Smart Contract → Stellar Network
     ↓           ↓         ↓            ↓              ↓
Biometric   Create    Deploy      Verify &      Submit
Auth        XDR       Contract    Sign         Transaction
```

### **3. Storage Structure**

```typescript
// In-memory storage (production: database)
const passkeyStore = new Map<string, {
  walletAddress: string,      // User's Stellar address
  credentialId: string,       // WebAuthn credential ID
  contractId: string,         // Smart contract address
  publicKey: string,          // WebAuthn public key
  registeredAt: number,       // Timestamp
  userIdentifier: string      // User identifier
}>();

const smartWalletStore = new Map<string, PasskeyKitWallet>();
```

## Key Differences from Traditional Wallets

### **Traditional Wallet Flow**
```
User → Private Key → Sign Transaction → Submit
```

### **Passkey Kit Flow**
```
User → WebAuthn Biometric → Smart Contract → Sign Transaction → Submit
```

### **Benefits**
1. **No Private Keys**: Users never handle private keys
2. **Biometric Security**: Face ID/Touch ID/fingerprint
3. **Smart Contract Security**: On-chain verification
4. **User-Friendly**: Simple, intuitive authentication

## Enrollment Route Details

### **Why Enrollment Routes Are Still Needed**

#### **1. WebAuthn Integration**
```typescript
// Frontend needs to create WebAuthn credential
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

#### **2. Passkey Kit Integration**
```typescript
// Passkey Kit needs WebAuthn credential to deploy smart contract
const walletResult = await passkeyKit.createWallet(
  'VerbexAI DeFi', // app name
  userAddress       // user identifier
);
```

#### **3. User Experience**
- **Biometric Setup**: Users need to set up Face ID/Touch ID
- **Wallet Connection**: Link existing Stellar wallet
- **Smart Contract Deployment**: Deploy smart contract wallet

### **Enrollment Route Flow**

```typescript
// 1. Start enrollment
POST /api/passkey/start-enrollment
{
  "userAddress": "GABC123456789012345678901234567890123456789012345678901234567890"
}

// 2. Complete enrollment
POST /api/passkey/complete-enrollment
{
  "walletAddress": "GABC123456789012345678901234567890123456789012345678901234567890",
  "credential": {
    "id": "credential_id_123",
    "response": {
      "attestationObject": "...",
      "clientDataJSON": "..."
    }
  },
  "challenge": "challenge_123"
}
```

## Conclusion

### **Enrollment Routes Are Essential Because:**

1. **WebAuthn Credential Creation**: Users need to create biometric credentials
2. **Smart Contract Deployment**: Passkey Kit needs credentials to deploy smart contracts
3. **User Experience**: Users need a way to set up biometric authentication
4. **Wallet Linking**: Connect existing Stellar wallets to Passkey Kit

### **The Complete Flow:**

1. **Enrollment**: User creates WebAuthn credential → Passkey Kit deploys smart contract
2. **Transaction**: User authenticates with biometrics → Smart contract signs transaction
3. **Submission**: Signed transaction submitted to Stellar network

### **Benefits for MCP:**

- **No Private Keys**: Eliminates need for agent secrets
- **Biometric Security**: Face ID/Touch ID/fingerprint authentication
- **Smart Contract Security**: On-chain verification and signing
- **Production Ready**: Scalable for real-world use

The enrollment routes are **absolutely necessary** for the Passkey Kit system to work properly, as they handle the WebAuthn credential creation and smart contract deployment process. 