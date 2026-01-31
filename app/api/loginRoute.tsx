import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  const snap = await adminDb.collection("product").limit(20).get();
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const body = await req.json();
  const ref = await adminDb.collection("product").add({
    ...body,
    createdAt: new Date(),
  });
  return NextResponse.json({ id: ref.id }, { status: 201 });
}
