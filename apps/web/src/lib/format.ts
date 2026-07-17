type Currency = "EUR" | "CZK";

const priceFormats: Record<Currency, Intl.NumberFormat> = {
  EUR: new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" }),
  CZK: new Intl.NumberFormat("sk-SK", { style: "currency", currency: "CZK" }),
};

export function formatPrice(value: string | number, currency: Currency = "EUR"): string {
  const numberValue = typeof value === "string" ? Number(value) : value;
  return priceFormats[currency].format(numberValue);
}

const dateTimeFormat = new Intl.DateTimeFormat("sk-SK", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(value: Date | null | undefined): string {
  return value ? dateTimeFormat.format(value) : "—";
}

const dayFormat = new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "short" });

/** "2026-07-17" → "17. júl" */
export function formatDay(isoDay: string): string {
  return dayFormat.format(new Date(`${isoDay}T00:00:00`));
}
