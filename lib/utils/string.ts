export function getInitials(name?: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
