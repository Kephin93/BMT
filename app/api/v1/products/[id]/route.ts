import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { serverConfig } from "@/config/server";
import { hasProductWriteSession } from "@/lib/server/product-session";
import { updateProduct } from "@/lib/server/products";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!hasProductWriteSession(req.cookies.get(serverConfig.authCookieName)?.value)) {
    return NextResponse.json({ error: "Please sign in again to edit products." }, { status: 401 });
  }
  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid product submission." }, { status: 400 });
  }
  try {
    const { id } = await params;
    const updated = await updateProduct(id, input);
    if (!updated) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Product could not be saved. Please try again." }, { status: 500 });
  }
}
