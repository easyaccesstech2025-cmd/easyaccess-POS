const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.ts', 'utf8');

const targetStr = 'session: {\n    strategy: "jwt",\n  },';
const replaceStr = 'session: {\n    strategy: "jwt",\n  },\n  trustHost: true,';

if (content.includes(targetStr) && !content.includes('trustHost: true')) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync('src/lib/auth.ts', content, 'utf8');
    console.log("trustHost added.");
} else {
    console.log("Could not find insertion point.");
}
