// Function verification script to ensure execution logic matches declarations
const fs = require('fs');
const path = require('path');

function extractFunctions() {
  const enginePath = path.join(__dirname, 'lib', 'dynamic-execution-engine.ts');
  const content = fs.readFileSync(enginePath, 'utf8');
  
  // Extract functions from blendActions
  const blendActionsMatch = content.match(/const blendActions: Record<string, \(params: any\) => Promise<any>> = \{([\s\S]*?)\};/);
  const blendFunctions = [];
  if (blendActionsMatch) {
    const blendContent = blendActionsMatch[1];
    const functionMatches = blendContent.match(/(\w+):/g);
    if (functionMatches) {
      blendFunctions.push(...functionMatches.map(f => f.replace(':', '')));
    }
  }
  
  // Extract functions from soroswapActions
  const soroswapActionsMatch = content.match(/const soroswapActions: Record<string, \(params: any\) => Promise<any>> = \{([\s\S]*?)\};/);
  const soroswapFunctions = [];
  if (soroswapActionsMatch) {
    const soroswapContent = soroswapActionsMatch[1];
    const functionMatches = soroswapContent.match(/(\w+):/g);
    if (functionMatches) {
      soroswapFunctions.push(...soroswapFunctions.map(f => f.replace(':', '')));
    }
  }
  
  // Extract function declarations
  const declarationsMatch = content.match(/private getFunctionDeclarations\(\) \{[\s\S]*?return \[([\s\S]*?)\];\s*\}/);
  const declaredFunctions = [];
  if (declarationsMatch) {
    const declarationsContent = declarationsMatch[1];
    const nameMatches = declarationsContent.match(/name: "(\w+)"/g);
    if (nameMatches) {
      declaredFunctions.push(...nameMatches.map(m => m.match(/name: "(\w+)"/)[1]));
    }
  }
  
  return {
    blendFunctions,
    soroswapFunctions,
    declaredFunctions,
    totalExecutable: blendFunctions.length + soroswapFunctions.length,
    totalDeclared: declaredFunctions.length
  };
}

function verifyFunctions() {
  console.log('🔍 Verifying Dynamic Execution Engine Functions...\n');
  
  const functions = extractFunctions();
  
  console.log('📊 Function Count Summary:');
  console.log(`  Blend Functions (Executable): ${functions.blendFunctions.length}`);
  console.log(`  Soroswap Functions (Executable): ${functions.soroswapFunctions.length}`);
  console.log(`  Total Executable Functions: ${functions.totalExecutable}`);
  console.log(`  Total Declared Functions: ${functions.totalDeclared}`);
  console.log(`  Match Status: ${functions.totalExecutable === functions.totalDeclared ? '✅ MATCH' : '❌ MISMATCH'}\n`);
  
  // List all functions
  console.log('📋 Blend Protocol Functions:');
  functions.blendFunctions.forEach((fn, i) => {
    console.log(`  ${i + 1}. ${fn}`);
  });
  
  console.log('\n📋 Soroswap Protocol Functions:');
  functions.soroswapFunctions.forEach((fn, i) => {
    console.log(`  ${i + 1}. ${fn}`);
  });
  
  console.log('\n📋 Declared Functions:');
  functions.declaredFunctions.forEach((fn, i) => {
    console.log(`  ${i + 1}. ${fn}`);
  });
  
  // Check for mismatches
  const allExecutable = [...functions.blendFunctions, ...functions.soroswapFunctions];
  const missingInDeclarations = allExecutable.filter(fn => !functions.declaredFunctions.includes(fn));
  const extraInDeclarations = functions.declaredFunctions.filter(fn => !allExecutable.includes(fn));
  
  if (missingInDeclarations.length > 0) {
    console.log('\n❌ Functions missing in declarations:');
    missingInDeclarations.forEach(fn => console.log(`  - ${fn}`));
  }
  
  if (extraInDeclarations.length > 0) {
    console.log('\n⚠️  Functions declared but not executable:');
    extraInDeclarations.forEach(fn => console.log(`  - ${fn}`));
  }
  
  if (missingInDeclarations.length === 0 && extraInDeclarations.length === 0) {
    console.log('\n✅ All functions properly matched between execution logic and declarations!');
  }
  
  return {
    isValid: functions.totalExecutable === functions.totalDeclared && 
             missingInDeclarations.length === 0 && 
             extraInDeclarations.length === 0,
    functions
  };
}

// Run verification if this file is executed directly
if (require.main === module) {
  const result = verifyFunctions();
  process.exit(result.isValid ? 0 : 1);
}

module.exports = { verifyFunctions, extractFunctions };