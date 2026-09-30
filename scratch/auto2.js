const fs = require('fs');
let content = fs.readFileSync('src/components/cashdrawer/cashdrawer-client.tsx', 'utf8');

if (!content.includes('useRouter')) {
    content = content.replace(
        'import { useState, useTransition } from "react";',
        'import { useState, useTransition, useEffect } from "react";\nimport { useRouter } from "next/navigation";'
    );
}

if (!content.includes('const router = useRouter();')) {
    content = content.replace(
        'const [isPending, startTransition] = useTransition();',
        'const router = useRouter();\n  const [isPending, startTransition] = useTransition();\n  const [isSyncing, setIsSyncing] = useState(false);\n  const [lastSynced, setLastSynced] = useState<Date | null>(null);\n\n  useEffect(() => {\n    setLastSynced(new Date());\n  }, []);\n\n  useEffect(() => {\n    if (!activeSession) return;\n    const interval = setInterval(() => {\n      handleSync(true);\n    }, 30000);\n    return () => clearInterval(interval);\n  }, [activeSession]);\n\n  const handleSync = (isAuto = false) => {\n    if (!isAuto) setIsSyncing(true);\n    startTransition(() => {\n      router.refresh();\n      setLastSynced(new Date());\n      if (!isAuto) setTimeout(() => setIsSyncing(false), 500);\n    });\n  };\n'
    );
}

const headerTarget = '<FileText className="w-4 h-4 mr-2" /> View Transactions\n          </Button>';
const syncBtn = '\n          <Button variant="ghost" size="icon" className={cn("text-gray-500 hover:text-gray-900 border", isSyncing && "animate-spin")} onClick={() => handleSync(false)} title="Sync Now">\n            <RefreshCcw className="w-4 h-4" />\n          </Button>';

if (content.includes(headerTarget) && !content.includes('title="Sync Now"')) {
    content = content.replace(headerTarget, headerTarget + syncBtn);
}

const detailsTarget = '<h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Details</h3>';
const syncText = `<div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Details</h3>
              {lastSynced && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Auto-sync active (Last: {lastSynced.toLocaleTimeString()})
                </span>
              )}
            </div>`;

if (content.includes(detailsTarget) && !content.includes('Auto-sync active')) {
    content = content.replace(detailsTarget, syncText);
}

fs.writeFileSync('src/components/cashdrawer/cashdrawer-client.tsx', content, 'utf8');
console.log('Auto sync added.');
