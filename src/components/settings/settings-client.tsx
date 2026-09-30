"use client";

import { useState, useTransition, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Settings, Users, UserCircle, Store, Shield, Receipt, LogOut } from "lucide-react";
import { 
  updateStoreDetailsAction, 
  updateTenantSettingAction, 
  updateAdminSecurityAction,
  updateAdminEmailAction, 
  createStaffAccountAction, 
  updateStaffPinAction,
  updateStaffAccountAction,
  toggleStaffArchiveAction
} from "@/app/actions/settings";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

export function SettingsClient({ adminData, staffData, tenantSettingsList }: any) {
  const [activeTab, setActiveTab] = useState("Store Details");
  const [isPending, startTransition] = useTransition();

  // Settings Map
  const settingsMap: Record<string, string> = {};
  tenantSettingsList.forEach((s: any) => settingsMap[s.settingKey] = s.settingValue);

  // --- STORE DETAILS STATE ---
  const [companyName, setCompanyName] = useState(adminData.companyName || "");
  const [companyContactNo, setCompanyContactNo] = useState(adminData.companyContactNo || "");
  const [companyAddress, setCompanyAddress] = useState(adminData.companyAddress || "");
  
  const [allowNegativeStock, setAllowNegativeStock] = useState(settingsMap["allow_negative_stock"] === "true");
  const [receiptFooter, setReceiptFooter] = useState(settingsMap["receipt_footer"] || "");

  const handleSaveStoreDetails = () => {
    startTransition(async () => {
      await updateStoreDetailsAction({ companyName, companyAddress, companyContactNo });
      await updateTenantSettingAction("receipt_footer", receiptFooter);
      await updateTenantSettingAction("allow_negative_stock", allowNegativeStock ? "true" : "false");
      toast.success("Settings saved successfully.");
    });
  };

  // --- STAFF ACCOUNTS STATE ---
  const [showArchived, setShowArchived] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<{id?: number, name: string, username: string, pin: string, role: string, accessiblePages: string[]}>({ 
    name: "", username: "", pin: "", role: "CASHIER", accessiblePages: [] 
  });
  
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<{id?: number, name: string, username: string, pin: string, role: string, accessiblePages: string[]}>({ 
    name: "", username: "", pin: "", role: "CASHIER", accessiblePages: [] 
  });

  const [editingStaffPin, setEditingStaffPin] = useState<number | null>(null);
  const [newPin, setNewPin] = useState("");

  const handleCreateStaff = () => {
    if (!newStaff.name || !newStaff.username || !newStaff.pin) return;
    startTransition(async () => {
      await createStaffAccountAction(newStaff);
      setIsAddStaffOpen(false);
      setNewStaff({ name: "", username: "", pin: "", role: "CASHIER", accessiblePages: [] });
      toast.success("Staff account created.");
    });
  };

  const handleUpdateStaff = () => {
    if (!editingStaff.id || !editingStaff.name || !editingStaff.username) return;
    startTransition(async () => {
      await updateStaffAccountAction(editingStaff.id!, editingStaff);
      setIsEditStaffOpen(false);
      toast.success("Staff account updated.");
    });
  };

  const handleToggleArchive = (staffId: number, isArchived: boolean) => {
    startTransition(async () => {
      await toggleStaffArchiveAction(staffId, isArchived);
      toast.success(isArchived ? "Staff account archived." : "Staff account restored.");
    });
  };

  const handleUpdateStaffPin = (staffId: number) => {
    if (!newPin || newPin.length < 4) return;
    startTransition(async () => {
      await updateStaffPinAction(staffId, newPin);
      setEditingStaffPin(null);
      setNewPin("");
      toast.success("Staff PIN updated.");
    });
  };

  // --- MY ACCOUNT STATE ---
  const [oldPin, setOldPin] = useState("");
  const [adminNewPin, setAdminNewPin] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [zreadingEmail, setZreadingEmail] = useState(adminData.email || "");

  const handleSaveMyAccount = () => {
    startTransition(async () => {
      if (adminNewPin || newPassword) {
        const res = await updateAdminSecurityAction({ 
          oldPin: oldPin || undefined, 
          newPin: adminNewPin || undefined, 
          oldPassword: oldPassword || undefined, 
          newPassword: newPassword || undefined 
        });
        if (res.error) {
          toast.error(res.error);
          return;
        }
      }
      
      await updateAdminEmailAction(zreadingEmail);
      toast.success("Account settings saved securely.");
      setOldPin(""); setAdminNewPin(""); setOldPassword(""); setNewPassword("");
    });
  };

  // --- LIVE TIMER ---
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!adminData.subscriptionExpiryDate) return;
    const expiry = new Date(adminData.subscriptionExpiryDate).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = expiry - now;
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${days} Days • ${hours} Hrs • ${mins} Min • ${secs} Sec`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [adminData.subscriptionExpiryDate]);

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start animate-in fade-in duration-500">
      {/* Sidebar Nav */}
      <div className="w-full md:w-64 space-y-2 shrink-0">
        {[
          { id: "Store Details", icon: Store },
          { id: "Staff Accounts", icon: Users },
          { id: "My Account", icon: UserCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3",
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                  : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-blue-200" : "text-gray-400")} />
              {tab.id}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full space-y-6">
        
        {/* ================= STORE DETAILS TAB ================= */}
        {activeTab === "Store Details" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5 text-gray-400" /> Business Identity
                </CardTitle>
                <CardDescription>Update your global business information used on receipts and reports.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Company Name</label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={isPending} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Contact Number</label>
                    <Input value={companyContactNo} onChange={e => setCompanyContactNo(e.target.value)} disabled={isPending} />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Full Business Address</label>
                    <Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} disabled={isPending} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-gray-400" /> Global Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Receipt Footer Message</label>
                  <p className="text-xs text-gray-500 mb-2">This text will print at the bottom of all physical and digital receipts.</p>
                  <Input 
                    value={receiptFooter} 
                    onChange={e => setReceiptFooter(e.target.value)} 
                    placeholder="e.g., Thank you for shopping! Returns allowed within 7 days."
                    disabled={isPending} 
                  />
                </div>

                <div className="flex items-center justify-between py-4 border-t">
                  <div>
                    <h4 className="font-semibold text-gray-900">Allow Negative Inventory</h4>
                    <p className="text-sm text-gray-500">Permit cashiers to sell products even if system stock is 0</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={allowNegativeStock} onChange={e => setAllowNegativeStock(e.target.checked)} disabled={isPending} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveStoreDetails} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
                    {isPending ? "Saving..." : "Save Store Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= STAFF ACCOUNTS TAB ================= */}
        {activeTab === "Staff Accounts" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50/50 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" /> Cashier Management
                  </CardTitle>
                  <CardDescription>Manage your staff PINs and access.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowArchived(!showArchived)}>
                    {showArchived ? "Hide Archived" : "Show Archived"}
                  </Button>
                  <Button onClick={() => setIsAddStaffOpen(true)}>Add Cashier</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 bg-white border-b uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Username</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Access</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {staffData.filter((s: any) => s.isArchived === showArchived).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                          No {showArchived ? "archived" : "active"} staff accounts found.
                        </td>
                      </tr>
                    ) : staffData.filter((s: any) => s.isArchived === showArchived).map((staff: any) => {
                      let pages: string[] = [];
                      try { pages = JSON.parse(staff.accessiblePages || "[]"); } catch (e) {}
                      return (
                        <tr key={staff.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2">
                            {staff.fullName}
                            {staff.isArchived && <Badge variant="destructive" className="text-[10px]">Archived</Badge>}
                          </td>
                          <td className="px-6 py-4 text-gray-500">@{staff.username}</td>
                          <td className="px-6 py-4">
                            <Badge variant={staff.role === "MANAGER" ? "default" : "secondary"}>{staff.role}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {pages.map(p => (
                                <Badge key={p} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{p}</Badge>
                              ))}
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">Sales</Badge>
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">Refunds</Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {editingStaffPin === staff.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <Input 
                                  type="text" 
                                  placeholder="New PIN" 
                                  className="w-24 h-8"
                                  value={newPin}
                                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                                  maxLength={6}
                                />
                                <Button size="sm" onClick={() => handleUpdateStaffPin(staff.id)} disabled={isPending}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingStaffPin(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => setEditingStaffPin(staff.id)}>
                                  Reset PIN
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => {
                                  setEditingStaff({
                                    id: staff.id,
                                    name: staff.fullName || "",
                                    username: staff.username || "",
                                    pin: staff.pincode || "",
                                    role: staff.role || "CASHIER",
                                    accessiblePages: pages
                                  });
                                  setIsEditStaffOpen(true);
                                }}>
                                  Edit
                                </Button>
                                {staff.isArchived ? (
                                  <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleToggleArchive(staff.id, false)} disabled={isPending}>
                                    Restore
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleToggleArchive(staff.id, true)} disabled={isPending}>
                                    Archive
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Staff Member</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 py-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Account Details</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Full Name</label>
                      <Input value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Username (for Login)</label>
                      <Input value={newStaff.username} onChange={e => setNewStaff({...newStaff, username: e.target.value})} placeholder="e.g. johndoe123" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Terminal PIN (6-Digit)</label>
                      <Input value={newStaff.pin} onChange={e => setNewStaff({...newStaff, pin: e.target.value.replace(/\D/g, '')})} placeholder="e.g. 123456" maxLength={6} />
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                      <label className="text-sm font-semibold text-gray-500">Role Preset</label>
                      <div className="flex gap-2">
                        <Button 
                          variant={newStaff.role === "CASHIER" ? "default" : "outline"}
                          className={cn("flex-1", newStaff.role === "CASHIER" && "bg-blue-600 text-white hover:bg-blue-700")}
                          onClick={() => setNewStaff({...newStaff, role: "CASHIER", accessiblePages: []})}
                        >Cashier</Button>
                        <Button 
                          variant={newStaff.role === "MANAGER" ? "default" : "outline"}
                          className={cn("flex-1", newStaff.role === "MANAGER" && "bg-blue-600 text-white hover:bg-blue-700")}
                          onClick={() => setNewStaff({...newStaff, role: "MANAGER", accessiblePages: ["Products", "Ingredients", "Reports", "Cash Drawer", "Expiry Tracker", "Settings"]})}
                        >Manager</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Granular Access (Web Dashboard)</h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {["Products", "Ingredients", "Reports", "Cash Drawer", "Expiry Tracker", "Settings"].map(page => {
                        const isChecked = newStaff.accessiblePages.includes(page);
                        return (
                          <label key={page} className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewStaff({...newStaff, accessiblePages: [...newStaff.accessiblePages, page]});
                                } else {
                                  setNewStaff({...newStaff, accessiblePages: newStaff.accessiblePages.filter(p => p !== page)});
                                }
                              }}
                            />
                            <span className="text-sm font-medium text-gray-700">{page}</span>
                          </label>
                        );
                      })}
                      <div className="pt-3 mt-3 border-t border-gray-200">
                        <label className="flex items-center gap-3 opacity-60">
                          <input type="checkbox" checked disabled className="w-4 h-4 rounded border-gray-300 text-gray-500" />
                          <span className="text-sm font-medium text-gray-500">Sales History (Locked)</span>
                        </label>
                        <label className="flex items-center gap-3 opacity-60 mt-2">
                          <input type="checkbox" checked disabled className="w-4 h-4 rounded border-gray-300 text-gray-500" />
                          <span className="text-sm font-medium text-gray-500">Refunds (Locked)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsAddStaffOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateStaff} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">Create Staff Account</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Staff Member</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 py-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Account Details</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Full Name</label>
                      <Input value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Username (for Login)</label>
                      <Input value={editingStaff.username} onChange={e => setEditingStaff({...editingStaff, username: e.target.value})} placeholder="e.g. johndoe123" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Terminal PIN (6-Digit)</label>
                      <Input value={editingStaff.pin} onChange={e => setEditingStaff({...editingStaff, pin: e.target.value.replace(/\D/g, '')})} placeholder="e.g. 123456" maxLength={6} />
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                      <label className="text-sm font-semibold text-gray-500">Role Preset</label>
                      <div className="flex gap-2">
                        <Button 
                          variant={editingStaff.role === "CASHIER" ? "default" : "outline"}
                          className={cn("flex-1", editingStaff.role === "CASHIER" && "bg-blue-600 text-white hover:bg-blue-700")}
                          onClick={() => setEditingStaff({...editingStaff, role: "CASHIER", accessiblePages: []})}
                        >Cashier</Button>
                        <Button 
                          variant={editingStaff.role === "MANAGER" ? "default" : "outline"}
                          className={cn("flex-1", editingStaff.role === "MANAGER" && "bg-blue-600 text-white hover:bg-blue-700")}
                          onClick={() => setEditingStaff({...editingStaff, role: "MANAGER", accessiblePages: ["Products", "Ingredients", "Reports", "Cash Drawer", "Expiry Tracker", "Settings"]})}
                        >Manager</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Granular Access (Web Dashboard)</h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {["Products", "Ingredients", "Reports", "Cash Drawer", "Expiry Tracker", "Settings"].map(page => {
                        const isChecked = editingStaff.accessiblePages.includes(page);
                        return (
                          <label key={page} className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingStaff({...editingStaff, accessiblePages: [...editingStaff.accessiblePages, page]});
                                } else {
                                  setEditingStaff({...editingStaff, accessiblePages: editingStaff.accessiblePages.filter(p => p !== page)});
                                }
                              }}
                            />
                            <span className="text-sm font-medium text-gray-700">{page}</span>
                          </label>
                        );
                      })}
                      <div className="pt-3 mt-3 border-t border-gray-200">
                        <label className="flex items-center gap-3 opacity-60">
                          <input type="checkbox" checked disabled className="w-4 h-4 rounded border-gray-300 text-gray-500" />
                          <span className="text-sm font-medium text-gray-500">Sales History (Locked)</span>
                        </label>
                        <label className="flex items-center gap-3 opacity-60 mt-2">
                          <input type="checkbox" checked disabled className="w-4 h-4 rounded border-gray-300 text-gray-500" />
                          <span className="text-sm font-medium text-gray-500">Refunds (Locked)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsEditStaffOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdateStaff} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* ================= MY ACCOUNT TAB ================= */}
        {activeTab === "My Account" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <Card className="shadow-sm border-blue-100 overflow-hidden">
              <div className="bg-blue-50/50 p-6 border-b border-blue-100 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-blue-900">{adminData.companyName || "Admin Account"}</h3>
                  <p className="text-blue-600/80 mt-1">@{adminData.username}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                  Active Subscription
                </Badge>
              </div>
              <div className="p-6 bg-white flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Valid Until</p>
                  <div className="flex flex-col">
                    <p className="text-xl font-bold text-gray-900">
                      {adminData.subscriptionExpiryDate ? new Date(adminData.subscriptionExpiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}) : "Lifetime"}
                    </p>
                    {timeLeft && <p className="text-sm font-mono text-emerald-600 font-medium mt-1">{timeLeft}</p>}
                  </div>
                </div>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
              </div>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gray-400" /> Security & Notifications
                </CardTitle>
                <CardDescription>Update your Master PIN or Web Password. Leave blank if unchanged.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* PIN Section */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Terminal PIN</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Current 6-Digit PIN</label>
                      <Input 
                        type="password"
                        value={oldPin} 
                        onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))} 
                        maxLength={6}
                        disabled={isPending} 
                        placeholder="Required to change PIN"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">New 6-Digit PIN</label>
                      <Input 
                        type="password"
                        value={adminNewPin} 
                        onChange={e => setAdminNewPin(e.target.value.replace(/\D/g, ''))} 
                        maxLength={6}
                        disabled={isPending} 
                      />
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Web Password</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Current Password</label>
                      <Input 
                        type="password"
                        value={oldPassword} 
                        onChange={e => setOldPassword(e.target.value)} 
                        disabled={isPending} 
                        placeholder="Required to change password"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">New Password</label>
                      <Input 
                        type="password"
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)} 
                        disabled={isPending} 
                      />
                    </div>
                  </div>

                  {/* Z-Reading Email Section */}
                  <div className="col-span-1 md:col-span-2 space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <label className="text-sm font-semibold text-gray-900">Z-Reading Notification Email</label>
                    <p className="text-xs text-gray-500 mb-2">The exact email address where your terminals will send End-of-Day reports.</p>
                    <Input 
                      type="email"
                      value={zreadingEmail} 
                      onChange={e => setZreadingEmail(e.target.value)} 
                      disabled={isPending} 
                      placeholder="e.g. owner@example.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t mt-4">
                  <Button onClick={handleSaveMyAccount} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
                    {isPending ? "Saving..." : "Save Account Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}





