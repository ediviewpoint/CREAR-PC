import { searchPriceCents } from "./productos/query";
export const parseAmount = searchPriceCents;
export function roundBob(cents: number, enabled = true) {
  return enabled ? Math.round(cents / 1000) * 1000 : Math.round(cents);
}
export function withInvoice(cents: number, markup = 16, round = true) {
  return roundBob(Math.round((cents * (100 + markup)) / 100), round);
}
export function usdToBob(cents: number, rate: number, round = true) {
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Tipo de cambio inválido");
  return roundBob(Math.round(cents * rate), round);
}
export function formatAmount(cents: number | null, usd = false) {
  return cents === null
    ? "—"
    : `${usd ? "$us " : "Bs"}${new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)}`;
}
