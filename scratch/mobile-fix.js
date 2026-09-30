const fs = require('fs');
let content = fs.readFileSync('src/components/cashdrawer/cashdrawer-client.tsx', 'utf8');

// Replace the active shift header wrapper
const oldHeader = `<div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Cash Drawer
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">OPEN</Badge>
          </h1>
        </div>
        <div className="flex gap-2">`;

const newHeader = `<div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Cash Drawer
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">OPEN</Badge>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">`;

if (content.includes(oldHeader)) {
    content = content.replace(oldHeader, newHeader);
    fs.writeFileSync('src/components/cashdrawer/cashdrawer-client.tsx', content, 'utf8');
    console.log('Mobile responsive header updated.');
} else {
    console.log('Could not find header to replace.');
}
