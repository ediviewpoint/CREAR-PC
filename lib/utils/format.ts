const BOB_FORMATTER = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBob(amount: number): string {
  return BOB_FORMATTER.format(amount);
}

export function formatUsd(amount: number): string {
  return USD_FORMATTER.format(amount);
}

export function formatWatts(watts: number): string {
  return `${Math.round(watts)} W`;
}

export function formatMm(mm: number): string {
  return `${mm} mm`;
}

export function formatGhz(ghz: number): string {
  return `${ghz.toFixed(1)} GHz`;
}
