"use server";

import { auth } from "@/lib/auth";
import { dbAuth } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function verifyPinAction(pin: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  
  const userId = parseInt(session.user.id);

  const userData = await dbAuth.select({ pincode: users.pincode }).from(users).where(eq(users.id, userId)).limit(1);
  
  if (userData.length > 0 && userData[0].pincode === pin) {
    return { success: true };
  }
  
  return { success: false, error: "Incorrect PIN" };
}
