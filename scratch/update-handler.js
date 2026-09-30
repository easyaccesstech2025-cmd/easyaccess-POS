const fs = require('fs');
let content = fs.readFileSync('src/components/cashdrawer/cashdrawer-client.tsx', 'utf8');

const oldHandle = `const handleCloseShift = () => {
    if (!actualCashCounted) return;
    startTransition(async () => {
      const res = await closeShiftAction(activeSession.id, parseFloat(actualCashCounted));
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Shift closed and Z-Reading generated.");
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
        toast.success("Shift closed successfully.", { description: "Z-Reading Report has been emailed to the Master Admin." });
        setTimeout(() => {
          window.print(); // Trigger the Z-Reading print fallback
        }, 500);
        setIsCloseShiftModal(false);
        setActualCashCounted("");
      }
    });
  };`;

if (content.includes(oldHandle)) {
    content = content.replace(oldHandle, newHandle);
    fs.writeFileSync('src/components/cashdrawer/cashdrawer-client.tsx', content, 'utf8');
    console.log('Close handler updated.');
} else {
    console.log('Could not find close handler.');
}
