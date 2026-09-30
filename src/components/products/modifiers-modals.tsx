"use client";

import { useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Tag, Layers, CheckCircle2, AlertCircle } from "lucide-react";
import { createModifierGroupAction, editModifierGroupAction, assignModifierToProductsAction } from "@/app/actions/modifiers";
import { formatPeso } from "@/lib/utils";
import { useRouter } from "next/navigation";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-[#FD6708] hover:bg-[#e55d07] text-white">
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function AddModifierModal({ open, onOpenChange, ingredients, isIngredientsBased = false }: { open: boolean, onOpenChange: (open: boolean) => void, ingredients: any[], isIngredientsBased?: boolean }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createModifierGroupAction, null);
  
  const [name, setName] = useState("");
  const [selectionType, setSelectionType] = useState("SINGLE");
  const [isRequired, setIsRequired] = useState(false);
  const [minSelect, setMinSelect] = useState(0);
  const [maxSelect, setMaxSelect] = useState(0);
  
  const [options, setOptions] = useState<any[]>([{ name: "", additionalPrice: "0", ingredientId: "", quantityRequired: "1" }]);

  const [step, setStep] = useState(1);
  const totalSteps = 2;

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
      setStep(1);
      setName("");
      setOptions([{ name: "", additionalPrice: "0", ingredientId: "", quantityRequired: "1" }]);
      router.refresh();
    }
  }, [state, onOpenChange, router]);

  const addOption = () => {
    setOptions([...options, { name: "", additionalPrice: "0", ingredientId: "", quantityRequired: "1" }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const canGoNext = () => {
    if (step === 1 && !name) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-gray-50 flex flex-col max-h-[90vh]">
        {/* Wizard Header - Fixed at top */}
        <div className="shrink-0 bg-white border-b px-6 py-4 flex flex-col items-center">
          <div className="flex items-center justify-center space-x-2">
            {[1, 2].map((s) => (
              <div 
                key={s} 
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s === step ? 'bg-[#FD6708] text-white shadow-md' : s < step ? 'bg-orange-200 text-[#FD6708]' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
            {step === 1 && "Step 1: Group Settings"}
            {step === 2 && "Step 2: Add Options"}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form action={formAction} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {state?.error && (
              <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
              </div>
            )}

            {/* STEP 1: GROUP SETTINGS */}
            <div className={step === 1 ? "space-y-6 animate-in slide-in-from-right-4" : "hidden"}>
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Let's define the rules.</h3>
                <p className="text-gray-500">What is this modifier called, and how should it behave?</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Group Name <span className="text-red-500">*</span></label>
                  <Input name="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Sugar Level, Milk Type..." className="h-12 text-lg focus:ring-[#FD6708]" required />
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">Selection Type</label>
                  <input type="hidden" name="selectionType" value={selectionType} />
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      onClick={() => setSelectionType("SINGLE")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectionType === "SINGLE" ? "border-[#FD6708] bg-orange-50/50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-semibold text-gray-900">Single</div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectionType === "SINGLE" ? "border-[#FD6708]" : "border-gray-300"}`}>
                          {selectionType === "SINGLE" && <div className="w-2 h-2 rounded-full bg-[#FD6708]" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Customer picks exactly one</p>
                    </div>
                    
                    <div 
                      onClick={() => setSelectionType("MULTIPLE")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectionType === "MULTIPLE" ? "border-[#FD6708] bg-orange-50/50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-semibold text-gray-900">Multiple</div>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectionType === "MULTIPLE" ? "border-[#FD6708] bg-[#FD6708]" : "border-gray-300"}`}>
                          {selectionType === "MULTIPLE" && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Customer can pick many</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-4">
                  <input type="hidden" name="isRequired" value={isRequired ? "true" : "false"} />
                  <div 
                    onClick={() => setIsRequired(!isRequired)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${isRequired ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors ${isRequired ? "bg-amber-500 border-amber-500 text-white" : "border-gray-300 bg-white"}`}>
                      {isRequired && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className={`font-semibold ${isRequired ? "text-amber-900" : "text-gray-900"}`}>Required Selection</div>
                      <p className={`text-xs ${isRequired ? "text-amber-700" : "text-gray-500"}`}>Customer MUST make a selection before checking out.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: OPTIONS */}
            <div className={step === 2 ? "space-y-6 animate-in slide-in-from-right-4" : "hidden"}>
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Add the actual choices.</h3>
                <p className="text-gray-500">What options can the customer pick from?</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 max-w-md mx-auto">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-semibold text-gray-900">Choices for "{name || 'Group'}"</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-4 w-4 mr-1" /> Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {options.map((opt, index) => (
                    <div key={index} className="bg-gray-50 border p-3 rounded-xl space-y-3 relative group">
                      {options.length > 1 && (
                        <button type="button" onClick={() => removeOption(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 bg-white rounded-full p-1 border shadow-sm transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-8 space-y-1">
                          <label className="text-xs font-medium text-gray-500">Option Name</label>
                          <Input value={opt.name} onChange={e => updateOption(index, "name", e.target.value)} placeholder="e.g., Oat Milk" className="h-10" required />
                        </div>
                        <div className="col-span-4 space-y-1">
                          <label className="text-xs font-medium text-gray-500">Price (+)</label>
                          <Input type="number" step="0.01" value={opt.additionalPrice} onChange={e => updateOption(index, "additionalPrice", e.target.value)} placeholder="0.00" className="h-10" required />
                        </div>
                      </div>

                      {isIngredientsBased && (
                        <div className="grid grid-cols-12 gap-3 pt-1">
                          <div className={`space-y-1 ${opt.ingredientId ? "col-span-8" : "col-span-12"}`}>
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                              <Layers className="h-3 w-3" /> Deduct Ingredient? (Optional)
                            </label>
                            <Select value={opt.ingredientId} onChange={e => updateOption(index, "ingredientId", e.target.value)} className="h-10 text-sm">
                              <option value="">No stock deduction</option>
                              {ingredients.map(ing => (
                                <option key={ing.id} value={ing.id.toString()}>{ing.name} ({ing.unitOfMeasurement})</option>
                              ))}
                            </Select>
                          </div>
                          {opt.ingredientId && (
                            <div className="col-span-4 space-y-1 animate-in fade-in">
                              <label className="text-xs font-medium text-gray-500">Qty Deducted</label>
                              <Input type="number" step="0.0001" min="0" value={opt.quantityRequired} onChange={e => updateOption(index, "quantityRequired", e.target.value)} className="h-10" required />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {options.length === 0 && (
                    <div className="text-center p-6 border border-dashed rounded-lg text-sm text-gray-500 bg-white">
                      Click "Add Option" to create choices.
                    </div>
                  )}
                  <input type="hidden" name="options" value={JSON.stringify(options)} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 bg-white p-4 border-t flex-row justify-between sm:justify-between items-center w-full">
            <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} className={step === 1 ? "invisible" : ""}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              {step < totalSteps ? (
                <Button 
                  type="button" 
                  disabled={!canGoNext()}
                  onClick={() => { if (canGoNext()) setStep(step + 1); }} 
                  className="bg-[#FD6708] hover:bg-[#e55d07] text-white disabled:bg-orange-300"
                >
                  Next Step
                </Button>
              ) : (
                <SubmitButton label="Create Modifier" />
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AssignModifierModal({ open, onOpenChange, group, products, assignments }: { open: boolean, onOpenChange: (open: boolean) => void, group: any, products: any[], assignments: any[] }) {
  const router = useRouter();
  const [state, formAction] = useActionState(assignModifierToProductsAction, null);
  
  // Track selected products
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Load existing assignments when modal opens
  useEffect(() => {
    if (open && group) {
      const assignedIds = assignments
        .filter(a => a.groupId === group.id)
        .map(a => a.productId);
      setSelectedIds(assignedIds);
    }
  }, [open, group, assignments]);

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state, onOpenChange, router]);

  const toggleProduct = (productId: number) => {
    if (selectedIds.includes(productId)) {
      setSelectedIds(selectedIds.filter(id => id !== productId));
    } else {
      setSelectedIds([...selectedIds, productId]);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form action={formAction}>
          <DialogHeader className="mb-4">
            <DialogTitle>Assign: {group.name}</DialogTitle>
            <DialogDescription>
              Select which products should prompt the cashier for these modifier options.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="groupId" value={group.id} />
          <input type="hidden" name="productIds" value={JSON.stringify(selectedIds)} />

          <div className="max-h-[50vh] overflow-y-auto border rounded-xl divide-y bg-gray-50/50">
            {products.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No products available.</div>
            ) : (
              products.map(product => (
                <label key={product.id} className="flex items-center gap-3 p-3 hover:bg-orange-50/50 cursor-pointer transition-colors bg-white">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    className="h-5 w-5 rounded border-gray-300 text-[#FD6708] focus:ring-[#FD6708]"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.categoryName || "No Category"}</div>
                  </div>
                </label>
              ))
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <SubmitButton label={`Assign to ${selectedIds.length} Product(s)`} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditModifierModal({ open, onOpenChange, group, existingOptions, ingredients, isIngredientsBased = false }: { open: boolean, onOpenChange: (open: boolean) => void, group: any, existingOptions: any[], ingredients: any[], isIngredientsBased?: boolean }) {
  const router = useRouter();
  const [state, formAction] = useActionState(editModifierGroupAction, null);
  
  const [name, setName] = useState("");
  const [selectionType, setSelectionType] = useState("SINGLE");
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<any[]>([]);

  const [step, setStep] = useState(1);
  const totalSteps = 2;

  useEffect(() => {
    if (open && group) {
      setName(group.name || "");
      setSelectionType(group.selectionType || "SINGLE");
      setIsRequired(group.isRequired || false);
      
      if (existingOptions && existingOptions.length > 0) {
        setOptions(existingOptions.map(opt => ({
          name: opt.name,
          additionalPrice: opt.additionalPrice.toString(),
          ingredientId: opt.ingredientId?.toString() || "",
          quantityRequired: opt.quantityRequired?.toString() || "1"
        })));
      } else {
        setOptions([{ name: "", additionalPrice: "0", ingredientId: "", quantityRequired: "1" }]);
      }
      setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, group?.id]);

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state, onOpenChange, router]);

  const addOption = () => {
    setOptions([...options, { name: "", additionalPrice: "0", ingredientId: "", quantityRequired: "1" }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const canGoNext = () => {
    if (step === 1 && !name) return false;
    return true;
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-gray-50 flex flex-col max-h-[90vh]">
        {/* Wizard Header - Fixed at top */}
        <div className="shrink-0 bg-white border-b px-6 py-4 flex flex-col items-center">
          <div className="flex items-center justify-center space-x-2">
            {[1, 2].map((s) => (
              <div 
                key={s} 
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s === step ? 'bg-[#FD6708] text-white shadow-md' : s < step ? 'bg-orange-200 text-[#FD6708]' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
            {step === 1 && "Step 1: Group Settings"}
            {step === 2 && "Step 2: Edit Options"}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form action={formAction} className="flex-1 min-h-0 flex flex-col">
          <input type="hidden" name="groupId" value={group.id} />
          
          <div className="flex-1 overflow-y-auto p-6">
            {state?.error && (
              <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
              </div>
            )}

            {/* STEP 1: GROUP SETTINGS */}
            <div className={step === 1 ? "space-y-6 animate-in slide-in-from-right-4" : "hidden"}>
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Edit {group.name}</h3>
                <p className="text-gray-500">Update the modifier's rules.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Group Name <span className="text-red-500">*</span></label>
                  <Input name="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Sugar Level, Milk Type..." className="h-12 text-lg focus:ring-[#FD6708]" required />
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">Selection Type</label>
                  <input type="hidden" name="selectionType" value={selectionType} />
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      onClick={() => setSelectionType("SINGLE")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectionType === "SINGLE" ? "border-[#FD6708] bg-orange-50/50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-semibold text-gray-900">Single</div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectionType === "SINGLE" ? "border-[#FD6708]" : "border-gray-300"}`}>
                          {selectionType === "SINGLE" && <div className="w-2 h-2 rounded-full bg-[#FD6708]" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Customer picks exactly one</p>
                    </div>
                    
                    <div 
                      onClick={() => setSelectionType("MULTIPLE")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectionType === "MULTIPLE" ? "border-[#FD6708] bg-orange-50/50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-semibold text-gray-900">Multiple</div>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectionType === "MULTIPLE" ? "border-[#FD6708] bg-[#FD6708]" : "border-gray-300"}`}>
                          {selectionType === "MULTIPLE" && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Customer can pick many</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-4">
                  <input type="hidden" name="isRequired" value={isRequired ? "true" : "false"} />
                  <div 
                    onClick={() => setIsRequired(!isRequired)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${isRequired ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors ${isRequired ? "bg-amber-500 border-amber-500 text-white" : "border-gray-300 bg-white"}`}>
                      {isRequired && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className={`font-semibold ${isRequired ? "text-amber-900" : "text-gray-900"}`}>Required Selection</div>
                      <p className={`text-xs ${isRequired ? "text-amber-700" : "text-gray-500"}`}>Customer MUST make a selection before checking out.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: OPTIONS */}
            <div className={step === 2 ? "space-y-6 animate-in slide-in-from-right-4" : "hidden"}>
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Edit choices.</h3>
                <p className="text-gray-500">What options can the customer pick from?</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 max-w-md mx-auto">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-semibold text-gray-900">Choices for "{name || 'Group'}"</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-4 w-4 mr-1" /> Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {options.map((opt, index) => (
                    <div key={index} className="bg-gray-50 border p-3 rounded-xl space-y-3 relative group">
                      {options.length > 1 && (
                        <button type="button" onClick={() => removeOption(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 bg-white rounded-full p-1 border shadow-sm transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-8 space-y-1">
                          <label className="text-xs font-medium text-gray-500">Option Name</label>
                          <Input value={opt.name} onChange={e => updateOption(index, "name", e.target.value)} placeholder="e.g., Oat Milk" className="h-10" required />
                        </div>
                        <div className="col-span-4 space-y-1">
                          <label className="text-xs font-medium text-gray-500">Price (+)</label>
                          <Input type="number" step="0.01" value={opt.additionalPrice} onChange={e => updateOption(index, "additionalPrice", e.target.value)} placeholder="0.00" className="h-10" required />
                        </div>
                      </div>

                      {isIngredientsBased && (
                        <div className="grid grid-cols-12 gap-3 pt-1">
                          <div className={`space-y-1 ${opt.ingredientId ? "col-span-8" : "col-span-12"}`}>
                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                              <Layers className="h-3 w-3" /> Deduct Ingredient? (Optional)
                            </label>
                            <Select value={opt.ingredientId} onChange={e => updateOption(index, "ingredientId", e.target.value)} className="h-10 text-sm">
                              <option value="">No stock deduction</option>
                              {ingredients.map(ing => (
                                <option key={ing.id} value={ing.id.toString()}>{ing.name} ({ing.unitOfMeasurement})</option>
                              ))}
                            </Select>
                          </div>
                          {opt.ingredientId && (
                            <div className="col-span-4 space-y-1 animate-in fade-in">
                              <label className="text-xs font-medium text-gray-500">Qty Deducted</label>
                              <Input type="number" step="0.0001" min="0" value={opt.quantityRequired} onChange={e => updateOption(index, "quantityRequired", e.target.value)} className="h-10" required />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {options.length === 0 && (
                    <div className="text-center p-6 border border-dashed rounded-lg text-sm text-gray-500 bg-white">
                      Click "Add Option" to create choices.
                    </div>
                  )}
                  <input type="hidden" name="options" value={JSON.stringify(options)} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 bg-white p-4 border-t flex-row justify-between sm:justify-between items-center w-full">
            <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} className={step === 1 ? "invisible" : ""}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              {step < totalSteps ? (
                <Button 
                  type="button" 
                  disabled={!canGoNext()}
                  onClick={() => { if (canGoNext()) setStep(step + 1); }} 
                  className="bg-[#FD6708] hover:bg-[#e55d07] text-white disabled:bg-orange-300"
                >
                  Next Step
                </Button>
              ) : (
                <SubmitButton label="Save Changes" />
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
