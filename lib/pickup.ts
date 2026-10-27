import { PICKUP_TIME_ZONE, PICKUP_WINDOW_DAYS } from "@/constant/product-order";

export function getTaipeiDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PICKUP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addPickupDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function isPickupDateAvailable(date: string, today = getTaipeiDate()) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false;
  const day = parsed.getUTCDay();
  return (day === 0 || day === 6) && date >= today && date <= addPickupDays(today, PICKUP_WINDOW_DAYS);
}

export function getDefaultPickupDate(today = getTaipeiDate()) {
  const day = new Date(`${today}T00:00:00Z`).getUTCDay();
  return day === 0 ? today : addPickupDays(today, (6 - day + 7) % 7);
}
