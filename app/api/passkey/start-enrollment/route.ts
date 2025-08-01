import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userAddress } = await req.json();
    
    if (!userAddress) {
      return NextResponse.json({ error: 'userAddress is required' }, { status: 400 });
    }
    
    // Forward the request to the MCP server
    const mcpResponse = await fetch('http://localhost:3001/api/passkey/start-enrollment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAddress })
    });
    
    const data = await mcpResponse.json();
    
    if (!mcpResponse.ok) {
      return NextResponse.json({ error: data.error || 'Failed to start enrollment' }, { status: mcpResponse.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error starting enrollment:', error);
    return NextResponse.json({ error: 'Failed to start enrollment' }, { status: 500 });
  }
}
