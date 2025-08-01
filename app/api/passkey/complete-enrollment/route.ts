import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { walletAddress, credential, challenge } = body;
    
    if (!walletAddress || !credential || !challenge) {
      return NextResponse.json({ error: 'walletAddress, credential, and challenge are required' }, { status: 400 });
    }
    
    // Forward the request to the MCP server
    const mcpResponse = await fetch('http://localhost:3001/api/passkey/complete-enrollment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await mcpResponse.json();
    
    if (!mcpResponse.ok) {
      return NextResponse.json({ error: data.error || 'Failed to complete enrollment' }, { status: mcpResponse.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error completing enrollment:', error);
    return NextResponse.json({ error: 'Failed to complete enrollment' }, { status: 500 });
  }
}
