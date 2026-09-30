const fs = require('fs');
let content = fs.readFileSync('.env', 'utf8');

// Remove NEXTAUTH_URL and AUTH_URL completely
const lines = content.split('\n');
const newLines = lines.filter(line => !line.startsWith('NEXTAUTH_URL=') && !line.startsWith('AUTH_URL='));

fs.writeFileSync('.env', newLines.join('\n'), 'utf8');
console.log('Removed NEXTAUTH_URL from .env');
