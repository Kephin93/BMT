import { discountEvents, type DiscountEvent } from "@/constant/discount-events";
import { z } from "zod";

const dateSchema = z.iso.date();

export type OrderPricing = {
  subtotal: number;
  discountAmount: number;
  total: number;
  appliedDiscount: {
    id: string;
    title: string;
    type: 1 | 2;
    value: number;
    minimumOrderAmount: number;
    deliveryDateFrom: string | null;
    deliveryDateTo: string | null;
  } | null;
};

export function calculateOrderPricing(
  items: { price: number; quantity: number }[],
  events: DiscountEvent[] = discountEvents,
  deliveryDate?: string,
): OrderPricing {
  const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  let discountCents = 0;
  let appliedDiscount: OrderPricing["appliedDiscount"] = null;

  // Use the largest eligible discount per date-based order; events do not stack.
  for (const event of events) {
    const rule = event.discount;
    if (!event.active || !rule) continue;
    const { deliveryDateFrom, deliveryDateTo } = event;
    if (deliveryDateFrom !== undefined || deliveryDateTo !== undefined) {
      if (!dateSchema.safeParse(deliveryDate).success) continue;
      if (deliveryDateFrom !== undefined && (!dateSchema.safeParse(deliveryDateFrom).success || deliveryDate! < deliveryDateFrom)) continue;
      if (deliveryDateTo !== undefined && (!dateSchema.safeParse(deliveryDateTo).success || deliveryDate! > deliveryDateTo)) continue;
      if (deliveryDateFrom && deliveryDateTo && deliveryDateFrom > deliveryDateTo) continue;
    }
    const minimumOrderAmount = rule.minimumOrderAmount ?? 0;
    if (!Number.isFinite(rule.value) || rule.value <= 0 ||
      !Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0 ||
      subtotalCents < Math.round(minimumOrderAmount * 100)) continue;
    if (rule.type !== 1 && rule.type !== 2) continue;
    if (rule.type === 1 && rule.value > 100) continue;

    const saving = Math.min(subtotalCents, rule.type === 1
      ? Math.round(subtotalCents * rule.value / 100)
      : Math.round(rule.value * 100));
    if (saving > discountCents) {
      discountCents = saving;
      appliedDiscount = {
        id: event.id, title: event.title, type: rule.type, value: rule.value, minimumOrderAmount,
        deliveryDateFrom: deliveryDateFrom ?? null, deliveryDateTo: deliveryDateTo ?? null,
      };
    }
  }

  return {
    subtotal: subtotalCents / 100,
    discountAmount: discountCents / 100,
    total: (subtotalCents - discountCents) / 100,
    appliedDiscount,
  };
}
