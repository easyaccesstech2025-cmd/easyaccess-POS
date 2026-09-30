"use server";

import { dbAuth, dbPos } from "@/lib/db";
import { users as authUsers } from "@/lib/db/schema";
import { tenantSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateStoreDetailsAction(data: {
  companyName: string;
  companyAddress: string;
  companyContactNo: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    await dbAuth.update(authUsers).set({
      companyName: data.companyName,
      companyAddress: data.companyAddress,
      companyContactNo: data.companyContactNo
    }).where(eq(authUsers.id, userId));

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateTenantSettingAction(key: string, value: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    const existing = await dbPos.select().from(tenantSettings).where(
      and(eq(tenantSettings.userId, userId), eq(tenantSettings.settingKey, key))
    );

    if (existing.length > 0) {
      await dbPos.update(tenantSettings).set({ settingValue: value }).where(
        and(eq(tenantSettings.userId, userId), eq(tenantSettings.settingKey, key))
      );
    } else {
      await dbPos.insert(tenantSettings).values({
        userId,
        settingKey: key,
        settingValue: value
      });
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

import bcrypt from "bcryptjs";

export async function updateAdminSecurityAction(data: { 
  oldPin?: string; 
  newPin?: string; 
  oldPassword?: string; 
  newPassword?: string; 
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    const admin = await dbAuth.select().from(authUsers).where(eq(authUsers.id, userId)).limit(1);
    if (admin.length === 0) return { error: "Admin not found." };
    const currentAdmin = admin[0];

    const updatePayload: any = {};

    // Handle PIN update
    if (data.newPin) {
      if (!data.oldPin || currentAdmin.pincode !== data.oldPin) {
        return { error: "Incorrect current PIN." };
      }
      updatePayload.pincode = data.newPin;
    }

    // Handle Password update
    if (data.newPassword) {
      if (!data.oldPassword) return { error: "Current password is required." };
      const isValid = bcrypt.compareSync(data.oldPassword, currentAdmin.password);
      if (!isValid) return { error: "Incorrect current password." };
      updatePayload.password = bcrypt.hashSync(data.newPassword, 10);
    }

    if (Object.keys(updatePayload).length > 0) {
      await dbAuth.update(authUsers).set(updatePayload).where(eq(authUsers.id, userId));
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateAdminEmailAction(email: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    await dbAuth.update(authUsers).set({ email }).where(eq(authUsers.id, userId));
    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createStaffAccountAction(data: { 
  name: string; 
  username: string; 
  pin: string;
  role: string;
  accessiblePages: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    await dbAuth.insert(authUsers).values({
      fullName: data.name,
      username: data.username,
      password: "password123", // Default password for cashiers to access web dashboard
      pincode: data.pin,
      role: data.role,
      accessiblePages: JSON.stringify(data.accessiblePages),
      parentAdminId: userId
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateStaffPinAction(staffId: number, pin: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    // Ensure the staff belongs to this admin
    const staff = await dbAuth.select().from(authUsers).where(
      and(eq(authUsers.id, staffId), eq(authUsers.parentAdminId, userId))
    );

    if (staff.length === 0) return { error: "Staff not found or unauthorized." };

    await dbAuth.update(authUsers).set({ pincode: pin }).where(eq(authUsers.id, staffId));

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateStaffAccountAction(staffId: number, data: { 
  name: string; 
  username: string; 
  pin: string;
  role: string;
  accessiblePages: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    const staff = await dbAuth.select().from(authUsers).where(
      and(eq(authUsers.id, staffId), eq(authUsers.parentAdminId, userId))
    );

    if (staff.length === 0) return { error: "Staff not found or unauthorized." };

    await dbAuth.update(authUsers).set({
      fullName: data.name,
      username: data.username,
      pincode: data.pin,
      role: data.role,
      accessiblePages: JSON.stringify(data.accessiblePages)
    }).where(eq(authUsers.id, staffId));

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function toggleStaffArchiveAction(staffId: number, isArchived: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = parseInt(session.user.id);

  try {
    const staff = await dbAuth.select().from(authUsers).where(
      and(eq(authUsers.id, staffId), eq(authUsers.parentAdminId, userId))
    );

    if (staff.length === 0) return { error: "Staff not found or unauthorized." };

    await dbAuth.update(authUsers).set({ isArchived }).where(eq(authUsers.id, staffId));

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
