const fs = require('fs');
let content = fs.readFileSync('src/components/cashdrawer/cashdrawer-client.tsx', 'utf8');

// 1. Add states
if (!content.includes('const [printReceipt')) {
    content = content.replace(
        'const [txDescription, setTxDescription] = useState("");',
        'const [txDescription, setTxDescription] = useState("");\n  const [printReceipt, setPrintReceipt] = useState(true);\n  const [emailReport, setEmailReport] = useState(true);'
    );
}

// 2. Replace handleCloseShift
const oldHandle = `const handleCloseShift = () => {
    if (!actualCashCounted) return;
    startTransition(async () => {
      const res = await closeShiftAction(activeSession.id, parseFloat(actualCashCounted));
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Shift closed successfully.", { description: "Z-Reading Report has been emailed to the Master Admin." });
        setTimeout(() => {
          window.print(); // Trigger the Z-Reading print fallback
        }, 500);
        setIsCloseShiftModal(false);
        setActualCashCounted("");
      }
    });
  };`;

const newHandle = `const handleCloseShift = () => {
    if (!actualCashCounted) return;
    startTransition(async () => {
      const res = await closeShiftAction(activeSession.id, parseFloat(actualCashCounted));
      if (res?.error) toast.error(res.error);
      else {
        if (emailReport) {
          toast.success("Shift closed successfully.", { description: "Z-Reading Report has been emailed to the Master Admin." });
        } else {
          toast.success("Shift closed successfully.");
        }
        
        if (printReceipt) {
          setTimeout(() => {
            window.print(); // Trigger the Z-Reading print fallback
          }, 500);
        }
        
        setIsCloseShiftModal(false);
        setActualCashCounted("");
      }
    });
  };`;

if (content.includes(oldHandle)) {
    content = content.replace(oldHandle, newHandle);
}

// 3. Replace the dialog footer
const oldFooter = `<div className="p-4 border-t bg-gray-50 flex gap-2 justify-end shrink-0">
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
          </div>`;

const newFooter = `<div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex gap-4 text-sm font-medium w-full sm:w-auto bg-white p-2 rounded-md border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <input type="checkbox" checked={printReceipt} onChange={e => setPrintReceipt(e.target.checked)} className="w-4 h-4 rounded text-gray-900 border-gray-300" />
                Print Receipt
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                <input type="checkbox" checked={emailReport} onChange={e => setEmailReport(e.target.checked)} className="w-4 h-4 rounded text-gray-900 border-gray-300" />
                Email Report
              </label>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="ghost" className="flex-1 sm:flex-none" onClick={() => setIsCloseShiftModal(false)}>Cancel</Button>
              <Button 
                onClick={() => {
                    if (confirm("Are you sure? This action cannot be undone. This shift will be permanently closed.")) {
                        handleCloseShift();
                    }
                }} 
                disabled={isPending || !actualCashCounted} 
                className="bg-gray-900 hover:bg-black flex-1 sm:flex-none"
              >
                <LogOut className="w-4 h-4 mr-2" /> Confirm & Close
              </Button>
            </div>
          </div>`;

if (content.includes(oldFooter)) {
    content = content.replace(oldFooter, newFooter);
    console.log('Footer updated.');
} else {
    console.log('Could not find footer.');
}

fs.writeFileSync('src/components/cashdrawer/cashdrawer-client.tsx', content, 'utf8');
