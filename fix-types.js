const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lib', 'dynamic-execution-engine.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all type declarations
content = content.replace(/type: "object"/g, 'type: Type.OBJECT');
content = content.replace(/type: "string"/g, 'type: Type.STRING');
content = content.replace(/type: "number"/g, 'type: Type.NUMBER');
content = content.replace(/type: "array"/g, 'type: Type.ARRAY');
content = content.replace(/type: "boolean"/g, 'type: Type.BOOLEAN');

fs.writeFileSync(filePath, content);
console.log('✅ Fixed all type declarations in dynamic-execution-engine.ts');