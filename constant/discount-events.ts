export type DiscountEvent = {
  id: string;
  title: string;
  description: string;
  active: boolean;
  // Inclusive pickup / delivery dates in Taipei, formatted YYYY-MM-DD; omit a bound for no limit.
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
  discount: {
    // 1: percentage off; 2: fixed amount off in NTD.
    type: 1 | 2;
    value: number;
    minimumOrderAmount?: number;
  };
};

// Add seller-provided event details here; only events marked active appear in the cart.
export const discountEvents: DiscountEvent[] = [
  {
    id: "1",
    title: "Halloween Sale",
    description: "Get 20% off on all products during our Halloween sale!",
    active: true,
    deliveryDateFrom: "2026-10-01",
    deliveryDateTo: "2026-11-30",
    discount: {
      type: 1,
      value: 20,
      minimumOrderAmount: 1000,
    },
  },
];
