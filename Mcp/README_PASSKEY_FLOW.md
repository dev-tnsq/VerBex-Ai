# Verbex AI MCP Passkey Integration

## Overview
This document outlines the complete passkey integration for Verbex AI MCP, enabling users to perform DeFi actions using WebAuthn instead of traditional wallet signing.

## Architecture

### Current Flow (Traditional Wallet)
1. User connects wallet (Freighter/Albedo) → Gets wallet address
2. User runs MCP command → Service returns unsigned XDR  
3. Frontend signs XDR with connected wallet → Submits to network

### New Flow (Passkey Enhanced)
1. User connects wallet (Freighter/Albedo) → Gets wallet address
2. **[One-time]** User enrolls passkey for their wallet address via MCP
3. User runs MCP command → If no privateKey, returns signing URL
4. User opens URL → Signs with passkey → Completes via MCP

## MCP Tools

### Enrollment Tools
- `enrollPasskey` - Generates WebAuthn challenge for existing wallet
- `finishEnroll` - Completes passkey enrollment with credential

### Transaction Tools  
- All existing tools (lend, borrow, swap, etc.) enhanced to support passkey flow
- `finishSign` - Completes transaction with passkey assertion

## Frontend Pages

### /passkey/enroll
- Handles WebAuthn registration
- Parses challenge from URL params
- Returns credential to user for MCP completion

### /passkey/sign  
- Handles WebAuthn authentication
- Parses challenge and XDR from URL params
- Returns assertion to user for MCP completion

## User Journey

### 1. Enrollment (One-time setup)
```
Cursor/Claude: > call enrollPasskey
MCP: Returns { walletAddress: "GABC...", registrationUrl: "http://localhost:3001/passkey/enroll?challenge=..." }
User: Opens URL in browser
Frontend: Calls navigator.credentials.create(), shows credential JSON
Cursor/Claude: > call finishEnroll { walletAddress: "GABC...", credential: {...} }
MCP: Stores passkey, deploys smart wallet contract
```

### 2. Transaction Signing (Every transaction)
```
Cursor/Claude: > call lend { userAddress: "GABC...", amount: 100, asset: "XLM", poolId: "..." }
MCP: Returns { status: "NEEDS_SIGNATURE", signingUrl: "http://localhost:3001/passkey/sign?challenge=...&xdr=..." }
User: Opens URL in browser  
Frontend: Calls navigator.credentials.get(), shows assertion JSON
Cursor/Claude: > call finishSign { walletAddress: "GABC...", xdr: "...", assertion: {...} }
MCP: Verifies signature, submits transaction, returns success
```

## Smart Contract Integration

### Passkey-Enabled Smart Wallet
- Deployed per user during enrollment
- Stores user's passkey public key
- Validates WebAuthn signatures on-chain
- Executes DeFi operations on behalf of user

### Signature Verification
- Convert WebAuthn signature to Stellar signature format
- Verify signature matches enrolled passkey
- Execute transaction through smart wallet

## Security Model

### Challenge Management
- Cryptographically secure random challenges
- Time-bounded (5 minute expiry)
- Single-use (deleted after verification)

### Passkey Storage
- Public key stored on-chain in smart wallet
- Credential ID stored in MCP for verification
- No private keys stored anywhere

### Transaction Security
- Each transaction requires fresh passkey signature
- XDR integrity verified before signing
- User must explicitly authorize each action

## Implementation Status

### Phase 1: Core Passkey Tools ✅
- [x] enrollPasskey MCP tool
- [x] finishEnroll MCP tool  
- [x] finishSign MCP tool
- [x] Challenge storage and verification

### Phase 2: Frontend Pages ⏳
- [ ] /passkey/enroll page
- [ ] /passkey/sign page
- [ ] WebAuthn API integration

### Phase 3: Transaction Integration ⏳
- [ ] Modify existing transaction tools
- [ ] Smart wallet contract deployment
- [ ] Signature verification and submission

### Phase 4: Production Hardening ⏳
- [ ] Error handling and recovery
- [ ] Mobile device compatibility
- [ ] Performance optimization
- [ ] Security audit

## Technical Details

### WebAuthn Configuration
```javascript
// Registration options
{
  challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
  rp: { name: "Verbex AI", id: "localhost" },
  user: { id: userId, name: walletAddress, displayName: walletAddress },
  pubKeyCredParams: [{ alg: -7, type: "public-key" }],
  authenticatorSelection: { userVerification: "required" },
  timeout: 300000
}

// Authentication options  
{
  challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
  allowCredentials: [{ id: credentialId, type: "public-key" }],
  userVerification: "required",
  timeout: 300000
}
```

### Stellar Integration
```javascript
// Smart wallet deployment
const walletContract = new StellarWalletContract();
await walletContract.deploy({
  owner: userAddress,
  passkeyPublicKey: extractedPublicKey,
  credentialId: credential.id
});

// Transaction execution
const signedTx = await walletContract.executeTransaction({
  xdr: unsignedXDR,
  signature: convertedPasskeySignature
});
```

## Error Handling

### Common Issues
- **Passkey not supported**: Fallback to traditional wallet
- **WebAuthn timeout**: Clear instructions to retry
- **Challenge expired**: New enrollment/signing flow
- **Signature verification failed**: Debug signature conversion

### Recovery Mechanisms
- Users can re-enroll passkey if needed
- Traditional wallet signing always available as fallback
- Smart wallet can be updated with new passkeys

## Testing Strategy

### Unit Tests
- WebAuthn challenge generation/verification
- Signature conversion utilities
- Smart contract interaction

### Integration Tests  
- End-to-end enrollment flow
- Complete transaction signing flow
- Error scenarios and edge cases

### User Testing
- Multi-device compatibility
- Different browser support
- User experience validation

## Deployment Considerations

### Environment Variables
```
FRONTEND_BASE_URL=http://localhost:3000
MCP_SERVER_PORT=3001
STELLAR_NETWORK=testnet
PASSKEY_STORAGE_TYPE=redis|memory|database
```

### Production Security
- HTTPS required for WebAuthn
- Secure challenge storage (Redis/DB)
- Rate limiting on enrollment
- Audit logging for all passkey operations

## Future Enhancements

### Multi-Device Support
- Sync passkeys across devices
- Device management interface
- Backup and recovery options

### Advanced Features
- Biometric authentication options
- Transaction spending limits
- Multi-signature passkey setup
- Social recovery mechanisms

## Conclusion

This passkey integration provides a seamless, secure way for users to interact with DeFi protocols without traditional wallet friction, while maintaining full security and user control over their assets.
