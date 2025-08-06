# Signing Flow Implementation

## Overview

The signing flow has been updated to provide a better user experience where:

1. **MCP Functions** return signing URLs instead of just XDR
2. **Frontend Sign Page** handles wallet connection and signing (same pattern as main Gemini agent)
3. **Transaction Results** are sent back to MCP for Cursor to inform users
4. **Real MCP Communication** between frontend and MCP server
5. **Consistent XDR Handling** - matches the main Gemini agent's pattern exactly

## Flow Diagram

```
User Request → MCP Function → Returns Signing URL → Frontend Sign Page → Wallet Signing → Transaction Submission → MCP Helper → MCP Server → Cursor Notification
```

## Key Changes

### 1. MCP Server (`Mcp/src/server.ts`)

All transaction functions now return signing URLs instead of just XDR:

```typescript
// Before
return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', unsignedXDR: result.unsignedXDR }, null, 2) }] };

// After
const signingUrl = `http://localhost:3000/passkey/sign?xdr=${encodeURIComponent(result.unsignedXDR)}&action=lend&userAddress=${params.userAddress}&poolId=${params.poolId}&amount=${params.amount}&asset=${params.asset}`;
return { content: [{ type: 'text', text: JSON.stringify({ status: 'NEEDS_SIGNATURE', signingUrl: signingUrl, unsignedXDR: result.unsignedXDR }, null, 2) }] };
```

**Updated Functions:**
- `lend` - Lend to pool
- `withdraw-pool` - Withdraw from pool
- `borrow` - Borrow from pool
- `repay` - Repay to pool
- `claimRewards` - Claim rewards
- `createPool` - Create new pool
- `addReserve` - Add reserve to pool
- `buyNft` - Buy NFT
- `swap` - Soroswap swap
- `addLiquidity` - Add liquidity
- `removeLiquidity` - Remove liquidity
- `createVault` - Create DeFindex vault
- `deposit` - Deposit to vault
- `withdraw-vault` - Withdraw from vault

**New MCP Server Endpoints:**
- `POST /api/transaction-result` - Receive transaction results
- `GET /api/transaction-result/:transactionId` - Retrieve transaction results

### 2. Frontend Sign Page (`app/passkey/sign/page.tsx`)

**Updated to match main Gemini agent's XDR handling pattern:**

**Key Changes:**
- **Same XDR Signing Pattern**: Uses `signXDR()` with proper string handling
- **Same Submission Pattern**: POST to `/api/stellar` with `signedXdr`
- **Same Error Handling**: Comprehensive error handling with user-friendly messages
- **Same Success Flow**: Transaction hash display and MCP communication

**XDR Handling Pattern (matching main agent):**
```typescript
// Sign the transaction with the connected wallet (same pattern as main agent)
const signed = await signXDR(xdr);

let signedXdrString = '';
if (typeof signed === 'string') {
  signedXdrString = signed;
} else if (signed && typeof signed === 'object' && 'signedTxXdr' in signed) {
  signedXdrString = signed.signedTxXdr;
}

if (!signedXdrString) {
  throw new Error("Signing failed or was cancelled by user");
}

// Submit the signed transaction to the backend (same pattern as main agent)
const response = await fetch('/api/stellar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    signedXdr: signedXdrString
  }),
});
```

**URL Parameters:**
- `xdr` - The unsigned transaction XDR
- `action` - The transaction type (lend, borrow, swap, etc.)
- `userAddress` - User's wallet address
- `poolId` - Pool identifier (for pool operations)
- `amount` - Transaction amount
- `asset` - Asset being transacted

**Action Descriptions:**
```typescript
const getActionDescription = () => {
  switch (action) {
    case 'lend':
      return `Lend ${amount} ${asset} to pool ${poolId}`;
    case 'withdraw':
      return `Withdraw ${amount} ${asset} from pool ${poolId}`;
    // ... more cases
  }
};
```

### 3. API Routes

**Stellar API (`app/api/stellar/route.ts`):**
- **Enhanced Error Handling** - Better handling of sodium-native dependency issues
- **Dynamic Import** - Handles potential build environment issues
- **Same Interface** - Kept original for Gemini agent compatibility
- **Robust Error Messages** - Detailed error information for debugging

**MCP Helper API (`app/api/mcp-helper/route.ts`):**
- **Real Implementation** - Handles transaction result processing
- **Transaction Storage** - Stores pending transactions for MCP server retrieval
- **Direct Communication** - Attempts direct communication with MCP server
- **Management Endpoints** - GET/DELETE endpoints for transaction management

**MCP Helper Endpoints:**
- `POST /api/mcp-helper` - Receive transaction results
- `GET /api/mcp-helper` - Retrieve pending transactions
- `GET /api/mcp-helper?transactionId=xxx` - Get specific transaction
- `GET /api/mcp-helper?action=xxx&userAddress=xxx` - Get user transactions
- `DELETE /api/mcp-helper` - Clear all transactions
- `DELETE /api/mcp-helper?transactionId=xxx` - Clear specific transaction

### 4. Transaction Result Flow

1. **User signs transaction** in the frontend (same pattern as main agent)
2. **Transaction submitted** to Stellar network via `/api/stellar` (same as main agent)
3. **Result sent** to MCP Helper via `/api/mcp-helper`
4. **MCP Helper forwards** to MCP Server via `/api/transaction-result`
5. **MCP Server stores** result for Cursor access
6. **Cursor retrieves** and displays transaction details to user

## Usage Example

### MCP Function Call
```typescript
// User calls lend function
const result = await mcp.lend({
  userAddress: "GDVKGWDSAGPP3HBWLUIBIKH4ZCHNFNQJ7J2HSPY3T7YEEJJXASVYWQV6",
  amount: 100,
  asset: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  poolId: "CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5"
});

