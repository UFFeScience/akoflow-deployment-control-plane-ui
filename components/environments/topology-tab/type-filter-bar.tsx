"use client"

import { cn } from "@/lib/utils"
import type { TfNodeType } from "@/components/templates/topology-tab/parse-terraform"

export const ALL_TYPES: TfNodeType[] = ["variable", "local", "data", "resource", "output"]

export const TYPE_META: Record<TfNodeType, { label: string; badge: string; color: string; border: string }> = {
  variable: { label: "Variables", badge: "VAR",  color: "text-blue-600   dark:text-blue-400",   border: "border-blue-400/50"   },
  local:    { label: "Locals",    badge: "LCL",  color: "text-amber-600  dark:text-amber-400",  border: "border-amber-400/50"  },
  data:     { label: "Data",      badge: "DATA", color: "text-violet-600 dark:text-violet-400", border: "border-violet-400/50" },
  resource: { label: "Resources", badge: "RES",  color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-400/50" },
  output:   { label: "Outputs",   badge: "OUT",  color: "text-zinc-500   dark:text-zinc-400",   border: "border-zinc-400/50"   },
}

export const PROVIDER_CHIP_META: Record<string, { label: string; color: string; border: string }> = {
  aws:        { label: "AWS",        color: "text-orange-600 dark:text-orange-400", border: "border-orange-400/50" },
  google:     { label: "GCP",        color: "text-blue-600   dark:text-blue-400",   border: "border-blue-400/50"   },
  azurerm:    { label: "Azure",      color: "text-sky-600    dark:text-sky-400",    border: "border-sky-400/50"    },
  kubernetes: { label: "Kubernetes", color: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-400/50" },
  helm:       { label: "Helm",       color: "text-slate-600  dark:text-slate-400",  border: "border-slate-400/50"  },
}

interface TypeFilterBarProps {
  rawNodes: Array<{ type: TfNodeType; detail?: string }>
  visibleTypes: Set<TfNodeType>
  onToggleType: (t: TfNodeType) => void
  hiddenProviders: Set<string>
  onToggleProvider: (p: string) => void
}

export function TypeFilterBar({ rawNodes, visibleTypes, onToggleType, hiddenProviders, onToggleProvider }: TypeFilterBarProps) {
  const presentTypes = ALL_TYPES.filter((t) => rawNodes.some((n) => n.type === t))

  const presentProviders = [...new Set(
    rawNodes
      .filter((n) => n.type === "resource" || n.type === "data")
      .map((n) => { const p = n.detail?.split("_")[0]; return p && p !== n.detail ? p : undefined })
      .filter((p): p is string => !!p),
  )].sort()

  if (presentTypes.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {presentTypes.map((t) => {
        const m = TYPE_META[t]
        const active = visibleTypes.has(t)
        return (
          <button
            key={t}
            type="button"
            onClick={() => onToggleType(t)}
            className={cn(
              "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold transition-all select-none",
              active
                ? cn("bg-background", m.color, m.border)
                : "bg-muted/30 text-muted-foreground/40 border-border line-through",
            )}
          >
            {m.badge} <span className="font-normal">{m.label}</span>
          </button>
        )
      })}

      {presentProviders.length > 0 && (
        <>
          <div className="w-px h-4 bg-border mx-0.5" />
          {presentProviders.map((p) => {
            const hidden = hiddenProviders.has(p)
            const meta = PROVIDER_CHIP_META[p] ?? { label: p.toUpperCase(), color: "text-zinc-500", border: "border-zinc-400/50" }
            return (
              <button
                key={p}
                type="button"
                onClick={() => onToggleProvider(p)}
                className={cn(
                  "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold transition-all select-none",
                  !hidden
                    ? cn("bg-background", meta.color, meta.border)
                    : "bg-muted/30 text-muted-foreground/40 border-border line-through",
                )}
              >
                {meta.label}
              </button>
            )
          })}
        </>
      )}
    </div>
  )
}
