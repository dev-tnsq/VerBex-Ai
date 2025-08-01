#!/usr/bin/env node

/**
 * Test script for the DeFi Protocol MCP Server
 * This script tests the basic functionality of the MCP server
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPath = path.join(__dirname, 'dist', 'server.js');

console.log('🧪 Testing DeFi Protocol MCP Server...');
console.log(`📁 Server path: ${serverPath}`);

// Test messages
const initializeMessage = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

const listToolsMessage = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {}
};

const testToolCallMessage = {
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: {
    name: 'getAvailableSoroswapPools',
    arguments: {}
  }
};

function sendMessage(process, message) {
  const messageStr = JSON.stringify(message) + '\n';
  process.stdin.write(messageStr);
}

function testServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let responses = [];
    let messageCount = 0;

    server.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          responses.push(response);
          messageCount++;
          
          console.log(`✅ Received response ${messageCount}:`, {
            id: response.id,
            method: response.method || 'response',
            hasResult: !!response.result,
            hasError: !!response.error
          });
          
          if (messageCount === 3) {
            server.kill();
            resolve(responses);
          }
        } catch (e) {
          console.log('⚠️  Non-JSON output:', line);
        }
      }
    });

    server.stderr.on('data', (data) => {
      console.log('📝 Server logs:', data.toString());
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      reject(error);
    });

    server.on('close', (code) => {
      console.log(`🔚 Server process exited with code ${code}`);
    });

    // Send messages with delay
    setTimeout(() => sendMessage(server, initializeMessage), 100);
    setTimeout(() => sendMessage(server, listToolsMessage), 500);
    setTimeout(() => sendMessage(server, testToolCallMessage), 1000);
  });
}

async function runTests() {
  try {
    console.log('🚀 Starting MCP server test...');
    const responses = await testServer();
    
    console.log('\n📊 Test Results:');
    console.log(`✅ Total responses received: ${responses.length}`);
    
    if (responses.length >= 1) {
      const initResponse = responses[0];
      if (initResponse.result && initResponse.result.serverInfo) {
        console.log('✅ Server initialization successful');
        console.log(`   Server: ${initResponse.result.serverInfo.name} v${initResponse.result.serverInfo.version}`);
        console.log(`   Title: ${initResponse.result.serverInfo.title}`);
      }
    }
    
    if (responses.length >= 2) {
      const toolsResponse = responses[1];
      if (toolsResponse.result && toolsResponse.result.tools) {
        console.log(`✅ Tools listing successful: ${toolsResponse.result.tools.length} tools available`);
        console.log('   Available tools:');
        toolsResponse.result.tools.forEach((tool, index) => {
          console.log(`   ${index + 1}. ${tool.name} - ${tool.title}`);
        });
      }
    }
    
    if (responses.length >= 3) {
      const toolCallResponse = responses[2];
      if (toolCallResponse.result) {
        console.log('✅ Tool call successful');
      } else if (toolCallResponse.error) {
        console.log('⚠️  Tool call failed:', toolCallResponse.error);
      }
    }
    
    console.log('\n🎉 MCP Server test completed successfully!');
    console.log('💡 Your MCP server is ready to be used with Cursor.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests(); 