const fs = require('fs');
let content = fs.readFileSync('src/components/cashdrawer/cashdrawer-client.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      handleSync(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeSession]);`;

const newEffect = `  useEffect(() => {
    const interval = setInterval(() => {
      handleSync(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);`;

if (content.includes(oldEffect)) {
    content = content.replace(oldEffect, newEffect);
    console.log("Auto-sync interval fixed.");
}

// Ensure the Sync button is also in the "No Active Shift" header
const noActiveHeader = `<h1 className="text-2xl font-bold text-gray-900">Cash Drawer</h1>
        </div>`;
const newNoActiveHeader = `<h1 className="text-2xl font-bold text-gray-900">Cash Drawer</h1>
          <Button variant="ghost" size="icon" className={cn("text-gray-500 hover:text-gray-900 border", isSyncing && "animate-spin")} onClick={() => handleSync(false)} title="Sync Now">
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>`;

if (content.includes(noActiveHeader) && !content.includes(newNoActiveHeader)) {
    content = content.replace(noActiveHeader, newNoActiveHeader);
    console.log("Sync button added to empty state.");
}

fs.writeFileSync('src/components/cashdrawer/cashdrawer-client.tsx', content, 'utf8');
