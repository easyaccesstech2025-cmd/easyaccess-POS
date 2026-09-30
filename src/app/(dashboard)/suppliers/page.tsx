import { dbPos as db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuppliersGrid } from "@/components/suppliers/suppliers-grid";

export default async function SuppliersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const suppliersData = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.userId, Number(session.user.id)))
    .orderBy(desc(suppliers.id));

  return (
    <div className="space-y-6">
      <SuppliersGrid suppliers={suppliersData} />
    </div>
  );
}
