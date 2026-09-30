"use server";

import { dbPos as db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createSupplierAction(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;

  if (!name || name.trim() === "") return { error: "Name is required" };

  try {
    await db.insert(suppliers).values({
      userId: Number(session.user.id),
      name: name.trim(),
      contactPerson: contactPerson ? contactPerson.trim() : null,
      phone: phone ? phone.trim() : null,
      contactInfo: email ? email.trim() : null,
      address: address ? address.trim() : null,
      isArchived: false,
    });
    
    revalidatePath("/suppliers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function editSupplierAction(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const address = formData.get("address") as string;

  if (!id || !name || name.trim() === "") return { error: "Invalid data" };

  try {
    await db.update(suppliers)
      .set({
        name: name.trim(),
        contactPerson: contactPerson ? contactPerson.trim() : null,
        phone: phone ? phone.trim() : null,
        contactInfo: email ? email.trim() : null,
        address: address ? address.trim() : null,
      })
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, Number(session.user.id))));
      
    revalidatePath("/suppliers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function toggleSupplierArchiveAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return;

  const id = Number(formData.get("id"));
  const action = formData.get("action") as string;
  
  if (!id) return;

  try {
    await db.update(suppliers)
      .set({ isArchived: action === "archive" })
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, Number(session.user.id))));
      
    revalidatePath("/suppliers");
  } catch (error) {
    console.error("Failed to archive/restore supplier", error);
  }
}
