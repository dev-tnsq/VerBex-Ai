const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  try {
    console.log('🧪 Testing Gemini API...');
    const apiKey = 'AIzaSyCQv0G5ey2Au5BQvA8humSAdq0W_dNdE2U';
    console.log('API Key:', apiKey ? 'Found' : 'Missing');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log('📤 Sending test message...');
    
    const prompt = `You are Gemini AI, a conversational DeFi assistant. If user wants DeFi operations, return JSON with:
{
  "functionCall": true,
  "operation": {
    "protocol": "Blend",
    "action": "actionName",
    "parameters": { ... }
  },
  "message": "explanation"
}

User message: "Get pool details for CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log('✅ Success! Response:', text);
    console.log('📏 Response length:', text.length);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGemini();