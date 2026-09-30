const fs = require('fs');
let content = fs.readFileSync('src/components/cashdrawer/cashdrawer-client.tsx', 'utf8');

const recentTxCode = `
        {/* RECENT TRANSACTIONS */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Recent Transactions</h3>
            </div>
            <div className="overflow-y-auto max-h-[250px]">
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
          </CardContent>
        </Card>
`;

const anchor = '{/* EXPECTED CASH */}';
if (content.includes(anchor)) {
    content = content.replace(anchor, recentTxCode + '\n        ' + anchor);
    fs.writeFileSync('src/components/cashdrawer/cashdrawer-client.tsx', content, 'utf8');
    console.log('Successfully injected Recent Transactions card.');
} else {
    console.log('Failed to find EXPECTED CASH anchor.');
}
