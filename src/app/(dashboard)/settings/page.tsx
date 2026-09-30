import { dbAuth, dbPos } from "@/lib/db";
import { users as authUsers, tenantSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { SettingsClient } from "@/components/settings/settings-client";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  
  const userId = parseInt(session.user.id);

  // Fetch Master Admin Data
  const adminQuery = await dbAuth.select().from(authUsers).where(eq(authUsers.id, userId)).limit(1);
  const adminData = adminQuery[0];

  // Fetch Staff Accounts
  const staffData = await dbAuth.select().from(authUsers).where(eq(authUsers.parentAdminId, userId));

  // Fetch Tenant Settings
  const tenantSettingsList = await dbPos.select().from(tenantSettings).where(eq(tenantSettings.userId, userId));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h2>
        <p className="text-gray-500">Manage your global business configurations.</p>
      </div>

      <SettingsClient 
        adminData={adminData} 
        staffData={staffData} 
        tenantSettingsList={tenantSettingsList} 
      />
    </div>
  );
}
