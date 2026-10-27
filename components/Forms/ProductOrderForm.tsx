"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { MAX_ORDER_QUANTITY, PICKUP_WINDOW_DAYS, PRODUCT_SIZES_CM } from "@/constant/product-order";
import { addPickupDays, getTaipeiDate, isPickupDateAvailable } from "@/lib/pickup";
import { createProductOrderSchema, getProductOrderDefaults, productOrderFieldsSchema, type CartProduct, type ProductOrderValues } from "@/schemas/product-order";
import { formatPrice } from "@/lib/helper";
import { useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductOrderForm({ product, today }: { product: CartProduct; today: string }) {
  const [ready, setReady] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [bookingToday, setBookingToday] = useState(today);
  const [success, setSuccess] = useState("");
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const form = useForm<ProductOrderValues>({
    resolver: zodResolver(createProductOrderSchema()),
    defaultValues: getProductOrderDefaults(today),
  });
  const { setError } = form;
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const validQuantity = productOrderFieldsSchema.shape.quantity.safeParse(quantity);
  const total = validQuantity.success ? product.price * validQuantity.data : null;

  useEffect(() => {
    let mounted = true;
    const persistence = useCartStore.persist;
    const storageError = () => setError("root", { message: "Your saved cart could not be loaded. Check that browser storage is available." });
    if (!persistence) {
      storageError();
      return;
    }
    void Promise.resolve(persistence.rehydrate()).then(() => {
      if (!mounted) return;
      if (persistence.hasHydrated()) setReady(true);
      else storageError();
    }).catch(() => { if (mounted) storageError(); });
    return () => { mounted = false; };
  }, [setError]);

  function onSubmit(values: ProductOrderValues) {
    setSuccess("");
    try {
      addItem(product, values);
      setSuccess("Added to cart. Saved on this device.");
    } catch (error) {
      setError("root", {
        message: error instanceof ZodError ? error.issues[0].message
          : error instanceof Error ? error.message : "Your cart could not be saved. Please try again.",
      });
    }
  }

  return (
    <div className="mt-7 border-t border-primary/10 pt-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 text-left text-sm lg:w-1/2">
          <fieldset disabled={!ready || form.formState.isSubmitting} className="min-w-0 space-y-4">
            <legend className="sr-only">Choose your product options</legend>
            <FormField control={form.control} name="size" render={({ field }) => (
              <FormItem className="grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
                <FormLabel className="font-normal leading-5 text-primary">Size</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger size="sm" className="w-24 max-w-full rounded-sm border-primary/20 bg-white px-2 text-base shadow-none data-[size=sm]:h-11 md:text-sm md:data-[size=sm]:h-8"><SelectValue>{field.value} cm</SelectValue></SelectTrigger></FormControl>
                  <SelectContent className="border-primary/20 bg-background text-primary">
                    {PRODUCT_SIZES_CM.map((size) => <SelectItem key={size} value={size} className="min-h-11 md:min-h-0">{size} cm</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage className="col-start-2 text-red-700" />
              </FormItem>
            )} />

            <FormField control={form.control} name="pickupDate" render={({ field }) => (
              <FormItem className="grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
                <FormLabel className="font-normal leading-5 text-primary">Pickup date</FormLabel>
                <Popover open={pickupOpen} onOpenChange={(open) => {
                  if (open) setBookingToday(getTaipeiDate());
                  setPickupOpen(open);
                }}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button type="button" variant="outline" className="h-11 w-full justify-between gap-1 rounded-sm border-primary/20 bg-white px-2 text-sm font-normal shadow-none md:h-8 md:text-xs">
                        {format(parseISO(field.value), "dd MMM yyyy")}
                        <CalendarIcon aria-hidden="true" className="size-3.5" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent align="start" collisionPadding={8} className="w-auto max-w-[calc(100vw-1rem)] border-primary/20 bg-background p-0 text-primary">
                    <Calendar
                      mode="single"
                      required
                      selected={parseISO(field.value)}
                      defaultMonth={parseISO(field.value)}
                      today={parseISO(bookingToday)}
                      startMonth={parseISO(bookingToday)}
                      endMonth={parseISO(addPickupDays(bookingToday, PICKUP_WINDOW_DAYS))}
                      disabled={(date) => !isPickupDateAvailable(format(date, "yyyy-MM-dd"), bookingToday)}
                      onSelect={(date) => {
                        field.onChange(format(date, "yyyy-MM-dd"));
                        setPickupOpen(false);
                      }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription className="col-span-2 mt-1 text-xs leading-5 text-primary/75">
                  Saturdays and Sundays only, up to {PICKUP_WINDOW_DAYS} days ahead. Dates use Taipei time.
                </FormDescription>
                <FormMessage className="col-start-2 text-red-700" />
              </FormItem>
            )} />

            <FormField control={form.control} name="quantity" render={({ field }) => (
              <FormItem className="grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
                <FormLabel className="font-normal leading-5 text-primary">Quantity</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_ORDER_QUANTITY}
                    step={1}
                    required
                    value={Number.isNaN(field.value) ? "" : field.value}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    className="h-11 w-24 max-w-full rounded-sm border-primary/20 bg-white px-2 text-base shadow-none md:h-8 md:text-sm"
                  />
                </FormControl>
                <FormMessage className="col-start-2 text-red-700" />
              </FormItem>
            )} />
          </fieldset>
          <dl className="divide-y divide-primary/10 border-y border-primary/10">
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 py-4">
              <dt>Unit price</dt>
              <dd className="tabular-nums">{formatPrice(product.price, "TW")}</dd>
            </div>
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 py-5">
              <dt>Total</dt>
              <dd>
                <output aria-label="Total amount" aria-live="polite" className="text-2xl font-normal tabular-nums text-[#8b6d46]">
                  {total === null ? "—" : formatPrice(total, "TW")}
                </output>
              </dd>
            </div>
          </dl>
          {form.formState.errors.root && <p role="alert" className="text-sm text-red-700">{form.formState.errors.root.message}</p>}
          <Button type="submit" disabled={!ready || form.formState.isSubmitting} className="h-12 w-full rounded-lg text-base font-semibold">
            {form.formState.isSubmitting ? "Adding…" : "Add to cart"}
          </Button>
          {success && <p role="status" className="text-sm text-primary">{success} <Link href="/cart" className="inline-flex min-h-11 items-center rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary">View cart</Link></p>}
        </form>
      </Form>
      {ready && (
        <details className="mt-6 border-t border-primary/10 pt-4 text-sm text-primary">
          <summary className="min-h-11 cursor-pointer rounded-sm py-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            Saved cart ({items.reduce((total, item) => total + item.quantity, 0)})
          </summary>
          {items.length ? (
            <ul className="mt-4 space-y-4">
              {items.map((item) => (
                <li key={JSON.stringify([item.productId, item.size, item.pickupDate])}>
                  <p className="break-words">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-primary/80">
                    {item.size} cm · {format(parseISO(item.pickupDate), "dd MMM yyyy")} · Quantity {item.quantity}
                  </p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-primary/80">Your cart is empty.</p>}
        </details>
      )}
    </div>
  );
}