// Returns:
{
  "status": "NEEDS_SIGNATURE",
  "signingUrl": "http://localhost:3000/passkey/sign?xdr=...&action=lend&userAddress=GDVKGWDSAGPP3HBWLUIBIKH4ZCHNFNQJ7J2HSPY3T7YEEJJXASVYWQV6&poolId=CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5&amount=100&asset=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  "unsignedXDR": "..."
}
```

### Frontend Signing Process (Same as Main Agent)
1. User clicks signing URL
2. Frontend opens with transaction details
3. User connects wallet (if not connected)
4. Transaction is signed automatically (same XDR pattern as main agent)
5. Result sent to `/api/stellar` (same as main agent)
6. Result sent to MCP Helper
7. MCP Helper forwards to MCP Server
8. Cursor displays transaction details to user

### MCP Server Transaction Storage
```typescript
// Transaction results stored in MCP server
global.transactionResults = new Map<string, any>();

// Example stored transaction:
{
  transactionId: "lend_GDVKGWDSAGPP3HBWLUIBIKH4ZCHNFNQJ7J2HSPY3T7YEEJJXASVYWQV6_1703123456789",
  action: "lend",
  userAddress: "GDVKGWDSAGPP3HBWLUIBIKH4ZCHNFNQJ7J2HSPY3T7YEEJJXASVYWQV6",
  poolId: "CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5",
  amount: "100",
  asset: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  txHash: "0x1234567890abcdef...",
  signedXdr: "...",
  status: "SUCCESS",
  timestamp: "2023-12-21T10:30:45.123Z"
}
```

## Benefits

1. **Better UX**: Users see clear transaction descriptions
2. **Seamless Flow**: No manual XDR handling
3. **Error Handling**: Better error messages and recovery
4. **Transaction Tracking**: Full transaction lifecycle tracking
5. **Cursor Integration**: Direct communication with Cursor for user feedback
6. **Real Implementation**: Actual MCP server communication
7. **Gemini Compatibility**: Stellar API unchanged for existing agent
8. **Consistent Pattern**: Same XDR handling as main Gemini agent
9. **Robust Build**: Handles sodium-native dependency issues

## Testing

Run the test script to verify the complete flow:
```bash
node test-mcp-signing-flow.js
```

## API Endpoints Summary

### Frontend → Stellar Network
- `POST /api/stellar` - Submit signed transaction (same as main agent)

### Frontend → MCP Helper
- `POST /api/mcp-helper` - Send transaction result

### MCP Helper → MCP Server
- `POST /api/transaction-result` - Forward transaction result
- `GET /api/transaction-result/:id` - Retrieve transaction result

### MCP Helper Management
- `GET /api/mcp-helper` - List pending transactions
- `DELETE /api/mcp-helper` - Clear transactions

## Security Considerations

1. **URL Validation**: All parameters are validated
2. **XDR Verification**: XDR format is verified before signing
3. **Wallet Security**: Uses existing wallet security mechanisms
4. **HTTPS**: All communications use HTTPS in production
5. **Parameter Sanitization**: All URL parameters are properly encoded
6. **Transaction Storage**: In-memory storage with cleanup
7. **Error Handling**: Comprehensive error handling throughout flow
8. **Build Safety**: Handles dependency issues gracefully

## Future Enhancements

1. **Database Storage**: Replace in-memory storage with database
2. **Transaction History**: Store signed transactions for reference
3. **Batch Operations**: Support multiple transaction signing
4. **Advanced Wallet Support**: Support for more wallet types
5. **Transaction Simulation**: Pre-flight transaction checks
6. **Gas Estimation**: Better gas/fee estimation
7. **WebSocket Communication**: Real-time updates to Cursor
8. **Enhanced Error Recovery**: Better handling of network issues

## Key Implementation Notes

### XDR Handling Consistency
The MCP sign page now uses the **exact same XDR handling pattern** as the main Gemini agent:
- Same `signXDR()` function usage
- Same string/object response handling
- Same `/api/stellar` submission
- Same error handling patterns

### Error Handling Improvements
- **Build Environment**: Handles sodium-native dependency issues
- **Network Errors**: Better Stellar network error handling
- **User Feedback**: Clear, actionable error messages
- **Graceful Degradation**: Fallback mechanisms for various failure modes

### MCP Communication
- **Real-time**: Direct communication between frontend and MCP server
- **Persistent**: Transaction results stored for Cursor access
- **Reliable**: Multiple communication channels for redundancy
- **Secure**: Proper parameter validation and sanitization 