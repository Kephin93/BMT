import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { CheckoutError, registerOrders } from "@/lib/server/orders";

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid order submission." }, { status: 400 });
  }
  try {
    const data = await registerOrders(input);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Order registration failed", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Your orders could not be registered. Your cart has been kept; please try again." }, { status: 500 });
  }
}
