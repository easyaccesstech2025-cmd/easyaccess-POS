const fs = require('fs');
let content = fs.readFileSync('src/components/cashdrawer/cashdrawer-client.tsx', 'utf8');

const startIdx = content.indexOf('{/* Z-READING MODAL */}');
const endStr = '</Dialog>';
// We need to find the specific Dialog that corresponds to Z-READING MODAL.
// But there are multiple Dialogs. 
// It starts at startIdx.
const nextDialogContent = content.indexOf('<DialogContent', startIdx);
const nextDialogFooter = content.indexOf('</Dialog>', nextDialogContent);
const endIdx = nextDialogFooter + endStr.length;

const newModal = `
      {/* Z-READING MODAL */}
      <Dialog open={isCloseShiftModal} onOpenChange={setIsCloseShiftModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="bg-gray-900 text-white p-6 pb-8">
            <DialogHeader>
              <DialogTitle className="text-xl">Z-Reading Report</DialogTitle>
              <DialogDescription className="text-gray-400">Shift #{activeSession?.id} • {openedByName}</DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6 -mt-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-6">
              
              {/* Sales Summary */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">Sales Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Cash Sales</span><span className="font-medium">₱{cashSales.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Digital Sales</span><span className="font-medium">₱{digitalSales.toFixed(2)}</span></div>
                  {Object.entries(digitalBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex justify-between pl-4 text-xs"><span className="text-gray-400">↳ {method}</span><span className="text-gray-500">₱{(amount as number).toFixed(2)}</span></div>
                  ))}
                  <div className="flex justify-between pt-2 border-t font-bold"><span className="text-gray-900">Total Sales</span><span className="text-emerald-700">₱{totalSales.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Adjustments */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">Adjustments</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Cash Added (Pay Ins)</span><span className="font-medium text-blue-600">+ ₱{cashAdded.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Expenses (Pay Outs)</span><span className="font-medium text-red-600">- ₱{cashExpenses.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Refunds</span><span className="font-medium text-red-600">- ₱{cashRefunds.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Expected Cash */}
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Expected Cash</h4>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-blue-600">Starting Float</span>
                  <span className="text-sm font-medium text-blue-800">₱{startingCashNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
                  <span className="font-bold text-blue-900">Total Expected</span>
                  <span className="text-xl font-black text-blue-900">₱{expectedCash.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-blue-500 mt-2 italic text-center">Starting Cash + Cash Sales + Added - Expenses - Refunds</p>
              </div>

              {/* Discrepancy */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 mb-3">Drawer Count</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Actual Cash Counted</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-gray-400 font-bold">₱</span>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-8 text-xl font-bold h-12 focus-visible:ring-gray-900" 
                        value={actualCashCounted} 
                        onChange={e => setActualCashCounted(e.target.value)} 
                      />
                    </div>
                  </div>

                  {actualCashCounted && (
                    <div className={cn("p-4 rounded-md flex justify-between items-center border", variance === 0 ? "bg-emerald-50 border-emerald-200" : (variance < 0 ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"))}>
                      <span className={cn("text-sm font-bold", variance === 0 ? "text-emerald-700" : (variance < 0 ? "text-red-700" : "text-blue-700"))}>
                        {variance === 0 ? "BALANCED" : (variance < 0 ? "SHORT (Missing Cash)" : "OVER (Extra Cash)")}
                      </span>
                      <span className={cn("text-xl font-black", variance === 0 ? "text-emerald-700" : (variance < 0 ? "text-red-700" : "text-blue-700"))}>
                        {variance > 0 ? "+" : ""}{variance.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
          
          <div className="p-4 border-t bg-gray-50 flex gap-2 justify-end shrink-0">
            <Button variant="ghost" onClick={() => setIsCloseShiftModal(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                  if (confirm("Are you sure? This action cannot be undone. This shift will be permanently closed and a Z-Reading email will be sent.")) {
                      handleCloseShift();
                  }
              }} 
              disabled={isPending || !actualCashCounted} 
              className="bg-gray-900 hover:bg-black"
            >
              <LogOut className="w-4 h-4 mr-2" /> Confirm & Close Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
`;

if (startIdx !== -1 && nextDialogFooter !== -1) {
    content = content.substring(0, startIdx) + newModal + content.substring(endIdx);
    fs.writeFileSync('src/components/cashdrawer/cashdrawer-client.tsx', content, 'utf8');
    console.log('Modal replaced.');
} else {
    console.log('Could not find modal.');
}
