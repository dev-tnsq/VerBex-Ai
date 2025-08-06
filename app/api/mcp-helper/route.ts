import { NextRequest, NextResponse } from 'next/server';

// Store for pending transactions that need to be reported back to MCP
const pendingTransactions = new Map<string, any>();

export async function POST(req: NextRequest) {
  try {
    const { signedXdr, txHash, action, userAddress, poolId, amount, asset } = await req.json();
    
    if (!signedXdr || !txHash) {
      return NextResponse.json({ error: 'signedXdr and txHash are required' }, { status: 400 });
    }
    
    console.log(`[MCP Helper] Received signed transaction result:`, {
      action,
      userAddress,
      poolId,
      amount,
      asset,
      txHash
    });

    // Create a unique transaction ID for tracking
    const transactionId = `${action}_${userAddress}_${Date.now()}`;
    
    // Store the transaction result for MCP server to retrieve
    pendingTransactions.set(transactionId, {
      action,
      userAddress,
      poolId,
      amount,
      asset,
      txHash,
      signedXdr,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS'
    });

    // Try to send the result directly to the MCP server
    try {
      const mcpResponse = await fetch('http://localhost:3001/api/transaction-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          action,
          userAddress,
          poolId,
          amount,
          asset,
          txHash,
          signedXdr,
          status: 'SUCCESS'
        }),
      });

      if (mcpResponse.ok) {
        console.log('[MCP Helper] Successfully sent result to MCP server');
      } else {
        console.log('[MCP Helper] MCP server not available, result stored for later retrieval');
      }
    } catch (error: any) {
      console.log('[MCP Helper] Could not reach MCP server, result stored for later retrieval:', error.message);
    }

    // Clean up old transactions (older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [id, transaction] of pendingTransactions.entries()) {
      if (new Date(transaction.timestamp).getTime() < oneHourAgo) {
        pendingTransactions.delete(id);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Transaction result received and processed',
      transactionId,
      data: {
        action,
        userAddress,
        poolId,
        amount,
        asset,
        txHash,
        signedXdr
      }
    });
    
  } catch (error: any) {
    console.error('MCP Helper error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process transaction result'
    }, { status: 400 });
  }
}

// Endpoint for MCP server to retrieve pending transaction results
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');
    const action = searchParams.get('action');
    const userAddress = searchParams.get('userAddress');

    if (transactionId) {
      // Return specific transaction result
      const transaction = pendingTransactions.get(transactionId);
      if (transaction) {
        pendingTransactions.delete(transactionId); // Remove after retrieval
        return NextResponse.json({
          success: true,
          transaction
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Transaction not found'
        }, { status: 404 });
      }
    } else if (action && userAddress) {
      // Return all pending transactions for a specific action and user
      const userTransactions = Array.from(pendingTransactions.values())
        .filter(tx => tx.action === action && tx.userAddress === userAddress);
      
      return NextResponse.json({
        success: true,
        transactions: userTransactions
      });
    } else {
      // Return all pending transactions
      return NextResponse.json({
        success: true,
        status: 'MCP Helper endpoint is running',
        timestamp: new Date().toISOString(),
        pendingTransactions: Array.from(pendingTransactions.values())
      });
    }
  } catch (error: any) {
    console.error('MCP Helper GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to retrieve transaction results'
    }, { status: 400 });
  }
}

// Endpoint for MCP server to clear old transactions
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');

    if (transactionId) {
      const deleted = pendingTransactions.delete(transactionId);
      return NextResponse.json({
        success: true,
        deleted,
        message: deleted ? 'Transaction deleted' : 'Transaction not found'
      });
    } else {
      // Clear all transactions
      const count = pendingTransactions.size;
      pendingTransactions.clear();
      return NextResponse.json({
        success: true,
        message: `Cleared ${count} transactions`
      });
    }
  } catch (error: any) {
    console.error('MCP Helper DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete transactions'
    }, { status: 400 });
  }
}
