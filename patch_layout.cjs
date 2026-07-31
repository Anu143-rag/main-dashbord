const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');
content = content.replace("localStorage.getItem('token')", "localStorage.getItem('user')");
content = content.replace("const token =", "const user =");
content = content.replace("if (!token) {", "if (!user) {");
fs.writeFileSync('src/components/Layout.tsx', content);
