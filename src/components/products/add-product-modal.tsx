"use client";

import { useState, useActionState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createProductAction } from "@/app/actions/products";
import { ImagePlus, Palette, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { formatPeso } from "@/lib/utils";

const COLORS = ["#FF6200EE", "#FF03DAC5", "#FFBB86FC", "#FFE91E63", "#FF4CAF50", "#FD6708", "#2196F3", "#9C27B0", "#F44336", "#009688"];

function SubmitButton({ isLastStep }: { isLastStep: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white">
      {pending ? "Saving..." : "Save Product"} <CheckCircle2 className="ml-2 h-4 w-4" />
    </Button>
  );
}

export function AddProductModal({ 
  open, 
  onOpenChange,
  categories,
  suppliers,
  ingredients,
  isIngredientsBased = false
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  categories: any[];
  suppliers: any[];
  ingredients: any[];
  isIngredientsBased?: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(createProductAction, null);
  
  // Wizard State
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [inventoryType, setInventoryType] = useState<"standard" | "recipe">("standard");
  
  // Recipe Builder State
  const [recipeItems, setRecipeItems] = useState<{ ingredientId: number, quantityRequired: number }[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("none");
  const [selectedQty, setSelectedQty] = useState<string>("");

  // Image State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState(COLORS[Math.floor(Math.random() * 5)]);

  // Reset form
  useEffect(() => {
    if (open) {
      setStep(1);
      setName("");
      setPrice("");
      setCost("");
      setInventoryType("standard");
      setRecipeItems([]);
      setSelectedIngredientId("none");
      setSelectedQty("");
      setPreviewUrl(null);
      setImageBase64("");
      setColor(COLORS[Math.floor(Math.random() * 5)]);
    }
  }, [open]);

  useEffect(() => {
    if (state?.success) {
      // Force refresh the datagrid
      router.refresh();
      
      // Beautiful custom toast notification
      const toast = document.createElement("div");
      toast.className = "fixed top-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[9999] animate-in slide-in-from-right-8 fade-in duration-300 font-medium";
      toast.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg> Product successfully saved!`;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
      }, 3500);

      onOpenChange(false);
    }
  }, [state, onOpenChange, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/webp", 0.8);
        setPreviewUrl(compressedDataUrl);
        setImageBase64(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Calculate dynamic recipe cost
  const calculatedRecipeCost = useMemo(() => {
    return recipeItems.reduce((total, item) => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (!ing) return total;
      return total + (item.quantityRequired * Number(ing.costPerUnit));
    }, 0);
  }, [recipeItems, ingredients]);

  // Sync computed cost to the input state so it renders correctly in Step 3
  useEffect(() => {
    if (inventoryType === "recipe") {
      setCost(calculatedRecipeCost.toFixed(2));
    }
  }, [inventoryType, calculatedRecipeCost]);

  const handleAddRecipeItem = () => {
    if (selectedIngredientId === "none" || !selectedQty) return;
    const ingId = parseInt(selectedIngredientId);
    const qty = parseFloat(selectedQty);
    if (isNaN(ingId) || isNaN(qty) || qty <= 0) return;

    // Check if exists, replace or add
    setRecipeItems(prev => {
      const exists = prev.find(i => i.ingredientId === ingId);
      if (exists) {
        return prev.map(i => i.ingredientId === ingId ? { ...i, quantityRequired: qty } : i);
      }
      return [...prev, { ingredientId: ingId, quantityRequired: qty }];
    });
    
    setSelectedIngredientId("none");
    setSelectedQty("");
  };

  const handleRemoveRecipeItem = (id: number) => {
    setRecipeItems(prev => prev.filter(i => i.ingredientId !== id));
  };

  // Validation per step
  const canGoNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2 && inventoryType === "recipe") return recipeItems.length > 0;
    if (step === 3) return Number(price) > 0;
    return true;
  };

  // Profit Margin Calculation
  const numPrice = Number(price);
  const numCost = Number(cost);
  const profit = numPrice - numCost;
  const margin = numPrice > 0 ? ((profit / numPrice) * 100).toFixed(1) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-gray-50 flex flex-col max-h-[90vh]">
        
        {/* Wizard Header & Progress */}
        <div className="bg-white p-6 border-b shrink-0">
          <DialogTitle className="text-xl">Add New Product</DialogTitle>
          <div className="mt-4 flex items-center justify-between relative max-w-lg mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#FD6708] rounded-full transition-all duration-300" 
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            />
            {[1, 2, 3, 4].map((s) => (
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
            {step === 1 && "Step 1: The Basics"}
            {step === 2 && "Step 2: Inventory & Recipe"}
            {step === 3 && "Step 3: Pricing"}
            {step === 4 && "Step 4: Advanced Details"}
          </div>
        </div>

        {/* Wizard Body */}
        <form action={formAction} className="flex-1 flex flex-col min-h-[400px]">
          <div className="flex-1 overflow-y-auto p-6">
            {state?.error && (
              <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
              </div>
            )}
            
            {/* STEP 1: BASICS */}
            <div className={step === 1 ? "space-y-8 animate-in slide-in-from-right-4" : "hidden"}>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-semibold text-gray-900">Let's start with the basics.</h3>
                <p className="text-gray-500">What are you selling, and what does it look like?</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start max-w-lg mx-auto">
                <div className="w-40 shrink-0 space-y-2">
                  <div 
                    className={`w-40 h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${previewUrl ? 'border-gray-200 shadow-md bg-white' : 'border-gray-300 hover:border-[#FD6708] bg-gray-50'}`}
                    onClick={() => !previewUrl && fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <div className="relative w-full h-full group">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button type="button" variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setImageBase64(""); }}>Remove</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <ImagePlus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-500">Add Photo</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  <input type="hidden" name="imageBase64" value={imageBase64} />
                  <input type="hidden" name="backgroundColor" value={color} />
                </div>

                <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Name <span className="text-red-500">*</span></label>
                    <Input name="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Iced Caramel Macchiato" className="h-12 text-lg" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select name="categoryId" className="h-12">
                      <option value="none">No Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: INVENTORY & RECIPE */}
            <div className={step === 2 ? "space-y-8 animate-in slide-in-from-right-4" : "hidden"}>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-semibold text-gray-900">How is this item made?</h3>
                <p className="text-gray-500">Tell the system how to handle inventory and costs for this product.</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <input type="hidden" name="isRecipe" value={inventoryType === "recipe" ? "true" : "false"} />
                <input type="hidden" name="recipeItems" value={JSON.stringify(recipeItems)} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setInventoryType("standard")}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${inventoryType === "standard" ? "border-[#FD6708] bg-orange-50/50 shadow-md ring-4 ring-orange-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-lg">📦</div>
                    <h4 className="font-semibold text-gray-900 mb-1">Standard Item</h4>
                    <p className="text-sm text-gray-500">I buy this and sell it as-is (e.g., bottled water, packaged chips).</p>
                  </div>
                  
                  {isIngredientsBased && (
                    <div 
                      onClick={() => setInventoryType("recipe")}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${inventoryType === "recipe" ? "border-[#FD6708] bg-orange-50/50 shadow-md ring-4 ring-orange-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-lg">🍳</div>
                      <h4 className="font-semibold text-gray-900 mb-1">Recipe-Based</h4>
                      <p className="text-sm text-gray-500">I make this from ingredients (e.g., brewed coffee, sandwiches).</p>
                    </div>
                  )}
                </div>

                {/* Standard Stock Input */}
                {inventoryType === "standard" && (
                  <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <h4 className="font-medium text-gray-900">Initial Stock Count</h4>
                    <p className="text-sm text-gray-500 mb-4">How many do you currently have on hand right now?</p>
                    <Input name="stock" type="number" step="1" defaultValue="0" className="max-w-[200px] h-12 text-lg" />
                  </div>
                )}
                
                {/* Recipe Builder */}
                {inventoryType === "recipe" && (
                  <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div>
                      <h4 className="font-medium text-gray-900">Recipe Builder</h4>
                      <p className="text-sm text-gray-500">Add the exact ingredients needed to make 1 unit of this product.</p>
                    </div>

                    <div className="flex gap-2 items-end bg-gray-50 p-4 rounded-xl border">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase">Ingredient</label>
                        <Select value={selectedIngredientId} onChange={(e) => setSelectedIngredientId(e.target.value)}>
                          <option value="none">Select ingredient...</option>
                          {ingredients.map(ing => (
                            <option key={ing.id} value={ing.id.toString()}>{ing.name}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="w-32 space-y-2">
                        <label className="text-xs font-medium text-gray-500 uppercase">Qty</label>
                        <div className="relative">
                          <Input 
                            type="number" 
                            step="0.001" 
                            value={selectedQty} 
                            onChange={(e) => setSelectedQty(e.target.value)} 
                            placeholder="0" 
                            className="pr-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none uppercase">
                            {selectedIngredientId !== "none" ? ingredients.find(i => i.id.toString() === selectedIngredientId)?.unitOfMeasurement : ""}
                          </span>
                        </div>
                      </div>
                      <Button type="button" onClick={handleAddRecipeItem} disabled={selectedIngredientId === "none" || !selectedQty} className="mb-0.5 shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {recipeItems.length > 0 ? (
                      <div className="border rounded-xl overflow-hidden divide-y">
                        {recipeItems.map(item => {
                          const ing = ingredients.find(i => i.id === item.ingredientId);
                          if (!ing) return null;
                          const cost = item.quantityRequired * Number(ing.costPerUnit);
                          return (
                            <div key={item.ingredientId} className="flex items-center justify-between p-3 bg-white hover:bg-gray-50">
                              <div>
                                <div className="font-medium text-sm">{ing.name}</div>
                                <div className="text-xs text-gray-500">{item.quantityRequired} {ing.unitOfMeasurement} @ {formatPeso(Number(ing.costPerUnit))} each</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-semibold text-sm text-gray-700">{formatPeso(cost)}</span>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveRecipeItem(item.ingredientId)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        <div className="bg-gray-50 p-3 flex justify-between items-center border-t-2 border-gray-200">
                          <span className="font-bold text-sm text-gray-700">Total Raw Cost:</span>
                          <span className="font-bold text-emerald-600 text-lg">{formatPeso(calculatedRecipeCost)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm text-amber-600 bg-amber-50 rounded-xl border border-amber-200 border-dashed">
                        No ingredients added yet. You must add at least one to continue.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: PRICING */}
            <div className={step === 3 ? "space-y-8 animate-in slide-in-from-right-4" : "hidden"}>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-semibold text-gray-900">Let's talk about money.</h3>
                <p className="text-gray-500">How much do you sell it for, and how much profit will you make?</p>
              </div>

              <div className="max-w-md mx-auto space-y-6 bg-white p-6 rounded-2xl border shadow-sm">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Selling Price <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</span>
                    <Input name="price" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} className="pl-8 h-14 text-xl font-medium" placeholder="0.00" required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex justify-between">
                    Cost Price
                    {inventoryType === "recipe" && <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Auto-calculated from Recipe</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</span>
                    <Input 
                      name="costPrice" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      value={cost} 
                      onChange={e => setCost(e.target.value)} 
                      className={`pl-8 h-12 text-lg ${inventoryType === "recipe" ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`} 
                      placeholder="0.00" 
                      readOnly={inventoryType === "recipe"}
                    />
                  </div>
                </div>

                {numPrice > 0 && numCost > 0 && (
                  <div className={`p-4 rounded-xl flex items-center justify-between ${profit > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : profit < 0 ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                    <div>
                      <div className="text-sm font-medium opacity-80">Estimated Profit</div>
                      <div className="text-xl font-bold">{formatPeso(profit)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium opacity-80">Margin</div>
                      <div className="text-xl font-bold">{margin}%</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 4: ADVANCED */}
            <div className={step === 4 ? "space-y-8 animate-in slide-in-from-right-4" : "hidden"}>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-semibold text-gray-900">Finishing touches (Optional)</h3>
                <p className="text-gray-500">Add any remaining details before saving.</p>
              </div>

              <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Supplier</label>
                    <Select name="supplierId">
                      <option value="none">No Supplier</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Barcode / SKU</label>
                    <Input name="barcode" placeholder="Scan or type..." />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                    <input type="checkbox" name="trackExpiry" value="true" className="w-5 h-5 accent-[#FD6708]" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Track Expiry Dates</div>
                      <div className="text-xs text-gray-500">Enable this if the product spoils and you need to monitor expiration batches.</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Wizard Footer Navigation */}
          <div className="bg-white p-4 sm:p-6 border-t shrink-0 flex items-center justify-between z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <Button type="button" variant="ghost" onClick={() => step === 1 ? onOpenChange(false) : setStep(step - 1)}>
              {step === 1 ? "Cancel" : <><ArrowLeft className="mr-2 h-4 w-4" /> Back</>}
            </Button>
            
            {step < totalSteps ? (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canGoNext()} className="px-8">
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <SubmitButton isLastStep={true} />
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
