const fs = require('fs');
let content = fs.readFileSync('src/components/cashdrawer/cashdrawer-client.tsx', 'utf8');

const regexCash = /className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"/g;
const regexExp = /className="text-red-700 border-red-200 bg-red-50 hover:bg-red-100"/g;
const regexHist = /className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"/g;

content = content.replace(regexCash, 'className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 flex-1 sm:flex-none w-full sm:w-auto"');
content = content.replace(regexExp, 'className="text-red-700 border-red-200 bg-red-50 hover:bg-red-100 flex-1 sm:flex-none w-full sm:w-auto"');
content = content.replace(regexHist, 'className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 flex-1 sm:flex-none w-full sm:w-auto"');

fs.writeFileSync('src/components/cashdrawer/cashdrawer-client.tsx', content, 'utf8');
console.log('Buttons updated for mobile flex.');
