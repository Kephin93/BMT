import { z } from "zod";
import { MAX_ORDER_QUANTITY, PICKUP_WINDOW_DAYS, PRODUCT_SIZES_CM } from "@/constant/product-order";
import { getDefaultPickupDate, getTaipeiDate, isPickupDateAvailable } from "@/lib/pickup";
import type { Product } from "@/interfaces";

export const productOrderFieldsSchema = z.object({
  size: z.enum(PRODUCT_SIZES_CM),
  pickupDate: z.iso.date(),
  quantity: z.number().int().min(1).max(MAX_ORDER_QUANTITY),
});

export function createProductOrderSchema(today?: string) {
  return productOrderFieldsSchema.refine(
    (values) => isPickupDateAvailable(values.pickupDate, today),
    { path: ["pickupDate"], message: `Choose a Saturday or Sunday within the next ${PICKUP_WINDOW_DAYS} days.` },
  );
}

export type ProductOrderValues = z.infer<typeof productOrderFieldsSchema>;
export type CartProduct = Pick<Product, "title" | "img" | "price"> & { id: string };

export function getProductOrderDefaults(today = getTaipeiDate()): ProductOrderValues {
  return { size: PRODUCT_SIZES_CM[0], pickupDate: getDefaultPickupDate(today), quantity: 1 };
}

export const cartItemSchema = productOrderFieldsSchema.extend({
  productId: z.string().min(1),
  title: z.string().min(1),
  img: z.string(),
  price: z.number().nonnegative(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
