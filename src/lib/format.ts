export const money = (cents: number, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(cents / 100);

export const shortDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });

export const TAX_RATE = 0.08;
