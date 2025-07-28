#!/usr/bin/env node

/**
 * Integration test for Verbex AI Blend Protocol Assistant
 * This script tests the core components without starting the full Next.js server
 */

console.log('🧪 Testing Verbex AI Integration...\n');

// Test 1: Import and initialize BlendService
try {
  const { BlendService } = require('./BlendMcp/src/services/blend.service.ts');
  console.log('✅ BlendService import successful');
  
  const blendService = new BlendService();
  console.log('✅ BlendService initialization successful');
} catch (error) {
  console.log('❌ BlendService test failed:', error.message);
}

// Test 2: Test Gemini integration (without API call)
try {
  const { getGeminiSystemPrompt } = require('./lib/gemini-intent.ts');
  const prompt = getGeminiSystemPrompt();
  
  if (prompt && prompt.length > 100) {
    console.log('✅ Gemini system prompt generation successful');
  } else {
    console.log('❌ Gemini system prompt seems invalid');
  }
} catch (error) {
  console.log('❌ Gemini integration test failed:', error.message);
}

// Test 3: Check environment variables
try {
  require('dotenv').config();
  
  const requiredEnvVars = [
    'GOOGLE_GENERATIVE_AI_API_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    console.log('✅ Environment variables configured');
  } else {
    console.log('⚠️  Missing environment variables:', missingVars.join(', '));
    console.log('   Please check your .env file');
  }
} catch (error) {
  console.log('❌ Environment test failed:', error.message);
}

// Test 4: Test core API route structure
try {
  const fs = require('fs');
  const path = require('path');
  
  const apiRoutes = [
    './app/api/protocol/route.ts',
    './app/api/stellar/submit.ts'
  ];
  
  const missingRoutes = apiRoutes.filter(route => !fs.existsSync(path.resolve(route)));
  
  if (missingRoutes.length === 0) {
    console.log('✅ API routes structure complete');
  } else {
    console.log('❌ Missing API routes:', missingRoutes.join(', '));
  }
} catch (error) {
  console.log('❌ API structure test failed:', error.message);
}

console.log('\n🎉 Integration test complete!');
console.log('\nNext steps:');
console.log('1. Make sure you have a valid GOOGLE_GENERATIVE_AI_API_KEY in your .env file');
console.log('2. Run `npm run dev` to start the development server');
console.log('3. Open http://localhost:3000 and test the chat interface');
console.log('4. Try: "What are the current network fees?" to test without wallet connection');