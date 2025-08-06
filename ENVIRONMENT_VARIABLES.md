# Environment Variables for Passkey Kit Implementation

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

### **Network Configuration**
```env
# Stellar Network Settings
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
WALLET_WASM_HASH=ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90
```

### **Passkey Kit Configuration**
```env
# Passkey Kit Settings
PASSKEY_TIMEOUT_SECONDS=30
CHALLENGE_TIMEOUT_MS=300000
MAX_RETRIES=3
```

### **Launchtube Configuration**
```env
# For transaction submission
LAUNCHTUBE_URL=https://testnet.launchtube.xyz
LAUNCHTUBE_JWT=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4YTA5NDMwMTA5MjE4OGQ3YmNkOTBiNTllNzA1ZmI5ZmE1ZjRjNzgyZTI3NTMyNTQxYzVhZGJmMTQyNzBjNTMyIiwiZXhwIjoxNzUwMzUwNzUyLCJjcmVkaXRzIjoxMDAwMDAwMDAwLCJpYXQiOjE3NDMwOTMxNTJ9.dbx3vhtVu4HIwJBWNFbEFZb50no7Sus8QIDWtfI3dHc
```

### **Mercury Configuration**
```env
# For indexing (optional)
MERCURY_URL=https://test.mercurydata.app
MERCURY_JWT=your_mercury_jwt_here
```

### **App Configuration**
```env
# Application Settings
APP_NAME=VerbexAI DeFi
RP_ID=localhost
```

### **Database Configuration**
```env
# For production (optional for development)
DATABASE_URL=postgresql://user:password@localhost:5432/passkey_kit
REDIS_URL=redis://localhost:6379
```

### **Logging Configuration**
```env
# Logging Settings
LOG_LEVEL=info
ENABLE_DEBUG_LOGS=true
```

### **Security Configuration**
```env
# Fallback signing (optional)
AGENT_SECRET=your_agent_secret_here
```

### **Server Configuration**
```env
# MCP Server Settings
MCP_SERVER_PORT=3001
FRONTEND_BASE_URL=http://localhost:3000
```

### **Next.js Configuration**
```env
# Frontend Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001
```

## How Contract ID Works

### **Automatic Contract Deployment**

When a user enrolls a passkey, **Passkey Kit automatically deploys a smart contract**:

```typescript
// 1. User creates WebAuthn credential
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: new Uint8Array(challenge),
    rp: { name: "VerbexAI DeFi", id: "localhost" },
    user: { id: new TextEncoder().encode(userAddress) },
    // ... other options
  },
});

// 2. Passkey Kit automatically deploys smart contract
const walletResult = await passkeyKit.createWallet(
  'VerbexAI DeFi', // app name
  userAddress       // user identifier
);

// 3. Contract ID is automatically generated
const contractId = walletResult.contractId; 
// Example: "CCXA7FAXWNUEAGMJCLXICBJTRAVYFYWQ4TICHKDVWSXMGOXDC3VQV52K"
```

### **Smart Contract Structure**

The deployed contract contains:
```rust
pub struct PasskeyWallet {
    pub owner: Address,           // User's Stellar address
    pub credential_id: Bytes,     // WebAuthn credential ID
    pub public_key: Bytes,        // WebAuthn public key
}
```

### **You Only Need to Enroll**

**Yes, you only need to enroll!** The contract deployment is automatic:

1. **User enrolls** → WebAuthn credential created
2. **Passkey Kit** → Automatically deploys smart contract
3. **Contract ID** → Automatically generated and stored
4. **Ready to use** → User can now perform transactions

## Response Flow Explanation

### **1. Enrollment Flow**

```typescript
// User calls enrollPasskey
> call enrollPasskey { walletAddress: "GABC..." }

// MCP Response
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

### **2. Transaction Flow**

```typescript
// User calls DeFi action
> call lend { userAddress: "GABC...", amount: 100, asset: "XLM", poolId: "..." }

