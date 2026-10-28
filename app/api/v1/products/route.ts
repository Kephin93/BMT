import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { hasProductWriteSession } from "@/lib/server/product-session";
import { serverConfig } from "@/config/server";
import { listProducts, createProduct } from "@/lib/server/products";

export async function GET() {
  const data = await listProducts();
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  if (!hasProductWriteSession(req.cookies.get(serverConfig.authCookieName)?.value)) {
    return NextResponse.json({ error: "Please sign in again to add products." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid product submission." }, { status: 400 });
  }
  try {
    const created = await createProduct(body);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Product could not be saved. Please try again." }, { status: 500 });
  }
}
