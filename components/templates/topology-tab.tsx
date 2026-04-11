"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, GitBranch, Terminal, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { templatesApi } from "@/lib/api/templates"
import type { ProviderConfiguration, TemplateVersion } from "@/lib/api/types"
import { parseTerraformGraph } from "./topology-tab/parse-terraform"
import type { TfNodeType } from "./topology-tab/parse-terraform"
import { parseAnsibleGraph } from "./topology-tab/parse-ansible"
import { TopologyGraph } from "./topology-tab/topology-graph"
import { AnsibleFlow } from "./topology-tab/ansible-flow"

const ALL_TYPES: TfNodeType[] = ["variable", "local", "data", "resource", "output"]

const TYPE_META: Record<TfNodeType, { label: string; badge: string; color: string; border: string }> = {
  variable: { label: "Variables", badge: "VAR",  color: "text-blue-600   dark:text-blue-400",   border: "border-blue-400/50"   },
  local:    { label: "Locals",    badge: "LCL",  color: "text-amber-600  dark:text-amber-400",  border: "border-amber-400/50"  },
  data:     { label: "Data",      badge: "DATA", color: "text-violet-600 dark:text-violet-400", border: "border-violet-400/50" },
  resource: { label: "Resources", badge: "RES",  color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-400/50" },
  output:   { label: "Outputs",   badge: "OUT",  color: "text-zinc-500   dark:text-zinc-400",   border: "border-zinc-400/50"   },
}

const PROVIDER_CHIP_META: Record<string, { label: string; color: string; border: string }> = {
  aws:        { label: "AWS",         color: "text-orange-600 dark:text-orange-400", border: "border-orange-400/50" },
  google:     { label: "GCP",         color: "text-blue-600   dark:text-blue-400",   border: "border-blue-400/50"   },
  azurerm:    { label: "Azure",       color: "text-sky-600    dark:text-sky-400",    border: "border-sky-400/50"    },
  kubernetes: { label: "Kubernetes",  color: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-400/50" },
  helm:       { label: "Helm",        color: "text-slate-600  dark:text-slate-400",  border: "border-slate-400/50"  },
}

interface Props {
  templateId: string
  versionId: string
  version: TemplateVersion
}

export function TopologyTab({ templateId, versionId }: Props) {
  const [configs, setConfigs]           = useState<ProviderConfiguration[]>([])
  const [activeId, setActiveId]         = useState<string | null>(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [visibleTypes, setVisibleTypes]     = useState<Set<TfNodeType>>(new Set(ALL_TYPES))
  const [hiddenProviders, setHiddenProviders] = useState<Set<string>>(new Set())

  const toggleType = (t: TfNodeType) =>
    setVisibleTypes(prev => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })

  const toggleProvider = (p: string) =>
    setHiddenProviders(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const list = await templatesApi.listProviderConfigurations(templateId, versionId)
      setConfigs(list)
      if (list.length > 0) setActiveId(list[0].id)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load configurations")
    } finally { setLoading(false) }
  }, [templateId, versionId])

  useEffect(() => { load() }, [load])

  const activeConfig = configs.find(c => c.id === activeId) ?? null

  const rawTfGraph = activeConfig?.terraform_module
    ? parseTerraformGraph(
        activeConfig.terraform_module.main_tf,
        activeConfig.terraform_module.variables_tf,
        activeConfig.terraform_module.outputs_tf,
      )
    : null

  const tfGraph = rawTfGraph
    ? {
        nodes: rawTfGraph.nodes.filter(n => visibleTypes.has(n.type)),
        edges: rawTfGraph.edges.filter(e => {
          const fromNode = rawTfGraph.nodes.find(n => n.id === e.from)
          const toNode   = rawTfGraph.nodes.find(n => n.id === e.to)
          return fromNode && toNode && visibleTypes.has(fromNode.type) && visibleTypes.has(toNode.type)
        }),
      }
    : null

  // Unique providers present in the raw graph (only data + resource nodes)
  const presentProviders = rawTfGraph
    ? [...new Set(
        rawTfGraph.nodes
          .filter(n => n.type === "resource" || n.type === "data")
          .map(n => { const p = n.detail?.split("_")[0]; return p && p !== n.detail ? p : undefined })
          .filter((p): p is string => !!p)
      )].sort()
    : []

  const ansibleGraph = activeConfig?.ansible_playbook
    ? parseAnsibleGraph(activeConfig.ansible_playbook.playbook_yaml)
    : null

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
      <Loader2 className="h-4 w-4 animate-spin" />Loading topology…
    </div>
  )

  if (error) return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />{error}
    </div>
  )

  if (configs.length === 0) return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <GitBranch className="h-7 w-7 text-muted-foreground/40" />
      <p className="text-sm font-medium">No provider configurations</p>
      <p className="text-xs text-muted-foreground/70">
        Add a provider configuration with Terraform HCL or a playbook to visualize the topology.
      </p>
    </div>
  )

  const hasSomething = (rawTfGraph?.nodes.length ?? 0) > 0 || !!ansibleGraph

  return (
    <div className="flex flex-col gap-5">
      {configs.length > 1 && (
        <div className="flex gap-0 rounded-lg border border-border overflow-hidden text-xs w-fit">
          {configs.map(cfg => (
            <button
              key={cfg.id}
              type="button"
              onClick={() => setActiveId(cfg.id)}
              className={cn(
                "px-4 py-1.5 font-medium transition-colors",
                activeId === cfg.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted/50",
              )}
            >
              {cfg.name}
            </button>
          ))}
        </div>
      )}

      {(rawTfGraph?.nodes.length ?? 0) > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Type filters */}
          {ALL_TYPES.filter(t => rawTfGraph!.nodes.some(n => n.type === t)).map(t => {
            const m = TYPE_META[t]
            const active = visibleTypes.has(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={cn(
                  "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold transition-all select-none",
                  active
                    ? cn("bg-background", m.color, m.border)
                    : "bg-muted/30 text-muted-foreground/40 border-border line-through",
                )}
              >
                {m.badge}
                <span className="font-normal">{m.label}</span>
              </button>
            )
          })}

          {/* Separator + Provider filters */}
          {presentProviders.length > 0 && (
            <>
              <div className="w-px h-4 bg-border mx-0.5" />
              {presentProviders.map(p => {
                const hidden = hiddenProviders.has(p)
                const meta = PROVIDER_CHIP_META[p] ?? { label: p.toUpperCase(), color: "text-zinc-500", border: "border-zinc-400/50" }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProvider(p)}
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
      )}

      {(tfGraph?.nodes.length ?? 0) > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Terraform Infrastructure</span>
            {activeConfig?.terraform_module?.module_slug && (
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                ({activeConfig.terraform_module.module_slug})
              </span>
            )}
          </div>
          <TopologyGraph graph={tfGraph!} hiddenProviders={[...hiddenProviders]} />
        </div>
      )}

      {ansibleGraph && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Playbook Automation</span>
          </div>
          <AnsibleFlow graph={ansibleGraph} />
        </div>
      )}

      {!hasSomething && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          No HCL or playbook content found in this configuration.
        </div>
      )}
    </div>
  )
}