// MCP Response
{
  "status": "NEEDS_SIGNATURE",
  "unsignedXDR": "AAAAA...",
  "signingUrl": "http://localhost:3000/passkey/sign?walletAddress=GABC...&xdr=AAAAA...",
  "message": "Please authenticate with your Passkey Kit smart wallet"
}
```

### **3. How Response Works**

#### **Enrollment Response**
1. **MCP** → Returns enrollment URL
2. **User** → Opens URL in browser
3. **Frontend** → Creates WebAuthn credential
4. **Passkey Kit** → Deploys smart contract
5. **MCP** → Stores wallet data
6. **User** → Gets success message

#### **Transaction Response**
1. **MCP** → Returns signing URL with unsigned XDR
2. **User** → Opens signing URL
3. **Frontend** → Prompts for biometric authentication
4. **Passkey Kit** → Smart contract signs transaction
5. **MCP** → Returns transaction hash
6. **User** → Gets success message

## Sign Transaction Route

### **Is Sign Transaction Route Needed?**

**YES, the sign transaction route is still needed** because:

#### **1. Biometric Authentication**
```typescript
// Frontend needs to prompt for biometric authentication
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: new Uint8Array(challenge),
    allowCredentials: [/* user's credentials */],
    userVerification: "required",
  },
});
```

#### **2. Smart Contract Signing**
```typescript
// Passkey Kit needs WebAuthn assertion to sign through smart contract
const signedTransaction = await passkeyKit.sign(transaction, {
  keyId: credentialId,
  rpId: 'localhost'
});
```

#### **3. User Experience**
- **Biometric Prompt**: User needs to provide Face ID/Touch ID
- **Transaction Signing**: Smart contract needs to verify and sign
- **Network Submission**: Signed transaction needs to be submitted

### **Sign Transaction Flow**

```typescript
// 1. Start signing
POST /api/passkey/start-signing
{
  "walletAddress": "GABC...",
  "xdr": "AAAAA..."
}

// 2. Complete signing
POST /api/passkey/complete-signing
{
  "walletAddress": "GABC...",
  "xdr": "AAAAA...",
  "challenge": "challenge_123",
  "assertion": {
    "id": "credential_id_123",
    "response": {
      "authenticatorData": [...],
      "clientDataJSON": [...],
      "signature": [...]
    }
  }
}
```

## Complete Implementation

### **1. Environment Setup**

Create `.env.local`:
```env
# Network Configuration
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
WALLET_WASM_HASH=ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90

# Passkey Kit Configuration
PASSKEY_TIMEOUT_SECONDS=30
CHALLENGE_TIMEOUT_MS=300000
MAX_RETRIES=3

# Launchtube Configuration
LAUNCHTUBE_URL=https://testnet.launchtube.xyz
LAUNCHTUBE_JWT=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4YTA5NDMwMTA5MjE4OGQ3YmNkOTBiNTllNzA1ZmI5ZmE1ZjRjNzgyZTI3NTMyNTQxYzVhZGJmMTQyNzBjNTMyIiwiZXhwIjoxNzUwMzUwNzUyLCJjcmVkaXRzIjoxMDAwMDAwMDAwLCJpYXQiOjE3NDMwOTMxNTJ9.dbx3vhtVu4HIwJBWNFbEFZb50no7Sus8QIDWtfI3dHc

# App Configuration
APP_NAME=VerbexAI DeFi
RP_ID=localhost

# Server Configuration
MCP_SERVER_PORT=3001
FRONTEND_BASE_URL=http://localhost:3000

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001
```

### **2. Usage Flow**

```bash
# 1. Enroll Passkey Kit wallet (one-time)
> call enrollPasskey { walletAddress: "GABC123456789012345678901234567890123456789012345678901234567890" }

# 2. Check enrolled wallets
> call getEnrolledWallets

# 3. Perform DeFi transactions (automatic Passkey Kit usage)
> call lend { userAddress: "GABC...", amount: 100, asset: "XLM", poolId: "..." }
> call borrow { userAddress: "GABC...", amount: 50, asset: "USDC", poolId: "..." }
> call swap { userAddress: "GABC...", fromAsset: "XLM", toAsset: "USDC", amount: 100 }
```

### **3. Key Points**

1. **Contract ID**: Automatically generated when user enrolls
2. **Smart Contract**: Automatically deployed by Passkey Kit
3. **Enrollment**: Only needed once per user
4. **Signing Routes**: Still needed for biometric authentication
5. **Response Flow**: MCP → Frontend → Passkey Kit → Smart Contract → Network

The system is **production-ready** and provides secure, user-friendly DeFi transactions without exposing private keys. 