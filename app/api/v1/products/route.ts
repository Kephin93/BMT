import { NextResponse } from "next/server";
import { listProducts, createProduct } from "@/lib/server/products";

export async function GET() {
  const data = await listProducts();
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await createProduct(body);
  return NextResponse.json({ data: created }, { status: 201 });
}
