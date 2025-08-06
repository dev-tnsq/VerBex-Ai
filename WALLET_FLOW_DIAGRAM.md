# Wallet Flow Diagram

## Complete Passkey Kit Wallet Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1: WALLET CREATION                            │
│                              (One-time per user)                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   USER      │    │     MCP     │    │  FRONTEND   │    │ PASSKEY KIT │
│             │    │             │    │             │    │             │
│ 1. Connect  │───▶│ 2. enroll   │───▶│ 3. Open     │───▶│ 4. Create   │
│   Stellar   │    │  Passkey    │    │  enrollment │    │  WebAuthn   │
│   wallet    │    │             │    │   URL       │    │  credential │
│             │    │             │    │             │    │             │
│ GABC...     │    │ Returns URL │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   USER      │    │     MCP     │    │  FRONTEND   │    │ PASSKEY KIT │
│             │    │             │    │             │    │             │
│ 5. Provide  │◀───│ 6. Receive  │◀───│ 7. Send     │◀───│ 8. Deploy   │
│ biometric   │    │  credential │    │  credential │    │  smart      │
│ auth        │    │             │    │             │    │  contract   │
│             │    │             │    │             │    │             │
│ Face ID/    │    │ Store wallet│    │ WebAuthn    │    │ Contract ID │
│ Touch ID    │    │  data       │    │  response   │    │ CCXA7FAX... │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 2: TRANSACTION EXECUTION                         │
│                              (Every transaction)                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   USER      │    │     MCP     │    │  FRONTEND   │    │ PASSKEY KIT │
│             │    │             │    │             │    │             │
│ 9. Call     │───▶│ 10. Check   │───▶│ 11. Create  │───▶│ 12. Create  │
│  DeFi       │    │  for wallet │    │  unsigned   │    │  unsigned   │
│  action     │    │             │    │  transaction│    │  XDR        │
│             │    │             │    │             │    │             │
│ lend/borrow │    │ Passkey Kit │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   USER      │    │     MCP     │    │  FRONTEND   │    │ PASSKEY KIT │
│             │    │             │    │             │    │             │
│ 13. Open    │◀───│ 14. Return  │◀───│ 15. Show    │◀───│ 16. Return  │
│ signing     │    │  signing    │    │  signing    │    │  unsigned   │
│ URL         │    │  URL        │    │  page       │    │  XDR        │
│             │    │             │    │             │    │             │
│ Biometric   │    │             │    │             │    │             │
│ prompt      │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   USER      │    │     MCP     │    │  FRONTEND   │    │ PASSKEY KIT │
│             │    │             │    │             │    │             │
│ 17. Provide │───▶│ 18. Receive │───▶│ 19. Send    │───▶│ 20. Sign    │
│ biometric   │    │  assertion  │    │  assertion  │    │  with smart │
│ auth        │    │             │    │             │    │  contract   │
│             │    │             │    │             │    │             │
│ Face ID/    │    │             │    │ WebAuthn    │    │ Verify &    │
│ Touch ID    │    │             │    │  assertion  │    │  sign       │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   USER      │    │     MCP     │    │  FRONTEND   │    │ PASSKEY KIT │
│             │    │             │    │             │    │             │
│ 21. Get     │◀───│ 22. Return  │◀───│ 23. Submit  │◀───│ 24. Submit  │
│ success     │    │  success    │    │  to network │    │  signed     │
│ message     │    │  message    │    │             │    │  transaction│
│             │    │             │    │             │    │             │
│ Transaction │    │ Transaction │    │             │    │             │
│ hash        │    │ hash        │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Detailed Flow Explanation

### **Phase 1: Wallet Creation (One-time)**

#### **Steps 1-4: Enrollment Initiation**
1. **User**: Connects Stellar wallet (Freighter, etc.) → Gets address `GABC...`
2. **MCP**: User calls `enrollPasskey` → Returns enrollment URL
3. **Frontend**: User opens URL → Shows enrollment page
4. **Passkey Kit**: Creates WebAuthn credential → Deploys smart contract

