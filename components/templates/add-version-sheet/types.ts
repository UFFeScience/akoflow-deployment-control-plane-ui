import { Info, Layers, CheckCircle2, Settings2 } from "lucide-react"

export const STEPS = [
  { id: 0, key: "basic",            label: "Basic Info",              icon: Info,         optional: false },
  { id: 1, key: "definition",       label: "Definition",              icon: Layers,       optional: false },
  { id: 2, key: "provider-configs", label: "Provision",               icon: Settings2,    optional: true  },
  { id: 3, key: "review",           label: "Review",                  icon: CheckCircle2, optional: false },
] as const

export type StepKey = typeof STEPS[number]["key"]

export function bumpVersion(v: string | number | undefined): string {
  if (!v) return "1.0.0"
  const s = String(v)
  const parts = s.split(".")
  if (parts.length >= 3) {
    const patch = parseInt(parts[2], 10)
    return `${parts[0]}.${parts[1]}.${isNaN(patch) ? 1 : patch + 1}`
  }
  if (parts.length === 2) {
    const minor = parseInt(parts[1], 10)
    return `${parts[0]}.${isNaN(minor) ? 1 : minor + 1}`
  }
  const n = parseInt(s, 10)
  return isNaN(n) ? `${s}-2` : `${n + 1}`
}
