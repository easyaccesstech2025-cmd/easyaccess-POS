import { NextRequest, NextResponse } from "next/server";
import { dbPos } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    // Fetch ONLY the bytea data lazily (Public route for Next.js Image Optimizer)
    const result = await dbPos
      .select({ imageData: products.imageData })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    const imageBuffer = result[0]?.imageData;

    if (!imageBuffer) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Set aggressive caching since product images rarely change
    // Using max-age=86400 (1 day) and stale-while-revalidate=604800 (1 week)
    return new NextResponse(imageBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/jpeg", // Fallback, browser usually sniffs correctly
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Error fetching product image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
