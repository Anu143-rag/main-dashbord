const fs = require('fs');

// server.ts
let serverTs = fs.readFileSync('server.ts', 'utf8');
serverTs = serverTs.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, "");
serverTs = serverTs.replace(/>>>>>>> b396d4b \(🔒 Fix JWT stored in Local Storage vulnerability\)\n/g, "");
fs.writeFileSync('server.ts', serverTs);

// Header.tsx
let headerTsx = fs.readFileSync('src/components/Header.tsx', 'utf8');
headerTsx = headerTsx.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, "");
headerTsx = headerTsx.replace(/>>>>>>> b396d4b \(🔒 Fix JWT stored in Local Storage vulnerability\)\n/g, "");
fs.writeFileSync('src/components/Header.tsx', headerTsx);

// Dashboard.tsx
let dashboardTsx = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
dashboardTsx = dashboardTsx.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, "");
dashboardTsx = dashboardTsx.replace(/>>>>>>> b396d4b \(🔒 Fix JWT stored in Local Storage vulnerability\)\n/g, "");
fs.writeFileSync('src/pages/Dashboard.tsx', dashboardTsx);

// Devices.tsx
let devicesTsx = fs.readFileSync('src/pages/Devices.tsx', 'utf8');
devicesTsx = devicesTsx.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, "");
devicesTsx = devicesTsx.replace(/>>>>>>> b396d4b \(🔒 Fix JWT stored in Local Storage vulnerability\)\n/g, "");
fs.writeFileSync('src/pages/Devices.tsx', devicesTsx);

// Admins.tsx
let adminsTsx = fs.readFileSync('src/pages/Admins.tsx', 'utf8');
adminsTsx = adminsTsx.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, "");
adminsTsx = adminsTsx.replace(/>>>>>>> b396d4b \(🔒 Fix JWT stored in Local Storage vulnerability\)\n/g, "");
fs.writeFileSync('src/pages/Admins.tsx', adminsTsx);

// Schools.tsx
let schoolsTsx = fs.readFileSync('src/pages/Schools.tsx', 'utf8');
schoolsTsx = schoolsTsx.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, "");
schoolsTsx = schoolsTsx.replace(/>>>>>>> b396d4b \(🔒 Fix JWT stored in Local Storage vulnerability\)\n/g, "");
fs.writeFileSync('src/pages/Schools.tsx', schoolsTsx);

// SchoolProfile.tsx
let schoolProfileTsx = fs.readFileSync('src/pages/SchoolProfile.tsx', 'utf8');
schoolProfileTsx = schoolProfileTsx.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, "");
schoolProfileTsx = schoolProfileTsx.replace(/>>>>>>> b396d4b \(🔒 Fix JWT stored in Local Storage vulnerability\)\n/g, "");
fs.writeFileSync('src/pages/SchoolProfile.tsx', schoolProfileTsx);

// Settings.tsx
let settingsTsx = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
settingsTsx = settingsTsx.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, "");
settingsTsx = settingsTsx.replace(/>>>>>>> b396d4b \(🔒 Fix JWT stored in Local Storage vulnerability\)\n/g, "");
fs.writeFileSync('src/pages/Settings.tsx', settingsTsx);
