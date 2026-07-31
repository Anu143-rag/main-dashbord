const fs = require('fs');
const files = [
  'src/pages/Dashboard.tsx',
  'src/pages/Devices.tsx',
  'src/pages/Admins.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\s*'Authorization': `Bearer \${localStorage\.getItem\('token'\)}`/g, "");
  // cleanup empty headers objects
  content = content.replace(/,\n\s*headers: \{\n\s*\}/g, "");
  content = content.replace(/,\n\s*headers: \{\s*\}/g, "");
  content = content.replace(/headers: \{\s*\},?/g, "");
  fs.writeFileSync(file, content);
});
