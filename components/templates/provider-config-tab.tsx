"use client"

import { useEffect, useState, useCallback } from "react"
import { Loader2, Plus, Settings2, Code2, Terminal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { templatesApi } from "@/lib/api/templates"
import type { ProviderConfiguration, TemplateVersion } from "@/lib/api/types"
import { ProviderMultiSelect } from "./provider-config/shared"
import { ConfigEditor } from "./provider-config/config-editor"

interface Props {
  templateId: string
  versionId: string
  version: TemplateVersion
}

export function ProviderConfigTab({ templateId, versionId, version }: Props) {
  const [configs, setConfigs] = useState<ProviderConfiguration[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newName, setNewName] = useState("")
  const [newProviders, setNewProviders] = useState<string[]>([])
  const [showNewForm, setShowNewForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await templatesApi.listProviderConfigurations(templateId, versionId)
      setConfigs(list)
      if (list.length > 0 && !activeId) setActiveId(list[0].id)
    } catch {
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }, [templateId, versionId])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreatingNew(true)
    try {
      const created = await templatesApi.createProviderConfiguration(templateId, versionId, {
        name: newName.trim(),
        applies_to_providers: newProviders,
      })
      setConfigs((prev) => [...prev, created])
      setActiveId(created.id)
      setNewName("")
      setNewProviders([])
      setShowNewForm(false)
    } finally {
      setCreatingNew(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await templatesApi.deleteProviderConfiguration(templateId, versionId, id)
      setConfigs((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) setActiveId(configs.find((c) => c.id !== id)?.id ?? null)
    } finally {
      setDeleting(null)
    }
  }

  const activeConfig = configs.find((c) => c.id === activeId) ?? null

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
        <Loader2 className="h-4 w-4 animate-spin" />Loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap">
        {configs.map((cfg) => (
          <div
            key={cfg.id}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
              activeId === cfg.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
            onClick={() => setActiveId(cfg.id)}
          >
            <Settings2 className="h-3 w-3 shrink-0" />
            <span>{cfg.name}</span>
            {cfg.applies_to_providers.length === 0 ? (
              <span className="text-[10px] opacity-70 font-normal">(default)</span>
            ) : (
              <span className="text-[10px] opacity-70 font-normal">({cfg.applies_to_providers.join(", ")})</span>
            )}
            {cfg.terraform_module && <Code2 className="h-2.5 w-2.5 shrink-0 opacity-70" />}
            {cfg.ansible_playbook && <Terminal className="h-2.5 w-2.5 shrink-0 opacity-70" />}
            <button
              className={cn(
                "ml-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity",
                deleting === cfg.id && "opacity-60",
              )}
              onClick={(e) => { e.stopPropagation(); handleDelete(cfg.id) }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {!showNewForm ? (
          <button
            className="inline-flex items-center gap-1 rounded border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            onClick={() => setShowNewForm(true)}
          >
            <Plus className="h-3 w-3" />New configuration
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap rounded border border-border p-2">
            <Input
              className="h-7 text-xs w-36"
              placeholder="Config name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <ProviderMultiSelect value={newProviders} onChange={setNewProviders} />
            <Button size="sm" className="h-7 text-xs" disabled={!newName.trim() || creatingNew} onClick={handleCreate}>
              {creatingNew ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
              Add
            </Button>
            <button className="text-xs text-muted-foreground" onClick={() => { setShowNewForm(false); setNewName(""); setNewProviders([]) }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {configs.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <Settings2 className="h-4 w-4" />
          No provider configurations yet. Add one to define Terraform HCL and Ansible playbooks.
        </div>
      )}

      {activeConfig && (
        <ConfigEditor
          key={activeConfig.id}
          templateId={templateId}
          versionId={versionId}
          config={activeConfig}
          onUpdated={(updated) => setConfigs((prev) => prev.map((c) => c.id === updated.id ? updated : c))}
          definition={version.definition_json}
        />
      )}
    </div>
  )
}
