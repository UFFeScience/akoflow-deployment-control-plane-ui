"use client"

import { Terminal } from "lucide-react"
import { useState } from "react"
import type { ProviderConfiguration } from "@/lib/api/types"

const HPC_PROVIDERS = new Set(["hpc", "on_prem"])

interface AnsibleAutomationInfoProps {
  playbooks: ProviderConfiguration[]
}

export function AnsibleAutomationInfo({ playbooks }: AnsibleAutomationInfoProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Terminal className="h-4 w-4 text-green-500" />
        <p className="text-xs font-semibold text-foreground">Configuração de Ambiente (Ansible)</p>
        <span className="text-[10px] rounded bg-green-500/10 text-green-700 dark:text-green-400 px-1.5 py-0.5 font-medium">
          {playbooks.length} playbook{playbooks.length !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Os campos preenchidos acima serão enviados ao Ansible como{" "}
        <code className="font-mono">extra_vars</code> para configurar as máquinas deste ambiente.
      </p>
      <div className="flex flex-col gap-1.5">
        {playbooks.map((cfg) => (
          <PlaybookCard
            key={String(cfg.id ?? cfg.name)}
            cfg={cfg}
            expanded={expanded}
            onToggle={setExpanded}
          />
        ))}
      </div>
    </div>
  )
}

interface PlaybookCardProps {
  cfg: ProviderConfiguration
  expanded: string | null
  onToggle: (key: string | null) => void
}

function PlaybookCard({ cfg, expanded, onToggle }: PlaybookCardProps) {
  const pb = cfg.ansible_playbook!
  const appliesTo = cfg.applies_to_providers ?? []
  const isHpc = appliesTo.some((p) => HPC_PROVIDERS.has(p.toLowerCase())) || appliesTo.length === 0
  const configKey = String(cfg.id ?? cfg.name)
  const isOpen = expanded === configKey
  const roles = Array.isArray(pb.roles_json) ? pb.roles_json : []
  const mappedVars = Object.values(
    (pb.vars_mapping_json as any)?.environment_configuration ?? {}
  ).filter(Boolean) as string[]

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(isOpen ? null : configKey)}
        className="w-full flex items-center gap-3 px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide font-mono text-foreground">
          {cfg.name}
        </span>
        {appliesTo.length > 0 ? (
          appliesTo.map((p) => (
            <span key={p} className="text-[10px] rounded bg-sky-500/10 text-sky-700 dark:text-sky-400 px-1.5 py-0.5 font-medium">{p}</span>
          ))
        ) : (
          <span className="text-[10px] rounded bg-zinc-500/10 text-zinc-600 px-1.5 py-0.5 font-medium">default</span>
        )}
        {roles.length > 0 && (
          <span className="text-[10px] text-muted-foreground">{roles.length} role{roles.length !== 1 ? "s" : ""}</span>
        )}
        {mappedVars.length > 0 && (
          <span className="text-[10px] text-muted-foreground">{mappedVars.length} var{mappedVars.length !== 1 ? "s" : ""}</span>
        )}
        <span className="ml-auto text-muted-foreground text-[10px]">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="px-3 py-3 flex flex-col gap-3">
          {mappedVars.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Extra vars</p>
              <div className="flex flex-wrap gap-1">
                {mappedVars.map((v) => (
                  <code key={v} className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">{v}</code>
                ))}
              </div>
            </div>
          )}

          {isHpc && pb.inventory_template && (
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Inventory template</p>
              <pre className="text-[11px] font-mono bg-muted/50 rounded-lg p-2 overflow-auto max-h-28 leading-relaxed text-foreground">
                {pb.inventory_template}
              </pre>
            </div>
          )}

          {roles.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Galaxy roles</p>
              <div className="flex flex-wrap gap-1">
                {roles.map((r, i) => (
                  <code key={i} className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono">
                    {typeof r === "string" ? r : (r as any).name}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
