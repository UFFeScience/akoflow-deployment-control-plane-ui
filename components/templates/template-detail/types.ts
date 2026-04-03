import type { TemplateDefinition } from "@/lib/api/types"

export const RUNTIME_COLORS: Record<string, string> = {
  AKOFLOW: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  NVFLARE: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  FLARE:   "bg-purple-500/10 text-purple-600 border-purple-500/20",
  HPC:     "bg-amber-500/10 text-amber-600 border-amber-500/20",
  CUSTOM:  "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
}

export function countFields(def?: TemplateDefinition | null): number {
  if (!def) return 0
  return (def.environment_configuration?.sections ?? [])
    .reduce((acc, s) => acc + (s.fields?.length ?? 0), 0)
}
