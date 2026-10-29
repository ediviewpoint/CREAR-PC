export const ROLES = ["LECTOR", "VENDEDOR", "EDITOR", "ADMIN"] as const;
export type UserRole = (typeof ROLES)[number];
export type Permission =
  "read" | "write" | "ai" | "availability" | "quote" | "delete" | "settings" | "cost" | "wordpress";
const minimum: Record<Permission, UserRole> = {
  read: "LECTOR",
  write: "EDITOR",
  ai: "EDITOR",
  availability: "VENDEDOR",
  quote: "VENDEDOR",
  delete: "ADMIN",
  settings: "ADMIN",
  cost: "ADMIN",
  wordpress: "EDITOR",
};
export function hasRole(actual: string | undefined, required: UserRole) {
  return ROLES.indexOf(actual as UserRole) >= ROLES.indexOf(required);
}
export function hasPermission(role: string | undefined, permission: Permission) {
  return hasRole(role, minimum[permission]);
}
export function redactCost<T extends Record<string, unknown>>(
  value: T,
  role: string,
): Omit<T, "costo" | "monedaCosto"> | T {
  if (role === "ADMIN") return value;
  const sanitized = { ...value };
  delete sanitized.costo;
  delete sanitized.monedaCosto;
  return sanitized;
}
