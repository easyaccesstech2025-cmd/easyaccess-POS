"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ListChecks, CheckSquare, Settings2, MoreHorizontal, Layers } from "lucide-react";
import { formatPeso } from "@/lib/utils";
import { AddModifierModal, EditModifierModal, AssignModifierModal } from "./modifiers-modals";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ModifiersTab({ 
  groups, 
  options, 
  ingredients, 
  products,
  assignments,
  isIngredientsBased = false
}: { 
  groups: any[], 
  options: any[], 
  ingredients: any[],
  products: any[],
  assignments: any[],
  isIngredientsBased?: boolean
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<any | null>(null);
  const [assignGroup, setAssignGroup] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Modifier Groups</h2>
          <p className="text-sm text-gray-500">Manage add-ons, sizes, and customizations for your products.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-[#FD6708] hover:bg-[#e55d07] text-white">
          <Plus className="mr-2 h-4 w-4" /> Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map(group => {
          const groupOptions = options.filter(o => o.groupId === group.id).sort((a, b) => a.sortOrder - b.sortOrder);
          const assignedCount = assignments.filter(a => a.groupId === group.id).length;
          
          return (
            <Card key={group.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gray-50/50 p-4 border-b flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{group.name}</h3>
                    {group.isRequired && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Required</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      {group.selectionType === "SINGLE" ? <ListChecks className="h-3 w-3" /> : <CheckSquare className="h-3 w-3" />}
                      {group.selectionType === "SINGLE" ? "Single Choice" : `Multi Choice (${group.minSelect}-${group.maxSelect})`}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Assigned to {assignedCount} product{assignedCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setEditGroup(group)} className="cursor-pointer">
                      <Settings2 className="mr-2 h-4 w-4 text-gray-600" /> Edit Group
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAssignGroup(group)} className="cursor-pointer">
                      <ListChecks className="mr-2 h-4 w-4 text-emerald-600" /> Assign to Products
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {groupOptions.map(opt => {
                    const linkedIng = opt.ingredientId ? ingredients.find(i => i.id === opt.ingredientId) : null;
                    return (
                      <div key={opt.id} className="p-3 px-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{opt.name}</div>
                          {linkedIng && (
                            <div className="text-[11px] text-orange-600 flex items-center gap-1 mt-0.5 font-medium">
                              Deducts {Number(opt.quantityRequired || 1)} {linkedIng.unitOfMeasurement} of {linkedIng.name}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-gray-600">
                          {Number(opt.additionalPrice) > 0 ? `+${formatPeso(Number(opt.additionalPrice))}` : "Free"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {groups.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <Layers className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No Modifier Groups</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-4 mt-1">Create groups like "Sugar Level" or "Add-ons" and attach them to your products.</p>
            <Button onClick={() => setIsAddOpen(true)} className="bg-[#FD6708] hover:bg-[#e55d07] text-white">
              <Plus className="mr-2 h-4 w-4" /> Create First Group
            </Button>
          </div>
        )}
      </div>

      <AddModifierModal 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        ingredients={ingredients} 
        isIngredientsBased={isIngredientsBased}
      />

      <EditModifierModal
        open={!!editGroup}
        onOpenChange={(open) => !open && setEditGroup(null)}
        group={editGroup}
        existingOptions={options.filter(o => o.groupId === editGroup?.id).sort((a, b) => a.sortOrder - b.sortOrder)}
        ingredients={ingredients}
        isIngredientsBased={isIngredientsBased}
      />

      <AssignModifierModal
        open={!!assignGroup}
        onOpenChange={(open) => !open && setAssignGroup(null)}
        group={assignGroup}
        products={products}
        assignments={assignments}
      />
    </div>
  );
}
