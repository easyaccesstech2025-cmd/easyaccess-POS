"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { editProductAction } from "@/app/actions/products";
import { ImagePlus, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { formatPeso } from "@/lib/utils";

function SubmitButton({ isLastStep }: { isLastStep: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white">
      {pending ? "Saving..." : "Save Changes"} <CheckCircle2 className="ml-2 h-4 w-4" />
    </Button>
  );
}

export function EditProductModal({ 
  product,
  open, 
  onOpenChange,
  categories,
  suppliers,
  ingredients,
  isIngredientsBased = false
}: { 
  product: any;
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  categories: any[];
  suppliers: any[];
  ingredients: any[];
  isIngredientsBased?: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(editProductAction, null);
  
  // Wizard State
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form State
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price || "");
  const [cost, setCost] = useState(product?.costPrice || "");
  const [stock, setStock] = useState(product?.stock || "0");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [recipeItems, setRecipeItems] = useState<any[]>(product?.recipeItems || []);

  // Image State
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.hasImage ? `/api/products/${product.id}/image` : null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opened with a new product
  useEffect(() => {
    if (open && product) {
      setStep(1);
      setName(product.name || "");
      setPrice(product.price || "");
      setCost(product.costPrice || "");
      setStock(product.stock?.toString() || "0");
      setAdjustmentReason("");
      setRecipeItems(product.recipeItems || []);
      setPreviewUrl(product.hasImage ? `/api/products/${product.id}/image` : null);
      setImageBase64("");
    }
  }, [open, product]);

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      const toast = document.createElement("div");
      toast.className = "fixed top-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[9999] animate-in slide-in-from-right-8 fade-in duration-300 font-medium";
      toast.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg> Product updated successfully!`;
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

  const addRecipeItem = () => {
    setRecipeItems([...recipeItems, { ingredientId: "", quantityRequired: 1 }]);
  };
  const removeRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };
  const updateRecipeItem = (index: number, field: string, value: any) => {
    const newItems = [...recipeItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setRecipeItems(newItems);
  };

  // Dynamically calculate cost for Recipes
  useEffect(() => {
    if (product?.isRecipe) {
      let total = 0;
      recipeItems.forEach(item => {
        const ingredient = ingredients.find(i => i.id.toString() === item.ingredientId?.toString());
        if (ingredient && item.quantityRequired) {
          total += (Number(ingredient.costPerUnit) * Number(item.quantityRequired));
        }
      });
      setCost(total.toFixed(2));
    }
  }, [recipeItems, product?.isRecipe, ingredients]);

  const numPrice = Number(price);
  const numCost = Number(cost);
  const profit = numPrice - numCost;
  const margin = numPrice > 0 ? ((profit / numPrice) * 100).toFixed(1) : 0;

  const canGoNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) {
      const hasPrice = Number(price) > 0;
      const stockChanged = !product?.isRecipe && stock !== product?.stock?.toString();
      const hasReason = adjustmentReason.trim().length > 0;
      if (stockChanged && !hasReason) return false;
      return hasPrice;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-gray-50 flex flex-col max-h-[90vh]">
        
        {/* Wizard Header & Progress */}
        <div className="bg-white p-6 border-b shrink-0">
          <DialogTitle className="text-xl">Edit: {product?.name}</DialogTitle>
          <div className="mt-4 flex items-center justify-between relative max-w-sm mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#FD6708] rounded-full transition-all duration-300" 
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            />
            {[1, 2, 3].map((s) => (
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
            {step === 2 && "Step 2: Pricing & Inventory"}
            {step === 3 && "Step 3: Advanced Details"}
          </div>
        </div>

        <form key={product?.id} action={formAction} className="flex-1 flex flex-col min-h-[400px]">
          <input type="hidden" name="productId" value={product?.id} />
          <input type="hidden" name="backgroundColor" value={product?.backgroundColor} />

          <div className="flex-1 overflow-y-auto p-6">
            {state?.error && (
              <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center gap-2 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
              </div>
            )}

            {/* STEP 1: BASICS */}
            <div className={step === 1 ? "space-y-8 animate-in slide-in-from-right-4" : "hidden"}>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-semibold text-gray-900">Basic Information</h3>
                <p className="text-gray-500">Update the name, photo, or category.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start max-w-lg mx-auto">
                <div className="w-40 shrink-0 space-y-2">
                  <div 
                    className={`w-40 h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors ${previewUrl ? 'border-gray-200 shadow-md bg-white' : 'border-gray-300 hover:border-[#FD6708] bg-gray-50'}`}
                    onClick={() => fileInputRef.current?.click()}
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
                        <span className="text-sm font-medium text-gray-500">Change Photo</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  <input type="hidden" name="imageBase64" value={imageBase64} />
                </div>

                <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Name <span className="text-red-500">*</span></label>
                    <Input name="name" value={name} onChange={e => setName(e.target.value)} className="h-12 text-lg" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select name="categoryId" defaultValue={product?.categoryId?.toString() || "none"} className="h-12">
                      <option value="none">No Category</option>
                      {categories.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: PRICING & INVENTORY */}
            <div className={step === 2 ? "space-y-8 animate-in slide-in-from-right-4" : "hidden"}>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-semibold text-gray-900">Pricing & Inventory</h3>
                <p className="text-gray-500">Update how much this costs and how much you have.</p>
              </div>

              <div className="max-w-md mx-auto space-y-6 bg-white p-6 rounded-2xl border shadow-sm">
                
                {product?.isRecipe && (
                  <div className="space-y-4 pt-4 pb-2 border-b">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-900">Recipe Ingredients</label>
                      <Button type="button" variant="outline" size="sm" onClick={addRecipeItem}>
                        <Plus className="h-4 w-4 mr-2" /> Add Ingredient
                      </Button>
                    </div>
                    {recipeItems.map((item, index) => {
                      const selectedIng = ingredients.find(i => i.id.toString() === item.ingredientId?.toString());
                      return (
                        <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border">
                          <Select 
                            value={item.ingredientId?.toString()} 
                            onChange={e => updateRecipeItem(index, "ingredientId", e.target.value)}
                            className="flex-1 h-10"
                          >
                            <option value="">Select...</option>
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id.toString()}>{ing.name}</option>
                            ))}
                          </Select>
                          <div className="relative w-28">
                            <Input 
                              type="number" 
                              step="any"
                              value={item.quantityRequired} 
                              onChange={e => updateRecipeItem(index, "quantityRequired", e.target.value)}
                              className="h-10 pr-10"
                            />
                            {selectedIng && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                                {selectedIng.unitOfMeasurement}
                              </span>
                            )}
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeRecipeItem(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                    {recipeItems.length === 0 && (
                      <div className="text-center p-4 bg-gray-50 border border-dashed rounded-lg text-sm text-gray-500">
                        No ingredients added yet.
                      </div>
                    )}
                    <input type="hidden" name="recipeItems" value={JSON.stringify(recipeItems)} />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Selling Price <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</span>
                    <Input name="price" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} className="pl-8 h-14 text-xl font-medium" required />
                  </div>
                </div>
                
                {!product?.isRecipe && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Cost Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</span>
                      <Input 
                        name="costPrice" 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        value={cost} 
                        onChange={e => setCost(e.target.value)} 
                        className="pl-8 h-12 text-lg" 
                      />
                    </div>
                  </div>
                )}

                {!product?.isRecipe && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Current Stock</label>
                      <Input 
                        name="stock" 
                        type="number" 
                        step="1" 
                        value={stock} 
                        onChange={e => setStock(e.target.value)} 
                        className="h-12 text-lg" 
                      />
                      {stock === product?.stock?.toString() && (
                        <p className="text-xs text-gray-500">If you change this number, the system will automatically log the difference in the inventory adjustments audit trail.</p>
                      )}
                    </div>

                    {/* Dynamic Reason Field - Only shows if stock has actually changed */}
                    {stock !== product?.stock?.toString() && (
                      <div className="space-y-2 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-in slide-in-from-top-2 fade-in">
                        <label className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> Reason for Adjustment <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-amber-700 mb-2">You are changing the stock from {product?.stock} to {stock}. Please explain why.</p>
                        <Input 
                          name="adjustmentReason" 
                          placeholder="e.g., Found extra in back room, Damaged item thrown away..." 
                          className="bg-white border-amber-300 focus:ring-amber-500" 
                          required 
                          value={adjustmentReason}
                          onChange={e => setAdjustmentReason(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {numPrice > 0 && numCost > 0 && (
                  <div className={`p-4 rounded-xl flex items-center justify-between mt-4 ${profit > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
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
                
                {product?.isRecipe && (
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm font-medium">
                    <span className="text-gray-600">Total Raw Ingredient Cost:</span>
                    <span className="text-gray-900">{formatPeso(numCost)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: ADVANCED */}
            <div className={step === 3 ? "space-y-8 animate-in slide-in-from-right-4" : "hidden"}>
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-2xl font-semibold text-gray-900">Advanced Details</h3>
                <p className="text-gray-500">Update suppliers, barcodes, and tracking settings.</p>
              </div>

              <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Supplier</label>
                    <Select name="supplierId" defaultValue={product?.supplierId?.toString() || "none"}>
                      <option value="none">No Supplier</option>
                      {suppliers.map(s => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Barcode / SKU</label>
                    <Input name="barcode" defaultValue={product?.barcode || ""} placeholder="Scan or type..." />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                    <input type="checkbox" name="trackExpiry" value="true" defaultChecked={product?.trackExpiry} className="w-5 h-5 accent-[#FD6708]" />
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
