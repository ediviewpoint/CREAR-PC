export function ownsResource(
  stored: string | null | undefined,
  viewer: string | null | undefined,
): boolean {
  return Boolean(stored && viewer && stored === viewer);
}