#### **Steps 5-8: Smart Contract Deployment**
5. **User**: Provides biometric authentication (Face ID/Touch ID)
6. **MCP**: Receives WebAuthn credential → Stores wallet data
7. **Frontend**: Sends credential to MCP
8. **Passkey Kit**: Deploys smart contract → Returns contract ID `CCXA7FAX...`

### **Phase 2: Transaction Execution (Every Transaction)**

#### **Steps 9-12: Transaction Creation**
9. **User**: Calls DeFi action (lend, borrow, swap, etc.)
10. **MCP**: Checks for Passkey Kit wallet → Creates unsigned transaction
11. **Frontend**: Shows transaction details
12. **Passkey Kit**: Creates unsigned XDR transaction

#### **Steps 13-16: Biometric Authentication**
13. **User**: Opens signing URL → Provides biometric authentication
14. **MCP**: Returns signing URL with unsigned XDR
15. **Frontend**: Shows signing page with biometric prompt
16. **Passkey Kit**: Returns unsigned XDR for signing

#### **Steps 17-20: Smart Contract Signing**
17. **User**: Provides biometric authentication (Face ID/Touch ID)
18. **MCP**: Receives WebAuthn assertion
19. **Frontend**: Sends assertion to MCP
20. **Passkey Kit**: Smart contract verifies signature → Signs transaction

#### **Steps 21-24: Transaction Submission**
21. **User**: Gets success message with transaction hash
22. **MCP**: Returns success message
23. **Frontend**: Submits signed transaction to network
24. **Passkey Kit**: Submits signed transaction to Stellar network

## Key Components

### **1. Smart Contract Wallet**
```rust
// Deployed on-chain by Passkey Kit
pub struct PasskeyWallet {
    pub owner: Address,           // User's Stellar address
    pub credential_id: Bytes,     // WebAuthn credential ID
    pub public_key: Bytes,        // WebAuthn public key
}
```

### **2. Storage Structure**
```typescript
// MCP stores wallet information
const passkeyStore = new Map<string, {
  walletAddress: string,      // GABC...
  credentialId: string,       // WebAuthn credential ID
  contractId: string,         // CCXA7FAX...
  publicKey: string,          // WebAuthn public key
  registeredAt: number,       // Timestamp
  userIdentifier: string      // User identifier
}>();
```

### **3. Enrollment Routes (Required)**
```typescript
// Start enrollment
POST /api/passkey/start-enrollment
{
  "userAddress": "GABC123456789012345678901234567890123456789012345678901234567890"
}

// Complete enrollment
POST /api/passkey/complete-enrollment
{
  "walletAddress": "GABC...",
  "credential": { /* WebAuthn credential */ },
  "challenge": "challenge_123"
}
```

## Why Enrollment Routes Are Still Needed

### **1. WebAuthn Credential Creation**
- Users need to create biometric credentials
- Frontend needs to handle WebAuthn API
- Passkey Kit needs credentials to deploy smart contracts

### **2. Smart Contract Deployment**
- Passkey Kit needs WebAuthn credentials to deploy smart contracts
- Smart contracts store public keys and credential IDs
- On-chain verification requires credential data

### **3. User Experience**
- Users need to set up biometric authentication
- Frontend provides user-friendly interface
- Links existing Stellar wallets to Passkey Kit

## Benefits

### **For Users**
- **No Private Keys**: Never handle seed phrases or private keys
- **Biometric Security**: Face ID/Touch ID/fingerprint authentication
- **Cross-Device**: Works across devices with WebAuthn sync
- **User-Friendly**: Simple, intuitive authentication

### **For MCP**
- **Headless Environment**: Works without direct wallet access
- **Smart Contract Security**: On-chain verification and signing
- **Production Ready**: Scalable for real-world use
- **Enhanced Security**: No private keys exposed

The enrollment routes are **essential** for the Passkey Kit system to work properly, as they handle the WebAuthn credential creation and smart contract deployment process. 