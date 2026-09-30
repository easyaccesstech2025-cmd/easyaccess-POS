const fs = require('fs');
let content = fs.readFileSync('src/app/(auth)/login/page.tsx', 'utf8');

// We will split the file into two components
const oldExport = 'export default function LoginPage() {';
const newExport = `function LoginContent() {`;

const newPage = `
import { Suspense } from "react";
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]"><Loader2 className="w-8 h-8 animate-spin text-[#FD6708]" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
`;

if (content.includes(oldExport)) {
    content = content.replace(oldExport, newExport);
    content = content + '\n' + newPage;
    fs.writeFileSync('src/app/(auth)/login/page.tsx', content, 'utf8');
    console.log("Login page fixed with Suspense.");
} else {
    console.log("Could not find LoginPage export.");
}
