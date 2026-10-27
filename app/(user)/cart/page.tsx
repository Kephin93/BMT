import type { Metadata } from "next";
import Cart from "@/components/Cart";

export const metadata: Metadata = {
  title: "Your Cart | Bite Me Tender",
  description: "Review your cakes by pickup or delivery date and submit your pre-orders.",
};

export default function CartPage() {
  return <Cart />;
}
