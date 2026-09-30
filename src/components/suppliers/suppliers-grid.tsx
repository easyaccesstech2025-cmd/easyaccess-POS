"use client";

import { useState, useActionState, useTransition, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Phone, Mail, MapPin, User, Building2, Edit, Archive, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { createSupplierAction, editSupplierAction, toggleSupplierArchiveAction } from "@/app/actions/suppliers";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-[#FD6708] hover:bg-[#e55d07] text-white">
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function SuppliersGrid({ suppliers }: { suppliers: any[] }) {
  const [activeSupplier, setActiveSupplier] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "archive" | null>(null);
  const [isPending, startTransition] = useTransition();

  // Action states for Add/Edit
  const [addState, addAction] = useActionState(createSupplierAction, null);
  const [editState, editAction] = useActionState(editSupplierAction, null);
  const router = useRouter();

  // Close modals on success
  useEffect(() => {
    if (addState?.success) {
      setModalMode(null);
      router.refresh();
    }
  }, [addState, router]);

  useEffect(() => {
    if (editState?.success) {
      setModalMode(null);
      router.refresh();
    }
  }, [editState, router]);

  const handleArchiveToggle = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", activeSupplier.id.toString());
      formData.append("action", activeSupplier.isArchived ? "restore" : "archive");
      await toggleSupplierArchiveAction(formData);
      setModalMode(null);
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Suppliers</h2>
        <Button onClick={() => { setActiveSupplier(null); setModalMode("add"); }} className="bg-[#FD6708] hover:bg-[#e55d07] text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 border border-dashed rounded-lg">
            No suppliers found. Click "Add Supplier" to create one.
          </div>
        )}
        
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className={`flex flex-col ${supplier.isArchived ? 'opacity-60 bg-gray-50' : ''}`}>
            <CardContent className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg leading-tight line-clamp-1">{supplier.name}</h3>
                    <Badge variant={supplier.isArchived ? "secondary" : "success"} className="mt-1">
                      {supplier.isArchived ? "Archived" : "Active"}
                    </Badge>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => { setActiveSupplier(supplier); setModalMode("edit"); }}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => { setActiveSupplier(supplier); setModalMode("archive"); }}
                      className={supplier.isArchived ? "text-emerald-600" : "text-red-600"}
                    >
                      {supplier.isArchived ? (
                        <><RotateCcw className="h-4 w-4 mr-2" /> Restore Supplier</>
                      ) : (
                        <><Archive className="h-4 w-4 mr-2" /> Archive Supplier</>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-3 mt-6">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-900 truncate">{supplier.contactPerson || <span className="text-gray-400 italic">No contact person</span>}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-900 truncate">{supplier.phone || <span className="text-gray-400 italic">No phone</span>}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-gray-900 truncate">{supplier.contactInfo || <span className="text-gray-400 italic">No email</span>}</span>
                </div>
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-900 line-clamp-2">{supplier.address || <span className="text-gray-400 italic">No address</span>}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={modalMode === "add" || modalMode === "edit"} onOpenChange={(open) => !open && setModalMode(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{modalMode === "add" ? "Add Supplier" : "Edit Supplier"}</DialogTitle>
          </DialogHeader>
          <form action={modalMode === "add" ? addAction : editAction}>
            {modalMode === "edit" && <input type="hidden" name="id" value={activeSupplier?.id} />}
            <div className="grid gap-4 py-4">
              
              {(modalMode === "add" ? addState : editState)?.error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {(modalMode === "add" ? addState : editState)?.error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier Name <span className="text-red-500">*</span></label>
                <Input name="name" defaultValue={modalMode === "edit" ? activeSupplier?.name : ""} required placeholder="e.g. Global Foods Inc." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person</label>
                <Input name="contactPerson" defaultValue={modalMode === "edit" ? activeSupplier?.contactPerson : ""} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input name="phone" defaultValue={modalMode === "edit" ? activeSupplier?.phone : ""} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input name="email" type="email" defaultValue={modalMode === "edit" ? activeSupplier?.contactInfo : ""} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input name="address" defaultValue={modalMode === "edit" ? activeSupplier?.address : ""} placeholder="Optional" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalMode(null)}>Cancel</Button>
              <SubmitButton label={modalMode === "add" ? "Save Supplier" : "Save Changes"} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Archive Modal */}
      <Dialog open={modalMode === "archive"} onOpenChange={(open) => !open && setModalMode(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{activeSupplier?.isArchived ? "Restore Supplier" : "Archive Supplier"}</DialogTitle>
            <DialogDescription>
              {activeSupplier?.isArchived 
                ? `Are you sure you want to restore ${activeSupplier?.name}? It will be available for selection again.`
                : `Are you sure you want to archive ${activeSupplier?.name}? It will be hidden from selections but history is preserved.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalMode(null)} disabled={isPending}>Cancel</Button>
            <Button variant={activeSupplier?.isArchived ? "default" : "destructive"} onClick={handleArchiveToggle} disabled={isPending}>
              {isPending ? "Updating..." : (activeSupplier?.isArchived ? "Restore Supplier" : "Archive Supplier")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
