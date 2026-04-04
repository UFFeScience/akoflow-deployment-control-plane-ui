"use client"

import { useCallback, useEffect, useState } from "react"
import { GitBranch, Terminal, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { templatesApi } from "@/lib/api/templates"
import type { ProviderConfiguration } from "@/lib/api/types"
import { parseTerraformGraph } from "@/components/templates/topology-tab/parse-terraform"
import type { TfNodeType } from "@/components/templates/topology-tab/parse-terraform"
import { parseAnsibleGraph } from "@/components/templates/topology-tab/parse-ansible"
import { TopologyGraph } from "@/components/templates/topology-tab/topology-graph"
import { AnsibleFlow } from "@/components/templates/topology-tab/ansible-flow"
import { TypeFilterBar, ALL_TYPES } from "./type-filter-bar"

interface TemplateGraphProps {
  templateId: string
  templateVersionId: string
}

export function TemplateGraph({ templateId, templateVersionId }: TemplateGraphProps) {
  const [configs, setConfigs] = useState<ProviderConfiguration[]>([])
  const [loading, setLoading] = useState(false)
  const [activeConfigId, setActiveConfigId] = useState<string>("")
  const [visibleTypes, setVisibleTypes] = useState<Set<TfNodeType>>(new Set(ALL_TYPES))
  const [hiddenProviders, setHiddenProviders] = useState<Set<string>>(new Set())

  const loadConfigs = useCallback(async () => {
    setLoading(true)
    try {
      const list = await templatesApi.listProviderConfigurations(templateId, templateVersionId)
      setConfigs(list)
      if (list.length > 0) setActiveConfigId(list[0].id)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [templateId, templateVersionId])

  useEffect(() => { loadConfigs() }, [loadConfigs])

  const toggleType = (t: TfNodeType) =>
    setVisibleTypes((prev) => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n })

  const toggleProvider = (p: string) =>
    setHiddenProviders((prev) => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n })

  const activeConfig = configs.find((c) => c.id === activeConfigId) ?? configs[0] ?? null

  const rawTfGraph = activeConfig?.terraform_module
    ? parseTerraformGraph(
        activeConfig.terraform_module.main_tf,
        activeConfig.terraform_module.variables_tf,
        activeConfig.terraform_module.outputs_tf,
      )
    : null

  const tfGraph = rawTfGraph
    ? {
        nodes: rawTfGraph.nodes.filter((n) => visibleTypes.has(n.type)),
        edges: rawTfGraph.edges.filter((e) => {
          const from = rawTfGraph.nodes.find((n) => n.id === e.from)
          const to   = rawTfGraph.nodes.find((n) => n.id === e.to)
          return from && to && visibleTypes.has(from.type) && visibleTypes.has(to.type)
        }),
      }
    : null

  const ansibleGraph = activeConfig?.ansible_playbook
    ? parseAnsibleGraph(activeConfig.ansible_playbook.playbook_yaml)
    : null

  const hasTfGraph = (tfGraph?.nodes.length ?? 0) > 0
  const hasAnsible = !!ansibleGraph

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading infrastructure graph…
      </div>
    )
  }

  if (!loading && configs.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <AlertCircle className="h-3.5 w-3.5" />
        No configurations found for this template version.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {configs.length > 1 && (
        <div className="flex gap-0 rounded-lg border border-border overflow-hidden text-xs w-fit">
          {configs.map((cfg) => (
            <button
              key={cfg.id}
              type="button"
              onClick={() => setActiveConfigId(cfg.id)}
              className={cn(
                "px-4 py-1.5 font-medium transition-colors",
                activeConfigId === cfg.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted/50",
              )}
            >
              {cfg.name}
            </button>
          ))}
        </div>
      )}

      {rawTfGraph && (
        <TypeFilterBar
          rawNodes={rawTfGraph.nodes}
          visibleTypes={visibleTypes}
          onToggleType={toggleType}
          hiddenProviders={hiddenProviders}
          onToggleProvider={toggleProvider}
        />
      )}

      {hasTfGraph && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Terraform Infrastructure</span>
          </div>
          <TopologyGraph graph={tfGraph!} hiddenProviders={[...hiddenProviders]} />
        </div>
      )}

      {hasAnsible && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Ansible Automation</span>
          </div>
          <AnsibleFlow graph={ansibleGraph!} />
        </div>
      )}

      {!hasTfGraph && !hasAnsible && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          No HCL or playbook content found in this configuration.
        </div>
      )}
    </div>
  )
}
