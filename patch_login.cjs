const fs = require('fs');
const content = fs.readFileSync('src/pages/Login.tsx', 'utf8');
const patched = content.replace("localStorage.setItem('token', data.token);", "");
fs.writeFileSync('src/pages/Login.tsx', patched);
