import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";
import { MAX_ORDER_QUANTITY } from "@/constant/product-order";
import { cartItemSchema, createProductOrderSchema, type CartItem, type CartProduct, type ProductOrderValues } from "@/schemas/product-order";

type CartState = {
  items: CartItem[];
  addItem: (product: CartProduct, values: ProductOrderValues) => void;
};

const savedCartSchema = z.object({ items: z.array(cartItemSchema) });

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, values) => {
        const order = createProductOrderSchema().parse(values);
        const items = get().items;
        const index = items.findIndex((item) =>
          item.productId === product.id && item.size === order.size && item.pickupDate === order.pickupDate,
        );
        const quantity = order.quantity + (index >= 0 ? items[index].quantity : 0);
        if (quantity > MAX_ORDER_QUANTITY) {
          throw new Error(`Maximum quantity is ${MAX_ORDER_QUANTITY} for the same product, size and pickup date.`);
        }
        const item = cartItemSchema.parse({
          ...order, quantity, productId: product.id, title: product.title, img: product.img, price: product.price,
        });
        try {
          set({ items: index >= 0 ? items.map((existing, i) => i === index ? item : existing) : [...items, item] });
        } catch (error) {
          try {
            set({ items });
          } catch {
            // Persist updates memory before writing, so the previous items are restored even if this write fails.
          }
          throw error;
        }
      },
    }),
    {
      name: "bmt-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      merge: (persisted, current) => {
        const saved = savedCartSchema.safeParse(persisted);
        return { ...current, items: saved.success ? saved.data.items : current.items };
      },
    },
  ),
);
