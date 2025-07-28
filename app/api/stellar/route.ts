import { NextRequest, NextResponse } from 'next/server';
import { Networks, Transaction, Horizon, TransactionBuilder, xdr } from '@stellar/stellar-sdk';

export const runtime = 'nodejs';

const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';

export async function POST(req: NextRequest) {
  const { signedXdr } = await req.json();
  if (!signedXdr) {
    return NextResponse.json({ error: 'Missing signedXdr' }, { status: 400 });
  }
  try {
    const server = new Horizon.Server(HORIZON_URL, { allowHttp: true });

    // Defensive: check if XDR is valid
    try {
      xdr.TransactionEnvelope.fromXDR(signedXdr, 'base64');
    } catch (e: any) {
      return NextResponse.json({ error: 'Invalid XDR: not a TransactionEnvelope', details: e.message }, { status: 400 });
    }
    const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    
    // Submit transaction
    let submitResult;
    try {
      submitResult = await server.submitTransaction(tx);
    } catch (e: any) {
      // Submission error (bad signature, insufficient fee, etc)
      return NextResponse.json({
        error: e.message || 'Stellar submit error',
        success: false,
        details: e.response?.data || e.stack
      }, { status: 500 });
    }

    // Poll for confirmation
    const hash = submitResult.hash;
    let confirmed = false;
    let txResult = null;
    const pollTimeout = 60000; // 60 seconds
    const pollStart = Date.now();
    while (!confirmed && (Date.now() - pollStart) < pollTimeout) {
      try {
        txResult = await server.transactions().transaction(hash).call();
        confirmed = true;
      } catch (e) {
        // Not found yet, wait and retry
        await new Promise(res => setTimeout(res, 1000));
      }
    }

    if (!confirmed || !txResult) {
      return NextResponse.json({
        error: `Transaction confirmation timed out or failed. Hash: ${hash}`,
        success: false,
        hash
      }, { status: 504 });
    }

    // Return success and transaction result
    return NextResponse.json({ 
      hash,
      success: true,
      ledger: txResult.ledger,
      result: txResult
    });
  } catch (e: any) {
    console.error('[Stellar Submit] Error:', e);
    return NextResponse.json({ 
      error: e.message || 'Stellar submit error', 
      success: false,
      details: e.response?.data || e.stack 
    }, { status: 500 });
  }
} 