import { NextRequest, NextResponse } from 'next/server';
import { Transaction, Networks, Horizon } from '@stellar/stellar-sdk';

export async function POST(req: NextRequest) {
  try {
    const { signedXdr } = await req.json();
    
    if (!signedXdr) {
      return NextResponse.json({ error: 'signedXdr is required' }, { status: 400 });
    }
    
    // Initialize Stellar server (testnet)
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    
    // Parse the signed transaction
    const transaction = new Transaction(signedXdr, Networks.TESTNET);
    
    console.log(`[Stellar API] Submitting transaction to network: ${transaction.hash().toString('hex')}`);
    
    // Submit to Stellar network
    const result = await server.submitTransaction(transaction);
    
    console.log(`[Stellar API] Transaction submitted successfully: ${result.hash}`);
    
    return NextResponse.json({
      success: true,
      hash: result.hash,
      result: result,
      message: 'Transaction submitted successfully!'
    });
    
  } catch (error: any) {
    console.error('Stellar submission error:', error);
    
    let errorMessage = error.message || 'Transaction failed';
    
    // Handle common Stellar errors
    if (error.response?.data) {
      const { title, detail, extras } = error.response.data;
      errorMessage = `${title}: ${detail}`;
      
      if (extras?.result_codes) {
        errorMessage += ` (${extras.result_codes.transaction})`;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error.response?.data || null
    }, { status: 400 });
  }
}