import { z } from "zod";
import { productOrderFieldsSchema } from "@/schemas/product-order";
import type { OrderPricing } from "@/lib/discounts";

export const checkoutSchema = z.object({
  requestId: z.uuid(),
  customerName: z.string().trim().min(1, "Enter your name.").max(100),
  lineId: z.string().trim().min(1, "Enter your LINE ID.").max(100),
  items: z.array(productOrderFieldsSchema.extend({
    productId: z.string().min(1).max(1500).refine(
      (id) => !id.includes("/") && id !== "." && id !== "..",
      "Invalid product.",
    ),
  })).min(1, "Your cart is empty.").max(100),
});

export type CheckoutResult = {
  orders: ({ id: string; pickupDate: string } & OrderPricing)[];
  subtotal: number;
  discountAmount: number;
  total: number;
};
