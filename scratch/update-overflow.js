const fs = require('fs');
let content = fs.readFileSync('src/components/cashdrawer/cashdrawer-client.tsx', 'utf8');

content = content.replace(
  '<div className="flex-1 overflow-y-auto px-6 pb-6 -mt-4">',
  '<div className="flex-1 overflow-y-auto px-6 pb-6 -mt-4 min-h-0">'
);

content = content.replace(
  '<DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">',
  '<DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">'
);

fs.writeFileSync('src/components/cashdrawer/cashdrawer-client.tsx', content, 'utf8');
console.log("Fixed overflow.");
