"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Plus, Check, Clock, Globe, Lock, Cpu, Layers,
  ChevronDown, Sparkles, FileCode2, AlertCircle, RefreshCw, Code2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { templatesApi } from "@/lib/api/templates"
import { DefinitionViewer } from "./definition-viewer"
import { AddVersionSheet } from "./add-version-sheet"
import { TerraformModuleTab } from "./terraform-module-tab"
import type { Template, TemplateVersion } from "@/lib/api/types"
import { cn } from "@/lib/utils"

const RUNTIME_COLORS: Record<string, string> = {
  AKOFLOW: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  NVFLARE: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  FLARE:   "bg-purple-500/10 text-purple-600 border-purple-500/20",
  HPC:     "bg-amber-500/10 text-amber-600 border-amber-500/20",
  CUSTOM:  "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
}

export function TemplateDetail({ templateId }: { templateId: string }) {
  const router = useRouter()
  const [template, setTemplate] = useState<Template | null>(null)
  const [versions, setVersions] = useState<TemplateVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [activating, setActivating] = useState<string | null>(null)
  const [addVersionOpen, setAddVersionOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [tpl, vers] = await Promise.all([
        templatesApi.get(templateId),
        templatesApi.listVersions(templateId),
      ])
      setTemplate(tpl)
      setVersions(vers)
      // default: first active version, fallback to latest
      const active = vers.find((v) => v.is_active)
      setSelectedVersionId(active?.id ?? vers[0]?.id ?? null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [templateId])

  useEffect(() => { load() }, [load])

  const handleActivate = async (versionId: string) => {
    setActivating(versionId)
    try {
      await templatesApi.activateVersion(templateId, versionId)
      setVersions((prev) => prev.map((v) => ({ ...v, is_active: v.id === versionId })))
    } finally {
      setActivating(null)
    }
  }

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) ?? null
  const runtimeColor = RUNTIME_COLORS[template?.runtime_type ?? "CUSTOM"] ?? RUNTIME_COLORS.CUSTOM

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="h-8 w-48 rounded animate-pulse bg-muted" />
        <div className="h-32 rounded-lg border animate-pulse bg-muted" />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Link href="/organization/templates" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-fit">
          <ArrowLeft className="h-3.5 w-3.5" /> Templates
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error ?? "Template not found."}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Breadcrumb */}
      <Link href="/organization/templates" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-3.5 w-3.5" /> Templates
      </Link>

      {/* Header card */}
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <FileCode2 className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate">{template.name}</h1>
              {template.slug && (
                <code className="text-xs text-muted-foreground font-mono">{template.slug}</code>
              )}
            </div>
          </div>
          <Button size="sm" className="h-8 gap-1.5 text-xs shrink-0" onClick={() => setAddVersionOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Version
          </Button>
        </div>

        {template.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{template.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {template.runtime_type && (
            <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium", runtimeColor)}>
              <Cpu className="h-3 w-3" />{template.runtime_type}
            </span>
          )}
          {template.is_public ? (
            <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium bg-green-500/10 text-green-600 border-green-500/20">
              <Globe className="h-3 w-3" />Public
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium bg-zinc-500/10 text-zinc-600 border-zinc-500/20">
              <Lock className="h-3 w-3" />Private
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
            <Layers className="h-3 w-3" />{versions.length} version{versions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Tabs: Versions + Definition + Terraform */}
      <Tabs defaultValue="versions" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="versions" className="text-xs h-7">Versions</TabsTrigger>
          <TabsTrigger value="definition" className="text-xs h-7">Definition</TabsTrigger>
          <TabsTrigger value="terraform" className="text-xs h-7 gap-1">
            <Code2 className="h-3 w-3" />Terraform
          </TabsTrigger>
        </TabsList>

        {/* Versions tab */}
        <TabsContent value="versions" className="mt-4">
          <div className="flex flex-col gap-2">
            {versions.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
                <Layers className="h-7 w-7 text-muted-foreground/50" />
                <p className="text-sm font-medium">No versions yet</p>
                <Button size="sm" className="h-8 text-xs" onClick={() => setAddVersionOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Add first version
                </Button>
              </div>
            )}
            {versions.map((ver) => (
              <VersionRow
                key={ver.id}
                version={ver}
                isSelected={ver.id === selectedVersionId}
                activating={activating === ver.id}
                onClick={() => setSelectedVersionId(ver.id)}
                onActivate={() => handleActivate(ver.id)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Definition tab */}
        <TabsContent value="definition" className="mt-4">
          {/* Version selector */}
          {versions.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Viewing version:</span>
              <select
                className="h-7 rounded border border-border bg-background px-2 text-xs"
                value={selectedVersionId ?? ""}
                onChange={(e) => setSelectedVersionId(e.target.value)}
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.version}{v.is_active ? " (active)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedVersion?.definition_json ? (
            <DefinitionViewer definition={selectedVersion.definition_json} />
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              {selectedVersion ? "This version has no definition." : "Select a version to view its definition."}
            </div>
          )}
        </TabsContent>

        {/* Terraform tab */}
        <TabsContent value="terraform" className="mt-4">
          {/* Version selector */}
          {versions.length > 0 && (
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs text-muted-foreground">Version:</span>
              <select
                className="h-7 rounded border border-border bg-background px-2 text-xs"
                value={selectedVersionId ?? ""}
                onChange={(e) => setSelectedVersionId(e.target.value)}
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.version}{v.is_active ? " (active)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedVersion && selectedVersionId ? (
            <TerraformModuleTab
              key={selectedVersionId}
              templateId={templateId}
              versionId={selectedVersionId}
              version={selectedVersion}
            />
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Select a version to configure its Terraform module.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Version Sheet */}
      <AddVersionSheet
        open={addVersionOpen}
        onOpenChange={setAddVersionOpen}
        templateId={templateId}
        activeVersion={versions.find((v) => v.is_active) ?? versions[versions.length - 1] ?? null}
        onCreated={() => { setAddVersionOpen(false); load() }}
      />
    </div>
  )
}

interface VersionRowProps {
  version: TemplateVersion
  isSelected: boolean
  activating: boolean
  onClick: () => void
  onActivate: () => void
}

function VersionRow({ version, isSelected, activating, onClick, onActivate }: VersionRowProps) {
  const date = version.created_at ?? version.createdAt
  const fieldCount = countFields(version.definition_json)

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
        isSelected ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:bg-accent/30",
      )}
    >
      {/* Left: version + active badge */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <code className="text-sm font-mono font-semibold">v{version.version}</code>
        {version.is_active && (
          <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium bg-green-500/10 text-green-600 border-green-500/20">
            <Sparkles className="h-2.5 w-2.5" />active
          </span>
        )}
        {version.terraform_modules && version.terraform_modules.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/10 text-orange-600 border-orange-500/20">
            TF: {version.terraform_modules.map((m) => m.provider_type.toUpperCase()).join(", ")}
          </span>
        )}
      </div>

      {/* Middle: stats */}
      <span className="text-[11px] text-muted-foreground shrink-0">
        {fieldCount} fields
      </span>

      {/* Date */}
      {date && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
          <Clock className="h-3 w-3" />
          {new Date(date).toLocaleDateString()}
        </span>
      )}

      {/* Activate button */}
      {!version.is_active && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px] shrink-0"
          disabled={activating}
          onClick={(e) => { e.stopPropagation(); onActivate() }}
        >
          {activating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
          Activate
        </Button>
      )}
    </div>
  )
}

function countFields(def?: TemplateDefinition | null): number {
  if (!def) return 0
  let count = 0
  const countSections = (sections: any[]) => {
    sections?.forEach((s) => { count += s.fields?.length ?? 0 })
  }
  if (def.environment_configuration?.sections) countSections(def.environment_configuration.sections)
  Object.values(def.instance_configurations ?? {}).forEach((cfg: any) => countSections(cfg.sections ?? []))
  return count
}
