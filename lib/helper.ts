// utils/formatPrice.ts
type CountryCode = "US" | "ID" | "TW";

const currencyMap: Record<CountryCode, { locale: string; currency: string }> = {
  US: { locale: "en-US", currency: "USD" },
  ID: { locale: "id-ID", currency: "IDR" },
  TW: { locale: "zh-TW", currency: "TWD" },
};

export function formatPrice(
  value: number | string,
  country: CountryCode,
): string {
  const number = Number(value);
  if (isNaN(number)) return String(value);

  const { locale, currency } = currencyMap[country];

  // Format number only
  const formattedNumber = new Intl.NumberFormat(locale).format(number);

  // Append currency code behind
  return `${formattedNumber} ${currency}`;
}
