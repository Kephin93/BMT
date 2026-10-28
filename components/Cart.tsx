"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { groupCartByDate } from "@/lib/cart";
import { formatPrice } from "@/lib/helper";
import { getTaipeiDate, isPickupDateAvailable } from "@/lib/pickup";
import { checkoutSchema, type CheckoutResult } from "@/schemas/checkout";
import type { CartItem } from "@/schemas/product-order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { discountEvents } from "@/constant/discount-events";
import { calculateOrderPricing } from "@/lib/discounts";

const activeDiscountEvents = discountEvents.filter(event => event.active);

export default function Cart() {
  const items = useCartStore(state => state.items);
  const removeItem = useCartStore(state => state.removeItem);
  const removeSubmittedItems = useCartStore(state => state.removeSubmittedItems);
  const prepareCheckout = useCartStore(state => state.prepareCheckout);
  const [ready, setReady] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [lineId, setLineId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [storageWarning, setStorageWarning] = useState("");
  const submittingRef = useRef(false);
  const groups = groupCartByDate(items).map(group => ({ ...group, pricing: calculateOrderPricing(group.items, discountEvents, group.pickupDate) }));
  const subtotal = groups.reduce((sum, group) => sum + Math.round(group.pricing.subtotal * 100), 0) / 100;
  const discountAmount = groups.reduce((sum, group) => sum + Math.round(group.pricing.discountAmount * 100), 0) / 100;
  const total = groups.reduce((sum, group) => sum + Math.round(group.pricing.total * 100), 0) / 100;

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      try {
        const persistence = useCartStore.persist;
        if (!persistence) throw new Error();
        await persistence.rehydrate();
        if (!persistence.hasHydrated()) throw new Error();
        if (mounted) setReady(true);
      } catch {
        if (mounted) setError("Your cart could not be loaded. Check browser storage and reload this page.");
      }
    }
    void hydrate();
    return () => { mounted = false; };
  }, []);

  function remove(item: CartItem) {
    setError("");
    try {
      removeItem(item);
    } catch {
      setError("The item could not be removed. Check that browser storage is available.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || submittingRef.current || result) return;
    setError("");
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const selections = items.map(({ productId, size, quantity, pickupDate }) => ({ productId, size, quantity, pickupDate }));
      const fingerprint = JSON.stringify({ customerName: customerName.trim(), lineId: lineId.trim(), items: selections });
      const requestId = prepareCheckout(fingerprint);
      const parsed = checkoutSchema.safeParse({ customerName, lineId, items: selections, requestId });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Your orders could not be registered. Please try again.");
      setResult(body.data);
      try {
        removeSubmittedItems(items);
      } catch {
        setStorageWarning("Your orders were registered, but this device could not clear the ordered items. Do not submit them again.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Your orders could not be registered. Your cart has been kept.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 text-primary sm:px-6 md:py-14">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-semibold sm:text-3xl">Your cart</h1>
        <p className="mt-3 text-sm leading-7 text-primary/80">A little sweetness, planned ahead.</p>
      </header>

      {error && <p role="alert" className="mb-6 rounded-lg border border-red-700/20 bg-white p-4 text-sm text-red-700">{error}</p>}

      {result ? (
        <section aria-labelledby="order-success" className="rounded-2xl border border-primary/15 bg-white p-5 sm:p-8">
          <h2 id="order-success" className="text-xl font-semibold" role="status">Your pre-orders are registered</h2>
          <p className="mt-3 text-sm leading-7">We will contact you through LINE to confirm each order and arrange pickup or any agreed delivery.</p>
          <ul className="mt-5 space-y-4">
            {result.orders.map(order => (
              <li key={order.id} className="rounded-lg bg-background p-4 text-sm">
                <p className="font-medium">{format(parseISO(order.pickupDate), "EEE, dd MMM yyyy")}</p>
                {order.discountAmount > 0 && <p className="mt-1">Discount: −{formatPrice(order.discountAmount, "TW")}</p>}
                <p className="mt-1">{formatPrice(order.total, "TW")}</p>
                <p className="mt-2 break-all text-xs text-primary/75">Order reference: {order.id}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 font-medium">Total: {formatPrice(result.total, "TW")}</p>
          {storageWarning && <p role="alert" className="mt-4 text-sm text-red-700">{storageWarning}</p>}
          <Link href="/products" className="mt-5 inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary">Continue browsing</Link>
        </section>
      ) : !ready ? (
        <p role="status" className="py-10 text-center text-sm">{error ? "Cart unavailable." : "Loading your cart…"}</p>
      ) : !items.length ? (
        <section className="rounded-2xl border border-primary/15 bg-white px-5 py-12 text-center">
          <h2 className="text-xl">Your cart is empty</h2>
          <p className="mt-3 text-sm leading-7">Choose a cake and a pickup date to get started.</p>
          <Link href="/products" className="mt-5 inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary">Explore our cakes</Link>
        </section>
      ) : (
        <form onSubmit={submit} className="space-y-8">
          <fieldset disabled={submitting} className="min-w-0 rounded-2xl border border-primary/15 bg-white p-5 sm:p-7">
            <legend className="sr-only">Customer details</legend>
            <h2 className="text-lg font-semibold">Your details</h2>
            <p id="line-help" className="mt-2 text-sm leading-6 text-primary/80">We will contact you through LINE after you submit your pre-orders. Please make sure we can reach you.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="customer-name" className="mb-2 block text-sm font-medium">Customer name</label>
                <Input id="customer-name" name="customerName" autoComplete="name" required maxLength={100} value={customerName} onChange={event => setCustomerName(event.target.value)} className="h-11 border-primary/25 text-base" />
              </div>
              <div>
                <label htmlFor="line-id" className="mb-2 block text-sm font-medium">LINE ID</label>
                <Input id="line-id" name="lineId" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-describedby="line-help" required maxLength={100} value={lineId} onChange={event => setLineId(event.target.value)} className="h-11 border-primary/25 text-base" />
              </div>
            </div>
          </fieldset>

          <div className="space-y-6">
            {groups.map(({ pickupDate, items: dateItems, pricing }, index) => (
              <section key={pickupDate} aria-labelledby={`date-${pickupDate}`} className="overflow-hidden rounded-2xl border border-primary/15 bg-white">
                <header className="border-b border-primary/10 bg-muted/50 px-5 py-4 sm:px-7">
                  <p className="text-xs text-primary/75">Order {index + 1} · Pickup / delivery date</p>
                  <h2 id={`date-${pickupDate}`} className="mt-1 text-lg font-semibold">{format(parseISO(pickupDate), "EEE, dd MMM yyyy")}</h2>
                  {!isPickupDateAvailable(pickupDate, getTaipeiDate()) && <p className="mt-2 text-sm text-red-700">This date is no longer available. Remove these items and choose a new date.</p>}
                </header>
                <ul className="divide-y divide-primary/10 px-5 sm:px-7">
                  {dateItems.map(item => (
                    <li key={JSON.stringify([item.productId, item.size])} className="flex gap-3 py-5 sm:gap-5">
                      <Link href={`/products/${encodeURIComponent(item.productId)}`} aria-label={`View ${item.title}`} className="size-16 shrink-0 self-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:size-20">
                        <img src={item.img || "/default.webp"} alt="" className="h-full w-full rounded-lg bg-muted object-cover" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${encodeURIComponent(item.productId)}`} className="inline-flex min-h-11 items-center break-words rounded-sm text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-primary">{item.title}</Link>
                        <p className="text-xs leading-6 text-primary/75">{item.size} cm · Quantity {item.quantity}</p>
                        <p className="mt-1 text-sm">{formatPrice(item.price, "TW")} each</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end justify-between gap-3 text-right">
                        <Button type="button" variant="ghost" disabled={submitting} onClick={() => remove(item)} aria-label={`Remove ${item.title}, ${item.size} cm, ${pickupDate}`} className="size-11 p-0"><Trash2 aria-hidden="true" className="size-4" /></Button>
                        <p className="text-sm font-medium tabular-nums">
                          <span className="mb-1 block text-xs font-normal text-primary/75">Subtotal</span>
                          {formatPrice(item.price * item.quantity, "TW")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2 border-t border-primary/10 px-5 py-4 text-right text-sm sm:px-7">
                  {pricing.appliedDiscount && <>
                    <p>Subtotal: {formatPrice(pricing.subtotal, "TW")}</p>
                    <p className="break-words">{pricing.appliedDiscount.title}: −{formatPrice(pricing.discountAmount, "TW")}</p>
                  </>}
                  <p className="font-medium">Order total: {formatPrice(pricing.total, "TW")}</p>
                </div>
              </section>
            ))}
          </div>

          {activeDiscountEvents.length > 0 && (
            <section aria-labelledby="discount-events" className="rounded-2xl border border-primary/15 bg-accent/30 p-5 sm:p-7">
              <h2 id="discount-events" className="text-lg font-semibold">Discount events</h2>
              <ul className="mt-4 space-y-4">
                {activeDiscountEvents.map(event => (
                  <li key={event.id} className="min-w-0 break-words">
                    <h3 className="text-sm font-medium">{event.title}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm leading-7 text-primary/80">{event.description}</p>
                    <p className="mt-2 text-sm font-medium">
                      {event.discount.type === 1 ? `${event.discount.value}% off` : `${formatPrice(event.discount.value, "TW")} off`}
                      {(event.discount.minimumOrderAmount ?? 0) > 0 && ` on orders of ${formatPrice(event.discount.minimumOrderAmount!, "TW")} or more`}
                    </p>
                    {(event.deliveryDateFrom || event.deliveryDateTo) && (
                      <p className="mt-2 text-xs leading-6 text-primary/75">
                        Pickup / delivery dates: {event.deliveryDateFrom && event.deliveryDateTo
                          ? `${event.deliveryDateFrom} to ${event.deliveryDateTo} (inclusive)`
                          : event.deliveryDateFrom ? `on or after ${event.deliveryDateFrom}` : `on or before ${event.deliveryDateTo}`}.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-6 text-primary/75">The largest eligible discount applies to each pickup / delivery date separately. Offers do not combine.</p>
            </section>
          )}

          <footer className="rounded-2xl border border-primary/15 bg-white p-5 sm:p-7">
            {discountAmount > 0 && <div className="mb-4 space-y-2 border-b border-primary/10 pb-4 text-right text-sm">
              <p>Subtotal: {formatPrice(subtotal, "TW")}</p>
              <p>Discount: −{formatPrice(discountAmount, "TW")}</p>
            </div>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">{groups.length} {groups.length === 1 ? "order" : "orders"} · One order per date</p>
              <p className="text-xl font-semibold">{formatPrice(total, "TW")}</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-primary/80">Pickup is standard. Any requested Taipei delivery must be confirmed through LINE. Payment is by bank transfer: 50% upfront or the full amount upfront.</p>
            <p className="mt-2 text-xs leading-6 text-primary/75">Prices are checked when you submit. We will confirm payment and pickup / delivery details through LINE. Payments are non-refundable; changes must be requested at least 2 days before your date. <Link href="/faq" className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary">Read our FAQ</Link>.</p>
            <Button type="submit" disabled={submitting} className="mt-5 min-h-12 w-full whitespace-normal px-4 text-base">{submitting ? "Registering your orders…" : `Submit ${groups.length === 1 ? "pre-order" : `${groups.length} pre-orders`}`}</Button>
          </footer>
        </form>
      )}
    </div>
  );
}
