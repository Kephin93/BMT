import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";
import { MAX_ORDER_QUANTITY } from "@/constant/product-order";
import { cartItemSchema, createProductOrderSchema, type CartItem, type CartProduct, type ProductOrderValues } from "@/schemas/product-order";

type CartState = {
  items: CartItem[];
  checkoutRequest: { fingerprint: string; requestId: string } | null;
  prepareCheckout: (fingerprint: string) => string;
  addItem: (product: CartProduct, values: ProductOrderValues) => void;
  removeItem: (item: CartItem) => void;
  removeSubmittedItems: (items: CartItem[]) => void;
};

const savedCartSchema = z.object({
  items: z.array(cartItemSchema),
  checkoutRequest: z.object({ fingerprint: z.string(), requestId: z.uuid() }).nullable().optional(),
});

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      function saveState(next: Partial<Pick<CartState, "items" | "checkoutRequest">>) {
        const previous = { items: get().items, checkoutRequest: get().checkoutRequest };
        try {
          set(next);
        } catch (error) {
          try {
            set(previous);
          } catch {
            // Persist updates memory before writing, so the previous items are restored even if this write fails.
          }
          throw error;
        }
      }
      const saveItems = (items: CartItem[]) => saveState({ items });
      const sameSelection = (a: CartItem, b: CartItem) =>
        a.productId === b.productId && a.size === b.size && a.pickupDate === b.pickupDate;
      return {
        items: [],
        checkoutRequest: null,
        prepareCheckout: (fingerprint) => {
          const existing = get().checkoutRequest;
          if (existing?.fingerprint === fingerprint) return existing.requestId;
          const requestId = crypto.randomUUID();
          saveState({ checkoutRequest: { fingerprint, requestId } });
          return requestId;
        },
        removeItem: (item) => saveItems(get().items.filter(existing => !sameSelection(existing, item))),
        removeSubmittedItems: (submitted) => saveState({
          checkoutRequest: null,
          items: get().items.flatMap(item => {
            const ordered = submitted.find(existing => sameSelection(existing, item));
            const quantity = item.quantity - (ordered?.quantity ?? 0);
            return quantity > 0 ? [{ ...item, quantity }] : [];
          }),
        }),
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
          saveItems(index >= 0 ? items.map((existing, i) => i === index ? item : existing) : [...items, item]);
        },
      };
    },
    {
      name: "bmt-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items, checkoutRequest: state.checkoutRequest }),
      merge: (persisted, current) => {
        const saved = savedCartSchema.safeParse(persisted);
        return saved.success
          ? { ...current, items: saved.data.items, checkoutRequest: saved.data.checkoutRequest ?? null }
          : current;
      },
    },
  ),
);
