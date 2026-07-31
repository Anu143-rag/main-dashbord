const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');
content = content.replace(/localStorage\.removeItem\('token'\);\n/g, "");
content = content.replace(
  "  const handleLogout = () => {",
  "  const handleLogout = async () => {\n    await fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);"
);
content = content.replace(/\s*'Authorization': `Bearer \${localStorage\.getItem\('token'\)}`/g, "");
content = content.replace(/,\n\s*headers: \{\n\s*\}/g, "");
content = content.replace(/,\n\s*headers: \{\s*\}/g, "");
fs.writeFileSync('src/components/Header.tsx', content);
