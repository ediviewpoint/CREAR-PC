export function warrantyLabel(months?: number | null) {
  if (months === null || months === undefined) return "Por confirmar";
  if (months === 0) return "Sin cobertura comercial adicional";
  return `${months} ${months === 1 ? "mes" : "meses"}`;
}
