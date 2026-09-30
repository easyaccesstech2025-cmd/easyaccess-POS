const fs = require('fs');
let content = fs.readFileSync('src/components/cashdrawer/cashdrawer-client.tsx', 'utf8');

// 1. Add state variable
if (!content.includes('isHistoryModal')) {
    content = content.replace(
        'const [isTransactionModal',
        'const [isHistoryModal, setIsHistoryModal] = useState(false);\n  const [isTransactionModal'
    );
}

// 2. Add Button next to Add Expense
const btnCode = `
          <Button variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100" onClick={() => setIsHistoryModal(true)}>
            <FileText className="w-4 h-4 mr-2" /> View Transactions
          </Button>`;

if (content.includes('Add Expense\n          </Button>')) {
    content = content.replace(
        'Add Expense\n          </Button>',
        'Add Expense\n          </Button>' + btnCode
    );
}

// 3. Remove the inline Card
const cardStartRegex = /\{\/\* RECENT TRANSACTIONS \*\/\}\s*<Card className="shadow-sm">/;
const cardEndRegex = /<\/CardContent>\s*<\/Card>\s*\{\/\* EXPECTED CASH \*\/\}/;

let matchStart = content.search(cardStartRegex);
let matchEnd = content.search(cardEndRegex);

if (matchStart !== -1 && matchEnd !== -1) {
    // Delete the block
    let endStr = '</Card>';
    let blockEndIndex = content.indexOf(endStr, matchEnd) + endStr.length;
    content = content.substring(0, matchStart) + content.substring(blockEndIndex);
}

// 4. Inject Dialog
const dialogCode = `
      {/* HISTORY MODAL */}
      <Dialog open={isHistoryModal} onOpenChange={setIsHistoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recent Transactions</DialogTitle>
            <DialogDescription>List of all cash additions and expenses during this shift.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="overflow-y-auto max-h-[300px] border rounded-md border-gray-100">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No cash additions or expenses recorded yet.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {transactions.map((tx: any) => (
                    <li key={tx.id} className="p-4 px-6 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{tx.transactionType === 'CASH_ADDED' ? 'Add Cash' : 'Add Expense'}</p>
                        {tx.description && <p className="text-xs text-gray-500">{tx.description}</p>}
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-bold", tx.transactionType === 'CASH_ADDED' ? "text-emerald-600" : "text-red-600")}>
                          {tx.transactionType === 'CASH_ADDED' ? '+' : '-'}₱{parseFloat(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-400">{new Date(tx.createdAtMs).toLocaleTimeString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsHistoryModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
`;

if (!content.includes('HISTORY MODAL')) {
    content = content.replace(
        '{/* Z-READING MODAL */}',
        dialogCode + '\n      {/* Z-READING MODAL */}'
    );
}

fs.writeFileSync('src/components/cashdrawer/cashdrawer-client.tsx', content, 'utf8');
console.log('Successfully updated to dialog.');
