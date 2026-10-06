import { PricePoint, RankPoint } from "../types";
export const mergeHistory = (prices: PricePoint[], ranks: RankPoint[]) => {
  const points = new Map<
    string,
    { date: string; price: number | null; rank: number | null }
  >();
  for (const p of prices)
    points.set(p.date, {
      ...(points.get(p.date) || { date: p.date, price: null, rank: null }),
      price: p.price,
    });
  for (const r of ranks)
    points.set(r.date, {
      ...(points.get(r.date) || { date: r.date, price: null, rank: null }),
      rank: r.rank,
    });
  return [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
};
export const csvCell = (value: unknown) => {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
};
export const calculateProfit = (
  sale: number,
  buy: number,
  fees: (number | null | undefined)[],
) => {
  if (
    ![sale, buy, ...fees].every(
      (v) => typeof v === "number" && Number.isFinite(v) && v >= 0,
    )
  )
    return null;
  const profit = sale - buy - fees.reduce<number>((sum, v) => sum + v!, 0);
  return {
    profit: Math.round(profit * 100) / 100,
    roi: buy > 0 ? (profit / buy) * 100 : null,
    margin: sale > 0 ? (profit / sale) * 100 : null,
  };
};
export const safeWebUrl = (value: string) => {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};
