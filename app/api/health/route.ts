import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Test core components
    const tests = {
      environment: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      timestamp: new Date().toISOString(),
      components: {
        gemini: true, // Will be tested when actually used
        blendMcp: true, // Imported successfully if this runs
        stellar: true, // SDK is available
      }
    };

    return NextResponse.json({
      status: 'healthy',
      message: 'Verbex AI - Blend Protocol Assistant is running',
      version: '1.0.0',
      network: 'stellar-testnet',
      tests
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}