import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { checkoutSchema, type CheckoutResult } from "@/schemas/checkout";
import { cartItemSchema, createProductOrderSchema } from "@/schemas/product-order";
import { groupCartByDate } from "@/lib/cart";
import { getTaipeiDate } from "@/lib/pickup";
import { MAX_ORDER_QUANTITY } from "@/constant/product-order";
import { calculateOrderPricing } from "@/lib/discounts";

export class CheckoutError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function registerOrders(input: unknown, today = getTaipeiDate()): Promise<CheckoutResult> {
  const { requestId, customerName, lineId, items } = checkoutSchema.parse(input);
  const fingerprint = JSON.stringify({ customerName, lineId, items });
  const receiptRef = adminDb.collection("checkouts").doc(requestId);

  return adminDb.runTransaction(async (transaction) => {
    const receipt = await transaction.get(receiptRef);
    if (receipt.exists) {
      const saved = receipt.data()!;
      if (saved.fingerprint !== fingerprint) {
        throw new CheckoutError("This request ID belongs to a different submission. Reload the cart to start again.", 409);
      }
      return saved.result as CheckoutResult;
    }

    const quantities = new Map<string, number>();
    for (const item of items) {
      if (!createProductOrderSchema(today).safeParse(item).success) {
        throw new CheckoutError("A pickup / delivery date is no longer available. Remove that item and choose a new date.");
      }
      const key = JSON.stringify([item.productId, item.size, item.pickupDate]);
      const quantity = (quantities.get(key) ?? 0) + item.quantity;
      if (quantity > MAX_ORDER_QUANTITY) {
        throw new CheckoutError(`Maximum quantity is ${MAX_ORDER_QUANTITY} for the same product, size and date.`);
      }
      quantities.set(key, quantity);
    }

    const productIds = [...new Set(items.map(item => item.productId))];
    const snapshots = await transaction.getAll(...productIds.map(id => adminDb.collection("product").doc(id)));
    const products = new Map(productIds.map((id, index) => [id, snapshots[index]]));
    const verifiedItems = items.map(item => {
      const snapshot = products.get(item.productId)!;
      if (!snapshot.exists) throw new CheckoutError("A cake in your cart is no longer available. Remove it before submitting.");
      const product = snapshot.data()!;
      const verified = cartItemSchema.safeParse({
        ...item, title: product.title,
        img: Array.isArray(product.img) ? product.img[0] ?? "" : undefined,
        price: product.price,
      });
      if (!verified.success) throw new CheckoutError("A cake cannot be ordered right now. Please contact us through LINE.");
      return verified.data;
    });

    const orders = groupCartByDate(verifiedItems).map(({ pickupDate, items }) => {
      const ref = adminDb.collection("orders").doc(`${requestId}-${pickupDate}`);
      const pricing = calculateOrderPricing(items, undefined, pickupDate);
      transaction.set(ref, {
        checkoutId: requestId, customerName, lineId, pickupDate, items, ...pricing,
        currency: "TWD", status: "pending_confirmation", paymentStatus: "unpaid",
        createdAt: FieldValue.serverTimestamp(),
      });
      return { id: ref.id, pickupDate, ...pricing };
    });
    const result = {
      orders,
      subtotal: orders.reduce((sum, order) => sum + Math.round(order.subtotal * 100), 0) / 100,
      discountAmount: orders.reduce((sum, order) => sum + Math.round(order.discountAmount * 100), 0) / 100,
      total: orders.reduce((sum, order) => sum + Math.round(order.total * 100), 0) / 100,
    };
    transaction.set(receiptRef, { fingerprint, result, createdAt: FieldValue.serverTimestamp() });
    return result;
  });
}
