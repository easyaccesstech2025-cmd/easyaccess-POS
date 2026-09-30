const fs = require('fs');
let content = fs.readFileSync('src/components/cashdrawer/cashdrawer-client.tsx', 'utf8');

// 1. Add the state
if (!content.includes('const [isConfirmCloseModal')) {
    content = content.replace(
        'const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);',
        'const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);\n  const [isConfirmCloseModal, setIsConfirmCloseModal] = useState(false);'
    );
}

// 2. Modify the Confirm button inside the Z-Reading Modal
const oldButtonCode = `onClick={() => {
                    if (confirm("Are you sure? This action cannot be undone. This shift will be permanently closed.")) {
                        handleCloseShift();
                    }
                }}`;
                
const newButtonCode = `onClick={() => setIsConfirmCloseModal(true)}`;

if (content.includes(oldButtonCode)) {
    content = content.replace(oldButtonCode, newButtonCode);
}

// 3. Inject the new Confirm Dialog at the bottom (before final closing div)
const confirmDialogCode = `
      {/* CONFIRM CLOSE MODAL */}
      <Dialog open={isConfirmCloseModal} onOpenChange={setIsConfirmCloseModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <LogOut className="w-5 h-5" /> Confirm Shift Closure
            </DialogTitle>
            <DialogDescription className="pt-2 text-gray-700">
              Are you sure? This action cannot be undone. This shift will be permanently closed and a Z-Reading will be recorded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsConfirmCloseModal(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                setIsConfirmCloseModal(false);
                handleCloseShift();
              }} 
              disabled={isPending} 
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
`;

if (!content.includes('CONFIRM CLOSE MODAL')) {
    const lastDiv = '    </div>\n  );\n}';
    if (content.includes(lastDiv)) {
        content = content.replace(lastDiv, confirmDialogCode + '\n' + lastDiv);
    }
}

fs.writeFileSync('src/components/cashdrawer/cashdrawer-client.tsx', content, 'utf8');
console.log('Confirmation dialog updated.');
