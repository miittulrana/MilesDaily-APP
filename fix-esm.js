const fs = require('fs');
const path = require('path');

// Path to the problematic file
const filePath = path.resolve('./node_modules/@supabase/postgrest-js/dist/module/index.js');

if (fs.existsSync(filePath)) {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace ESM imports with CJS
  content = content.replace(/from ['"](.+?)\.mjs['"]/g, 'from "$1.js"');
  
  // Write the file back
  fs.writeFileSync(filePath, content);
  
  console.log('Fixed ESM imports in postgrest-js');
}